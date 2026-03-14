import { useState, useEffect } from "react";
import KanbanColumn from "../components/KanbanColumn";
import LoadingSpinner from "../components/LoadingSpinner";
import styles from "./KanbanPage.module.css";

const COLUMNS = [
  { key: "pending", label: "Pendente", color: "#4F4F4F" },
  { key: "in_progress", label: "Em andamento", color: "#00A676" },
  { key: "done", label: "Concluído", color: "#94D2BD" },
];

export default function KanbanPage({ onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [step, setStep] = useState("loading"); // loading | ready | saving | error
  const [error, setError] = useState("");

  useEffect(() => {
    // escuta updates externos (polling detectou mudança no GitHub)
    const cleanup = window.electron.on(
      "tasks:external-update",
      (updatedTasks) => {
        setTasks(updatedTasks);
      },
    );
    return () => cleanup?.();
  }, []);

  useEffect(() => {
    setStep("ready");
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, status: newStatus } : t,
    );
    setTasks(updated);

    try {
      setStep("saving");
      await window.electron.invoke("tasks:save", {
        tasks: updated,
        commitMessage: `chore: update task status to ${newStatus}`,
      });
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
          <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
            <rect
              width="40"
              height="40"
              rx="10"
              fill="var(--color-teal-dark)"
            />
            <path
              d="M10 20h20M20 10v20"
              stroke="var(--color-teal-light)"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <h1 className={styles.appName}>CodeSprint</h1>
        </div>

        <div className={styles.headerRight}>
          {step === "saving" && (
            <div className={styles.savingWrap}>
              <LoadingSpinner size="sm" />
              <span className={styles.savingText}>Salvando...</span>
            </div>
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
      ) : (
        <div className={styles.board}>
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.key}
              title={col.label}
              color={col.color}
              tasks={tasksByStatus(col.key)}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
