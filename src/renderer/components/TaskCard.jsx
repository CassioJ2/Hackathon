import styles from "./TaskCard.module.css";
import { useFlags } from "../context/FlagsContext";
import { useCardTypes } from "../context/CardTypesContext";
import { useColumns } from "../context/ColumnsContext";

const PRIORITY_COLORS = {
  low: { color: "#4F4F4F", label: "Baixa" },
  medium: { color: "#00A676", label: "Média" },
  high: { color: "#E85D24", label: "Alta" },
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
  const { allFlags } = useFlags();
  const { allTypes } = useCardTypes();
  const { columns } = useColumns();

  const currentType = allTypes.find((t) => t.id === (task.cardType || "task"));
  const currentColumn = columns.find((c) => c.id === task.status);
  const statusColor = currentColumn?.color || "#4F4F4F";
  const subtasksDone =
    task.subtasks?.filter((s) => s.status === "done").length ?? 0;
  const subtasksTotal = task.subtasks?.length ?? 0;
  const taskLabels = allFlags.filter((f) => task.labels?.includes(f.id));
  const priority = task.priority ? PRIORITY_COLORS[task.priority] : null;

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
      style={{ "--card-color": statusColor }}
      onClick={() => onEdit?.(task)}
    >
      {currentType && (
        <span
          className={styles.cardTypeBadge}
          style={{ "--type-color": currentType.color }}
        >
          {currentType.icon} {currentType.name}
        </span>
      )}

      <div className={styles.titleRow}>
        <p className={styles.title}>{task.title}</p>
        <button
          className={styles.btnDelete}
          onClick={handleDelete}
          title="Deletar task"
        >
          <TrashIcon />
        </button>
      </div>

      {(priority || taskLabels.length > 0) && (
        <div className={styles.flags}>
          {priority && (
            <span
              className={styles.flag}
              style={{ "--flag-color": priority.color }}
            >
              {priority.label}
            </span>
          )}
          {taskLabels.map((f) => (
            <span
              key={f.id}
              className={styles.flag}
              style={{
                "--flag-color": f.color,
                fontWeight: f.bold ? 600 : 400,
              }}
            >
              {f.name}
            </span>
          ))}
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
        {columns
          .filter((col) => col.id !== task.status)
          .map((col) => (
            <button
              key={col.id}
              className={styles.btnAction}
              onClick={(e) =>
                handleActionClick(e, () => onStatusChange(task.id, col.id))
              }
            >
              {col.label}
            </button>
          ))}
      </div>
    </div>
  );
}
