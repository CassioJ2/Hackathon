import styles from "./TaskCard.module.css";
import { useFlags } from "../context/FlagsContext";
import { useCardTypes } from "../context/CardTypesContext";
import { useColumns } from "../context/ColumnsContext";

const PRIORITY_COLORS = {
  low: { color: "#4F4F4F", label: "Baixa" },
  medium: { color: "#00A676", label: "Media" },
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

export default function TaskCard({
  task,
  collaborators = {},
  onSubtaskToggle,
  onDelete,
  onEdit,
  primaryActionLabel,
  onPrimaryAction,
}) {
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
  const assignee = task.assignee ? collaborators[task.assignee] : null;
  const assigneeName = assignee?.name?.trim() || task.assignee || "";
  const assigneeLogin = assignee?.login || task.assignee || "";

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(task.id);
  };

  const handleProfileClick = (e) => {
    e.stopPropagation();
  };

  const handleSubtaskClick = (e, subtaskId) => {
    e.stopPropagation();
    onSubtaskToggle?.(task.id, subtaskId);
  };

  const handlePrimaryAction = (e) => {
    e.stopPropagation();
    onPrimaryAction?.(task);
  };

  return (
    <div
      className={styles.card}
      style={{ "--card-color": statusColor }}
      onClick={() => onEdit?.(task)}
    >
      <div className={styles.headerRow}>
        {currentType && (
          <span
            className={styles.cardTypeBadge}
            style={{ "--type-color": currentType.color }}
          >
            {currentType.icon} {currentType.name}
          </span>
        )}
        <button
          className={styles.btnDelete}
          onClick={handleDelete}
          title="Deletar task"
        >
          <TrashIcon />
        </button>
      </div>

      <div className={styles.titleGroup}>
        <p className={styles.title}>{task.title}</p>
        {task.description && (
          <p className={styles.description}>{task.description}</p>
        )}
      </div>

      {task.assignee && (
        <div className={styles.infoBlock}>
          <span className={styles.infoLabel}>Assignee:</span>
          {assignee?.profileUrl ? (
            <a
              className={styles.assigneeLink}
              href={assignee.profileUrl}
              target="_blank"
              rel="noreferrer"
              onClick={handleProfileClick}
            >
              {assignee?.avatarUrl ? (
                <img
                  className={styles.assigneeAvatar}
                  src={assignee.avatarUrl}
                  alt={assigneeName}
                />
              ) : (
                <div className={styles.assigneeFallback}>
                  {assigneeName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={styles.assigneeText}>
                <span className={styles.assigneeName}>{assigneeName}</span>
                <span className={styles.assigneeLogin}>@{assigneeLogin}</span>
              </div>
            </a>
          ) : (
            <div className={styles.assigneeRow}>
              {assignee?.avatarUrl ? (
                <img
                  className={styles.assigneeAvatar}
                  src={assignee.avatarUrl}
                  alt={assigneeName}
                />
              ) : (
                <div className={styles.assigneeFallback}>
                  {assigneeName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={styles.assigneeText}>
                <span className={styles.assigneeName}>{assigneeName}</span>
                <span className={styles.assigneeLogin}>@{assigneeLogin}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {priority && (
        <div className={styles.infoBlock}>
          <span className={styles.infoLabel}>Prioridade:</span>
          <div className={styles.valueList}>
            <span
              className={styles.flag}
              style={{ "--flag-color": priority.color }}
            >
              {priority.label}
            </span>
          </div>
        </div>
      )}

      {taskLabels.length > 0 && (
        <div className={styles.infoBlock}>
          <span className={styles.infoLabel}>Etiquetas:</span>
          <div className={styles.valueList}>
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
        </div>
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
              <button
                key={sub.id}
                className={styles.subtaskButton}
                type="button"
                onClick={(e) => handleSubtaskClick(e, sub.id)}
              >
                <span
                  className={`${styles.subtaskCheckbox} ${sub.status === "done" ? styles.subtaskCheckboxDone : ""}`}
                  aria-hidden="true"
                >
                  {sub.status === "done" ? "✓" : ""}
                </span>
                <span
                  className={`${styles.subtaskTitle} ${sub.status === "done" ? styles.subtaskTitleDone : ""}`}
                >
                  {sub.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {primaryActionLabel && onPrimaryAction && (
        <button
          type="button"
          className={styles.primaryAction}
          onClick={handlePrimaryAction}
        >
          {primaryActionLabel}
        </button>
      )}
    </div>
  );
}
