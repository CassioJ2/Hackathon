import { useState, useEffect, useRef } from "react";
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
import ColumnsManager from "../components/ColumnsManager";

export default function KanbanPage({ activeRepo, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [step, setStep] = useState("loading"); // loading | ready | syncing | error
  const [error, setError] = useState("");
  const [activeTask, setActiveTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [toast, setToast] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const tasksRef = useRef(tasks);

  const { columns } = useColumns();
  const [showColumnsManager, setShowColumnsManager] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    const cleanup = window.electron.on(
      "tasks:external-update",
      (updatedTasks) => {
        setTasks(updatedTasks);
        setHasChanges(false);
        setToast({
          message: "Tasks atualizadas pelo GitHub!",
          type: "success",
        });
      },
    );

    window.electron
      .invoke("tasks:init")
      .then((result) => {
        if (!result) return;
        setTasks(result.tasks);
        setStep("ready");
      })
      .catch((err) => {
        setError(err.message);
        setStep("error");
      });

    return () => cleanup?.();
  }, []);

  // atualiza tasks localmente sem commitar
  const updateTasksLocally = (updatedTasks) => {
    setTasks(updatedTasks);
    setHasChanges(true);
  };

  // commit no GitHub — só quando clicar em Sync
  const handleSync = async () => {
    try {
      setStep("syncing");
      setError("");
      await window.electron.invoke("tasks:save", {
        tasks: tasksRef.current,
        commitMessage: "chore: update tasks",
      });
      setStep("ready");
      setHasChanges(false);
      setToast({ message: "Sincronizado com GitHub!", type: "success" });
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

  const handleStatusChange = (taskId, newStatus) => {
    updateTasksLocally(
      tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
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

  const handleInitializeTasks = async () => {
    try {
      setStep("syncing");
      setError("");
      const result = await window.electron.invoke("tasks:init", {});
      setTasks(result.tasks);
      setStep("ready");
    } catch (err) {
      setError(err.message);
      setStep("error");
    }
  };

  const handleLogout = async () => {
    await window.electron.invoke("session:clear");
    onLogout();
  };

  const tasksByStatus = (status) => tasks.filter((t) => t.status === status);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <img src={logo} width="60" height="60" alt="CodeSprint" />
          <h1 className={styles.appName}>CodeSprint</h1>
          {activeRepo && (
            <span className={styles.repoBadge}>
              {activeRepo.owner}/{activeRepo.repo}
            </span>
          )}
        </div>

        <div className={styles.headerCenter}>
          <button
            className={styles.btnNewTask}
            onClick={() => setShowModal(true)}
          >
            + Nova task
          </button>
          <button
            className={styles.btnFlags}
            onClick={() => setShowColumnsManager(true)}
          >
            ⚙ Colunas
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
              "↑ Sync"
            ) : (
              "Sincronizado"
            )}
          </button>
          <button className={styles.btnLogout} onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      {step === "loading" ? (
        <div className={styles.loadingWrap}>
          <LoadingSpinner />
          <p>Carregando tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>Nenhum backlog encontrado</h2>
          <p className={styles.emptyText}>
            Esse repositório ainda não tem um <code>tasks.md</code>. Você pode
            criar um backlog inicial agora e começar a testar o fluxo completo.
          </p>
          <button
            className={styles.btnPrimary}
            onClick={handleInitializeTasks}
            disabled={step === "syncing"}
          >
            {step === "syncing"
              ? "Criando backlog..."
              : "Criar tasks.md inicial"}
          </button>
          {step === "error" && <p className={styles.emptyError}>{error}</p>}
        </div>
      ) : (
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
                onStatusChange={handleStatusChange}
                onDeleteTask={handleDeleteTask}
                onEditTask={handleEditTask}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask && (
              <TaskCard task={activeTask} onStatusChange={() => {}} />
            )}
          </DragOverlay>
        </DndContext>
      )}

      {showModal && (
        <TaskModal
          onSave={handleCreateTask}
          onClose={() => setShowModal(false)}
        />
      )}
      {editingTask && (
        <TaskModal
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
