import styles from "./TaskCard.module.css";

export default function TaskCard({ task, onStatusChange }) {
  const subtasksDone =
    task.subtasks?.filter((s) => s.status === "done").length ?? 0;
  const subtasksTotal = task.subtasks?.length ?? 0;

  return (
    <div className={styles.card}>
      <p className={styles.title}>{task.title}</p>

      {subtasksTotal > 0 && (
        <div className={styles.subtasks}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${(subtasksDone / subtasksTotal) * 100}%` }}
            />
          </div>
          <span className={styles.subtaskCount}>
            {subtasksDone}/{subtasksTotal} subtasks
          </span>
        </div>
      )}

      <div className={styles.actions}>
        {task.status !== "pending" && (
          <button
            className={styles.btnAction}
            onClick={() => onStatusChange(task.id, "pending")}
          >
            Pendente
          </button>
        )}
        {task.status !== "in_progress" && (
          <button
            className={styles.btnAction}
            onClick={() => onStatusChange(task.id, "in_progress")}
          >
            Em andamento
          </button>
        )}
        {task.status !== "done" && (
          <button
            className={`${styles.btnAction} ${styles.btnDone}`}
            onClick={() => onStatusChange(task.id, "done")}
          >
            Concluído
          </button>
        )}
      </div>
    </div>
  );
}
