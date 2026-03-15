import styles from "./TaskCard.module.css";

const STATUS_CONFIG = {
  pending: { label: "Pendente", color: "#4F4F4F" },
  in_progress: { label: "Em andamento", color: "#00A676" },
  done: { label: "Concluído", color: "#94D2BD" },
};

export default function TaskCard({ task, onStatusChange }) {
  const subtasksDone =
    task.subtasks?.filter((s) => s.status === "done").length ?? 0;
  const subtasksTotal = task.subtasks?.length ?? 0;
  const status = STATUS_CONFIG[task.status];

  return (
    <div className={styles.card} style={{ "--card-color": status.color }}>
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
