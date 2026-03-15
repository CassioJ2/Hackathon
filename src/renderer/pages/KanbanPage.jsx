import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import KanbanColumn from "../components/KanbanColumn";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";
import LoadingSpinner from "../components/LoadingSpinner";
import styles from "./KanbanPage.module.css";
import Toast from "../components/Toast";
import logo from "../logo.svg";
import { useColumns } from "../context/ColumnsContext";
import { useFlags } from "../context/FlagsContext";
import ColumnsManager from "../components/ColumnsManager";

function mergeTasksForReview(localTasks, remoteTasks) {
  const localById = new Map(localTasks.map((task) => [task.id, task]));
  const remoteById = new Map(remoteTasks.map((task) => [task.id, task]));
  const merged = [];

  for (const localTask of localTasks) {
    const remoteTask = remoteById.get(localTask.id);

    if (!remoteTask) {
      merged.push(localTask);
      continue;
    }

    if (JSON.stringify(localTask) === JSON.stringify(remoteTask)) {
      merged.push(localTask);
      continue;
    }

    const localSubtasks = Array.isArray(localTask.subtasks) ? localTask.subtasks : [];
    const remoteSubtasks = Array.isArray(remoteTask.subtasks) ? remoteTask.subtasks : [];
    const localSubtasksById = new Map(localSubtasks.map((subtask) => [subtask.id, subtask]));
    const mergedSubtasks = [...localSubtasks];

    for (const remoteSubtask of remoteSubtasks) {
      if (!localSubtasksById.has(remoteSubtask.id)) {
        mergedSubtasks.push(remoteSubtask);
      }
    }

    merged.push({
      ...remoteTask,
      ...localTask,
      labels: Array.from(new Set([...(remoteTask.labels || []), ...(localTask.labels || [])])),
      subtasks: mergedSubtasks,
    });
  }

  for (const remoteTask of remoteTasks) {
    if (!localById.has(remoteTask.id)) {
      merged.push(remoteTask);
    }
  }

  return merged;
}

