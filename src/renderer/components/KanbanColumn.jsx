import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableTaskCard from "./SortableTaskCard";
import styles from "./KanbanColumn.module.css";

export default function KanbanColumn({
  title,
  tasks,
  color,
  columnId,
  collaborators,
  onSubtaskToggle,
  onDeleteTask,
  onEditTask,
  primaryActionLabel,
  onPrimaryAction,
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });

  return (
    <div className={`${styles.column} ${isOver ? styles.columnOver : ""}`}>
      <div className={styles.header}>
        <span className={styles.dot} style={{ background: color }} />
        <h2 className={styles.title}>{title}</h2>
        <span className={styles.count}>{tasks.length}</span>
      </div>

      <SortableContext
        id={columnId}
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={styles.list} ref={setNodeRef}>
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              collaborators={collaborators}
              onSubtaskToggle={onSubtaskToggle}
              onDelete={onDeleteTask}
              onEdit={onEditTask}
              primaryActionLabel={primaryActionLabel}
              onPrimaryAction={onPrimaryAction}
            />
          ))}
          {tasks.length === 0 && (
            <p className={styles.empty}>Nenhuma task aqui</p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
