import { useState, useEffect } from "react";
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

const COLUMNS = [
  { key: "pending", label: "Pendente", color: "#4F4F4F" },
  { key: "in_progress", label: "Em andamento", color: "#00A676" },
  { key: "done", label: "Concluído", color: "#94D2BD" },
];

export default function KanbanPage({
  initialTasks,
  activeRepo,
  onTasksChange,
  onLogout,
}) {
  const [tasks, setTasks] = useState(initialTasks || []);
  const [step, setStep] = useState("loading");
  const [error, setError] = useState("");
  const [activeTask, setActiveTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  useEffect(() => {
    setTasks(initialTasks || []);
    setStep("ready");
  }, [initialTasks]);

  useEffect(() => {
    const cleanup = window.electron.on(
      "tasks:external-update",
      (updatedTasks) => {
        setTasks(updatedTasks);
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

  const findColumn = (taskId) =>
    COLUMNS.find((col) =>
      tasks.find((t) => t.id === taskId && t.status === col.key),
    )?.key;

  const handleDragStart = ({ active }) => {
    setActiveTask(tasks.find((t) => t.id === active.id) || null);
  };

  const handleDragOver = ({ active, over }) => {
    if (!over) return;
    const activeCol = findColumn(active.id);
    const overCol =
      COLUMNS.find((c) => c.key === over.id)?.key || findColumn(over.id);
    if (!activeCol || !overCol || activeCol === overCol) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === active.id ? { ...t, status: overCol } : t)),
    );
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;
    const updated = [...tasks];
    const activeIndex = updated.findIndex((t) => t.id === active.id);
    const overIndex = updated.findIndex((t) => t.id === over.id);
    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      const reordered = arrayMove(updated, activeIndex, overIndex);
      setTasks(reordered);
      await saveTasks(reordered);
    } else {
      await saveTasks(updated);
    }
  };

  const saveTasks = async (updatedTasks) => {
    try {
      setStep("saving");
      setError("");
      await window.electron.invoke("tasks:save", {
        tasks: updatedTasks,
        commitMessage: "chore: update tasks",
      });
      setStep("ready");
    } catch (err) {
      setError(err.message);
      setStep("error");
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, status: newStatus } : t,
    );
    setTasks(updated);
    await saveTasks(updated);
  };

  // NOVO: deletar task
  const handleDeleteTask = async (taskId) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    await saveTasks(updated);
  };

  const handleInitializeTasks = async () => {
    try {
      setStep("saving");
      setError("");
      const result = await window.electron.invoke("tasks:init", {});
      setTasks(result.tasks);
      setStep("ready");
    } catch (err) {
      setError(err.message);
      setStep("error");
    }
  };

  const handleCreateTask = async (newTask) => {
    const updated = [...tasks, newTask];
    setTasks(updated);
    await saveTasks(updated);
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
        </div>

        <div className={styles.headerRight}>
          {step === "saving" && (
            <div className={styles.savingWrap}>
              <LoadingSpinner size="sm" />
              <span className={styles.savingText}>Sincronizando...</span>
            </div>
          )}
          {step === "ready" && (
            <span className={styles.syncedText}>Sincronizado</span>
          )}
          {step === "error" && (
            <span className={styles.errorText}>{error}</span>
          )}
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
            disabled={step === "saving"}
          >
            {step === "saving"
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
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.key}
                columnId={col.key}
                title={col.label}
                color={col.color}
                tasks={tasksByStatus(col.key)}
                onStatusChange={handleStatusChange}
                onDeleteTask={handleDeleteTask}
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
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