export default function KanbanPage({
  initialTasks = [],
  initialHasChanges = false,
  activeRepo,
  onTasksChange,
  onDirtyChange,
  onLogout,
  onChangeRepo,
}) {
  const DEFAULT_BOARD_STATUS = "pending";
  const [tasks, setTasks] = useState(initialTasks);
  const [step, setStep] = useState("ready");
  const [error, setError] = useState("");
  const [activeTask, setActiveTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [toast, setToast] = useState(null);
  const [hasChanges, setHasChanges] = useState(initialHasChanges);
  const [collaborators, setCollaborators] = useState([]);
  const [incomingConflict, setIncomingConflict] = useState(null);
  const [activeView, setActiveView] = useState("board");
  const [backlogSearch, setBacklogSearch] = useState("");
  const [backlogPriority, setBacklogPriority] = useState("");
  const [backlogAssignee, setBacklogAssignee] = useState("");
  const [backlogLabel, setBacklogLabel] = useState("");
  const [backlogSort, setBacklogSort] = useState("priority");
  const tasksRef = useRef(initialTasks);

  const { columns } = useColumns();
  const { allFlags } = useFlags();
  const [showColumnsManager, setShowColumnsManager] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  useEffect(() => {
    setTasks(initialTasks);
    tasksRef.current = initialTasks;
    setStep("ready");
    setHasChanges(initialHasChanges);
  }, [initialTasks, initialHasChanges]);

  useEffect(() => {
    tasksRef.current = tasks;
    onTasksChange?.(tasks);
  }, [tasks, onTasksChange]);

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  useEffect(() => {
    const cleanup = window.electron.on(
      "tasks:external-update",
      (updatedTasks) => {
        setTasks(updatedTasks);
        setHasChanges(false);
        setIncomingConflict(null);
        setToast({
          message: "Tasks atualizadas pelo GitHub!",
          type: "success",
        });
      },
    );

    const cleanupConflict = window.electron.on(
      "tasks:remote-conflict",
      (incomingTasks) => {
        setIncomingConflict({ tasks: incomingTasks, source: "github" });
        setToast({
          message: "Mudanca remota detectada. Escolha manter local ou carregar remoto.",
          type: "warning",
        });
      },
    );

    const cleanupLocalUpdate = window.electron.on(
      "tasks:local-file-update",
      (updatedTasks) => {
        setTasks(updatedTasks);
        setHasChanges(false);
        setIncomingConflict(null);
        setToast({
          message: "Tasks atualizadas pelo arquivo local!",
          type: "success",
        });
      },
    );

    const cleanupLocalConflict = window.electron.on(
      "tasks:local-file-conflict",
      (incomingTasks) => {
        setIncomingConflict({ tasks: incomingTasks, source: "local" });
        setToast({
          message: "Mudanca detectada no tasks.md local. Escolha manter local ou carregar arquivo.",
          type: "warning",
        });
      },
    );

    return () => {
      cleanup?.();
      cleanupConflict?.();
      cleanupLocalUpdate?.();
      cleanupLocalConflict?.();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadCollaborators = async () => {
      if (!activeRepo?.owner || !activeRepo?.repo) {
        if (isMounted) {
          setCollaborators([]);
        }
        return;
      }

      try {
        const result = await window.electron.invoke("github:repo-collaborators");

        if (isMounted) {
          setCollaborators(Array.isArray(result) ? result : []);
        }
      } catch {
        if (isMounted) {
          setCollaborators([]);
        }
      }
    };

    loadCollaborators();

    return () => {
      isMounted = false;
    };
  }, [activeRepo?.owner, activeRepo?.repo]);

  const collaboratorsByLogin = useMemo(
    () =>
      collaborators.reduce((acc, collaborator) => {
        acc[collaborator.login] = collaborator;
        return acc;
      }, {}),
    [collaborators],
  );

  const persistTasksLocally = async (updatedTasks, dirty = true) => {
    try {
      await window.electron.invoke("tasks:cache", { tasks: updatedTasks, dirty });
    } catch (err) {
      setError(err.message);
      setStep("error");
    }
  };

  const updateTasksLocally = (updatedTasks) => {
    setTasks(updatedTasks);
    setHasChanges(true);
    setIncomingConflict(null);
    persistTasksLocally(updatedTasks, true);
  };

  const handleSync = async () => {
    try {
      setStep("syncing");
      setError("");
      const result = await window.electron.invoke("tasks:save", {
        tasks: tasksRef.current,
        commitMessage: "chore: update tasks",
      });
      if (result?.tasks) {
        setTasks(result.tasks);
      }
      setStep("ready");
      setHasChanges(false);
      setIncomingConflict(null);
      setToast({ message: "Sincronizado com GitHub!", type: "success" });
    } catch (err) {
      setError(err.message);
      setStep("error");
    }
  };

  const handlePullRemote = async () => {
    try {
      setStep("syncing");
      setError("");
      const result = await window.electron.invoke("tasks:pull");

      if (result?.mode === "conflict") {
        setIncomingConflict({ tasks: result.tasks || [], source: "github" });
        setStep("ready");
        setToast({
          message: "Mudancas remotas encontradas. Revise antes de aplicar.",
          type: "warning",
        });
        return;
      }

      setTasks(result?.tasks || []);
      setHasChanges(false);
      setIncomingConflict(null);
      setStep("ready");
      setToast({
        message: "Versao remota puxada com sucesso.",
        type: "success",
      });
    } catch (err) {
      setError(err.message);
      setStep("error");
    }
  };

  const findColumn = (taskId) =>
    columns.find((col) =>
      tasks.find((t) => t.id === taskId && t.status === col.id),
    )?.id;

  const handleDragStart = ({ active }) => {
    setActiveTask(tasks.find((t) => t.id === active.id) || null);
  };

  const handleDragOver = ({ active, over }) => {
    if (!over) return;
    const activeCol = findColumn(active.id);
    const overCol =
      columns.find((c) => c.id === over.id)?.id || findColumn(over.id);
    if (!activeCol || !overCol || activeCol === overCol) return;
    updateTasksLocally(
      tasks.map((t) => (t.id === active.id ? { ...t, status: overCol } : t)),
    );
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;
    const updated = [...tasks];
    const activeIndex = updated.findIndex((t) => t.id === active.id);
    const overIndex = updated.findIndex((t) => t.id === over.id);
    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      updateTasksLocally(arrayMove(updated, activeIndex, overIndex));
    }
  };

  const handleSubtaskToggle = (taskId, subtaskId) => {
    updateTasksLocally(
      tasks.map((task) => {
        if (task.id !== taskId) return task;

        return {
          ...task,
          subtasks: task.subtasks.map((subtask) =>
            subtask.id === subtaskId
              ? {
                  ...subtask,
                  status: subtask.status === "done" ? "pending" : "done",
                }
              : subtask,
          ),
        };
      }),
    );
  };

  const handleDeleteTask = (taskId) => {
    updateTasksLocally(tasks.filter((t) => t.id !== taskId));
  };

  const handleEditTask = (task) => setEditingTask(task);

  const handleSaveEdit = (updatedTask) => {
    updateTasksLocally(
      tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    );
    setEditingTask(null);
  };

  const handleCreateTask = (newTask) => {
    updateTasksLocally([...tasks, newTask]);
  };

  const handleSendToBoard = (task) => {
    updateTasksLocally(
      tasks.map((item) =>
        item.id === task.id
          ? { ...item, status: columns[0]?.id || DEFAULT_BOARD_STATUS }
          : item,
      ),
    );
    setToast({ message: "Task enviada para o board.", type: "success" });
  };

  const handleMoveToBacklog = (task) => {
    updateTasksLocally(
      tasks.map((item) =>
        item.id === task.id ? { ...item, status: "backlog" } : item,
      ),
    );
    setToast({ message: "Task movida para o backlog.", type: "success" });
  };

  const handleInitializeTasks = async () => {
    try {
      setStep("syncing");
      setError("");
      const result = await window.electron.invoke("tasks:init", {
        force: true,
      });
      setTasks(result.tasks);
      setHasChanges(true);
      setIncomingConflict(null);
      setStep("ready");
      setToast({ message: "Backlog local recriado!", type: "success" });
    } catch (err) {
      setError(err.message);
      setStep("error");
    }
  };

  const handleOpenTasksFile = async () => {
    try {
      setError("");
      await window.electron.invoke("repo:open-tasks-file");
      setToast({
        message: "tasks.md aberto no editor padrao.",
        type: "success",
      });
    } catch (err) {
      setError(err.message);
      setStep("error");
    }
  };

  const handleLogout = async () => {
    await window.electron.invoke("session:clear");
    onLogout();
  };

  const handleKeepLocal = () => {
    setIncomingConflict(null);
    setToast({
      message: "Mantendo alteracoes locais. Faça sync quando estiver pronto.",
      type: "warning",
    });
  };

  const handleLoadRemote = async () => {
    if (!incomingConflict) return;

    try {
      setTasks(incomingConflict.tasks);
      setHasChanges(false);
      await persistTasksLocally(incomingConflict.tasks, false);
      setIncomingConflict(null);
      setToast({
        message:
          incomingConflict.source === "local"
            ? "Versao do arquivo local carregada no board."
            : "Versao remota carregada no cache local.",
        type: "success",
      });
    } catch (err) {
      setError(err.message);
      setStep("error");
    }
  };

  const handleMergeIncoming = async () => {
    if (!incomingConflict) return;

    try {
      const mergedTasks = mergeTasksForReview(tasksRef.current, incomingConflict.tasks);
      setTasks(mergedTasks);
      setHasChanges(true);
      await persistTasksLocally(mergedTasks, true);
      setIncomingConflict(null);
      setToast({
        message: "Merge local criado. Revise e sincronize quando estiver pronto.",
        type: "success",
      });
    } catch (err) {
      setError(err.message);
      setStep("error");
    }
  };

  const incomingSummary = useMemo(() => {
    if (!incomingConflict) {
      return null;
    }

    const localIds = new Set(tasks.map((task) => task.id));
    const incomingIds = new Set(incomingConflict.tasks.map((task) => task.id));
    let changed = 0;
    let added = 0;

    for (const incomingTask of incomingConflict.tasks) {
      if (!localIds.has(incomingTask.id)) {
        added += 1;
        continue;
      }

      const localTask = tasks.find((task) => task.id === incomingTask.id);
      if (JSON.stringify(localTask) !== JSON.stringify(incomingTask)) {
        changed += 1;
      }
    }

    let localOnly = 0;
    for (const task of tasks) {
      if (!incomingIds.has(task.id)) {
        localOnly += 1;
      }
    }

    return { added, changed, localOnly };
  }, [incomingConflict, tasks]);

  const tasksByStatus = (status) => tasks.filter((t) => t.status === status);
  const backlogTasks = tasks.filter((task) => task.status === "backlog");
  const filteredBacklogTasks = useMemo(() => {
    const filtered = backlogTasks.filter((task) => {
      const query = backlogSearch.trim().toLowerCase();
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query);
      const matchesPriority =
        !backlogPriority || task.priority === backlogPriority;
      const matchesAssignee =
        !backlogAssignee || task.assignee === backlogAssignee;
      const matchesLabel =
        !backlogLabel || task.labels?.includes(backlogLabel);

      return (
        matchesSearch && matchesPriority && matchesAssignee && matchesLabel
      );
    });

    const priorityWeight = { high: 0, medium: 1, low: 2, "": 3 };

    return [...filtered].sort((a, b) => {
      if (backlogSort === "priority") {
        return (
          (priorityWeight[a.priority || ""] ?? 9) -
          (priorityWeight[b.priority || ""] ?? 9)
        );
      }

      if (backlogSort === "assignee") {
        return (a.assignee || "").localeCompare(b.assignee || "");
      }

      if (backlogSort === "type") {
        return (a.cardType || "").localeCompare(b.cardType || "");
      }

      return a.title.localeCompare(b.title);
    });
  }, [
    backlogAssignee,
    backlogLabel,
    backlogPriority,
    backlogSearch,
    backlogSort,
    backlogTasks,
  ]);
  const storageModeLabel = activeRepo?.localPath ? "Repo local" : "Cache interno";
  const tasksBranchLabel = activeRepo?.tasksBranch || "tasks";

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <img src={logo} width="60" height="60" alt="CodeSprint" />
          <h1 className={styles.appName}>CodeSprint</h1>
          {activeRepo && (
            <>
              <span className={styles.repoBadge}>
                {activeRepo.owner}/{activeRepo.repo}
              </span>
              <span className={styles.storageBadge}>
                {storageModeLabel}
              </span>
              <span className={styles.branchBadge}>
                Branch de tasks: {tasksBranchLabel}
              </span>
              <span className={styles.managedFilesBadge}>
                Arquivos: tasks.md + playbook/
              </span>
            </>
          )}
        </div>

        <div className={styles.headerCenter}>
          <div className={styles.viewTabs}>
            <button
              className={`${styles.viewTab} ${activeView === "board" ? styles.viewTabActive : ""}`}
              onClick={() => setActiveView("board")}
            >
              Board
            </button>
            <button
              className={`${styles.viewTab} ${activeView === "backlog" ? styles.viewTabActive : ""}`}
              onClick={() => setActiveView("backlog")}
            >
              Backlog
            </button>
          </div>
          <button
            className={styles.btnNewTask}
            onClick={() => setShowModal(true)}
          >
            + Nova task
          </button>
          <button
            className={styles.btnFlags}
            onClick={handleOpenTasksFile}
          >
            Abrir tasks.md
          </button>
          <button className={styles.btnFlags} onClick={handlePullRemote}>
            Puxar remoto
          </button>
          <button className={styles.btnFlags} onClick={onChangeRepo}>
            Trocar repo
          </button>
          <button
            className={styles.btnFlags}
            onClick={() => setShowColumnsManager(true)}
          >
            Colunas
          </button>
        </div>

        <div className={styles.headerRight}>
          {step === "error" && (
            <span className={styles.errorText}>{error}</span>
          )}
          <button
            className={`${styles.btnSync} ${hasChanges ? styles.btnSyncPending : ""}`}
            onClick={handleSync}
            disabled={step === "syncing" || !hasChanges}
          >
            {step === "syncing" ? (
              <>
                <LoadingSpinner size="sm" /> Sincronizando...
              </>
            ) : hasChanges ? (
              "Sync"
            ) : (
              "Sincronizado"
            )}
          </button>
          <button className={styles.btnLogout} onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      {incomingConflict && (
        <div className={styles.conflictBar}>
          <div className={styles.conflictText}>
            {incomingConflict.source === "local"
              ? "O arquivo tasks.md local mudou fora do app e voce tem mudancas locais pendentes."
              : "Existe uma versao mais nova no GitHub e voce tem mudancas locais pendentes."}
            {incomingSummary && (
              <span className={styles.conflictSummary}>
                {incomingSummary.added} novas, {incomingSummary.changed} alteradas, {incomingSummary.localOnly} so locais.
              </span>
            )}
          </div>
          <div className={styles.conflictActions}>
            <button className={styles.btnFlags} onClick={handleKeepLocal}>
              Manter local
            </button>
            <button className={styles.btnFlags} onClick={handleMergeIncoming}>
              Mesclar
            </button>
            <button className={styles.btnPrimary} onClick={handleLoadRemote}>
              {incomingConflict.source === "local"
                ? "Carregar arquivo"
                : "Carregar remoto"}
            </button>
          </div>
        </div>
      )}

      {step === "loading" ? (
        <div className={styles.loadingWrap}>
          <LoadingSpinner />
          <p>Carregando tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>Nenhuma task no backlog</h2>
          <p className={styles.emptyText}>
            Esse repositorio esta sem tasks no momento. Voce pode criar uma task
            nova agora ou recriar o <code>tasks.md</code> inicial com o modelo
            padrao. Se preferir, abra o arquivo no VS Code e edite por la com o
            app aberto. O app sincroniza esse fluxo pela branch <code>{tasksBranchLabel}</code>.
          </p>
          <div className={styles.emptyActions}>
            <button
              className={styles.btnNewTask}
              onClick={() => setShowModal(true)}
            >
              + Nova task
            </button>
            <button
              className={styles.btnPrimary}
              onClick={handleInitializeTasks}
              disabled={step === "syncing"}
            >
              {step === "syncing"
                ? "Recriando backlog..."
                : "Recriar tasks.md inicial"}
            </button>
            <button
              className={styles.btnFlags}
              onClick={handleOpenTasksFile}
            >
              Abrir tasks.md
            </button>
          </div>
          {step === "error" && <p className={styles.emptyError}>{error}</p>}
        </div>
      ) : activeView === "board" ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className={styles.board}>
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                columnId={col.id}
                title={col.label}
                color={col.color}
                tasks={tasksByStatus(col.id)}
                collaborators={collaboratorsByLogin}
                onSubtaskToggle={handleSubtaskToggle}
                onDeleteTask={handleDeleteTask}
                onEditTask={handleEditTask}
                primaryActionLabel="Mover para backlog"
                onPrimaryAction={handleMoveToBacklog}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask && (
              <TaskCard
                task={activeTask}
                collaborators={collaboratorsByLogin}
                onSubtaskToggle={() => {}}
              />
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className={styles.backlogWrap}>
          <div className={styles.backlogHeader}>
            <h2 className={styles.backlogTitle}>Backlog</h2>
            <div className={styles.backlogHeaderActions}>
              <span className={styles.backlogCount}>
                {filteredBacklogTasks.length}/{backlogTasks.length} items
              </span>
              <button className={styles.btnFlags} onClick={handleOpenTasksFile}>
                Abrir tasks.md
              </button>
            </div>
          </div>
          <div className={styles.backlogFilters}>
            <input
              className={styles.backlogInput}
              type="text"
              placeholder="Buscar por titulo ou descricao"
              value={backlogSearch}
              onChange={(e) => setBacklogSearch(e.target.value)}
            />
            <select
              className={styles.backlogSelect}
              value={backlogPriority}
              onChange={(e) => setBacklogPriority(e.target.value)}
            >
              <option value="">Todas prioridades</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baixa</option>
            </select>
            <select
              className={styles.backlogSelect}
              value={backlogAssignee}
              onChange={(e) => setBacklogAssignee(e.target.value)}
            >
              <option value="">Todos responsaveis</option>
              {collaborators.map((collaborator) => (
                <option key={collaborator.login} value={collaborator.login}>
                  {collaborator.name || collaborator.login}
                </option>
              ))}
            </select>
            <select
              className={styles.backlogSelect}
              value={backlogLabel}
              onChange={(e) => setBacklogLabel(e.target.value)}
            >
              <option value="">Todas etiquetas</option>
              {allFlags.map((flag) => (
                <option key={flag.id} value={flag.id}>
                  {flag.name}
                </option>
              ))}
            </select>
            <select
              className={styles.backlogSelect}
              value={backlogSort}
              onChange={(e) => setBacklogSort(e.target.value)}
            >
              <option value="priority">Ordenar por prioridade</option>
              <option value="assignee">Ordenar por responsavel</option>
              <option value="type">Ordenar por tipo</option>
              <option value="title">Ordenar por titulo</option>
            </select>
          </div>
          {backlogTasks.length === 0 ? (
            <div className={styles.backlogEmpty}>
              Nenhuma task no backlog. Crie uma nova task aqui ou mova algo do fluxo para backlog.
            </div>
          ) : filteredBacklogTasks.length === 0 ? (
            <div className={styles.backlogEmpty}>
              Nenhuma task corresponde aos filtros atuais.
            </div>
          ) : (
            <div className={styles.backlogList}>
              {filteredBacklogTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  collaborators={collaboratorsByLogin}
                  onSubtaskToggle={handleSubtaskToggle}
                  onDelete={handleDeleteTask}
                  onEdit={handleEditTask}
                  primaryActionLabel="Enviar para board"
                  onPrimaryAction={handleSendToBoard}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <TaskModal
          activeRepo={activeRepo}
          defaultStatus={
            activeView === "backlog"
              ? "backlog"
              : columns[0]?.id || DEFAULT_BOARD_STATUS
          }
          onSave={handleCreateTask}
          onClose={() => setShowModal(false)}
        />
      )}
      {editingTask && (
        <TaskModal
          activeRepo={activeRepo}
          task={editingTask}
          onSave={handleSaveEdit}
          onClose={() => setEditingTask(null)}
        />
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {showColumnsManager && (
        <ColumnsManager onClose={() => setShowColumnsManager(false)} />
      )}
    </div>
  );
}
