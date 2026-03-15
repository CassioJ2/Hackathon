import styles from "./TaskCard.module.css";

const STATUS_CONFIG = {
  pending: { label: "Pendente", color: "#4F4F4F" },
  in_progress: { label: "Em andamento", color: "#00A676" },
  done: { label: "Concluído", color: "#94D2BD" },
};

const TrashIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

export default function TaskCard({ task, onStatusChange, onDelete, onEdit }) {
  const subtasksDone =
    task.subtasks?.filter((s) => s.status === "done").length ?? 0;
  const subtasksTotal = task.subtasks?.length ?? 0;
  const status = STATUS_CONFIG[task.status];

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(task.id);
  };

  const handleActionClick = (e, callback) => {
    e.stopPropagation();
    callback();
  };

  return (
    <div
      className={styles.card}
      style={{ "--card-color": status.color }}
      onClick={() => onEdit?.(task)}
    >
      <div className={styles.cardHeader}>
        <p className={styles.title}>{task.title}</p>
        <button
          className={styles.btnDelete}
          onClick={handleDelete}
          title="Deletar task"
        >
          <TrashIcon />
        </button>
      </div>

      {(task.priority || task.labels?.length > 0) && (
        <div className={styles.flags}>
          {task.priority && (
            <span
              className={styles.flag}
              style={{
                "--flag-color":
                  task.priority === "high"
                    ? "#E85D24"
                    : task.priority === "medium"
                      ? "#00A676"
                      : "#4F4F4F",
              }}
            >
              {task.priority === "high"
                ? "Alta"
                : task.priority === "medium"
                  ? "Média"
                  : "Baixa"}
            </span>
          )}
          {task.labels?.map((l) => {
            const COLORS = {
              bug: "#C0392B",
              feature: "#005F73",
              urgente: "#E85D24",
              melhoria: "#00A676",
              docs: "#758956",
              teste: "#2B2D42",
            };
            const NAMES = {
              bug: "Bug",
              feature: "Feature",
              urgente: "Urgente",
              melhoria: "Melhoria",
              docs: "Docs",
              teste: "Teste",
            };
            return (
              <span
                key={l}
                className={styles.flag}
                style={{ "--flag-color": COLORS[l] }}
              >
                {NAMES[l]}
              </span>
            );
          })}
        </div>
      )}

      {task.description && (
        <p className={styles.description}>{task.description}</p>
      )}

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
          <div className={styles.subtaskList}>
            {task.subtasks.map((sub) => (
              <div key={sub.id} className={styles.subtaskItem}>
                <span
                  className={`${styles.subtaskDot} ${sub.status === "done" ? styles.subtaskDotDone : ""}`}
                />
                <span
                  className={`${styles.subtaskTitle} ${sub.status === "done" ? styles.subtaskTitleDone : ""}`}
                >
                  {sub.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.actions}>
        {task.status !== "pending" && (
          <button
            className={styles.btnAction}
            onClick={(e) =>
              handleActionClick(e, () => onStatusChange(task.id, "pending"))
            }
          >
            Pendente
          </button>
        )}
        {task.status !== "in_progress" && (
          <button
            className={styles.btnAction}
            onClick={(e) =>
              handleActionClick(e, () => onStatusChange(task.id, "in_progress"))
            }
          >
            Em andamento
          </button>
        )}
        {task.status !== "done" && (
          <button
            className={`${styles.btnAction} ${styles.btnDone}`}
            onClick={(e) =>
              handleActionClick(e, () => onStatusChange(task.id, "done"))
            }
          >
            Concluído
          </button>
        )}
      </div>
    </div>
  );
}
