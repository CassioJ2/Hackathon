import TaskCard from "./TaskCard";
import styles from "./KanbanColumn.module.css";

export default function KanbanColumn({ title, tasks, color, onStatusChange }) {
  return (
    <div className={styles.column}>
      <div className={styles.header}>
        <span className={styles.dot} style={{ background: color }} />
        <h2 className={styles.title}>{title}</h2>
        <span className={styles.count}>{tasks.length}</span>
      </div>

      <div className={styles.list}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onStatusChange={onStatusChange} />
        ))}

        {tasks.length === 0 && (
          <p className={styles.empty}>Nenhuma task aqui</p>
        )}
      </div>
    </div>
  );
}
