import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskCard from "./TaskCard";

export default function SortableTaskCard({
  task,
  collaborators,
  onSubtaskToggle,
  onDelete,
  onEdit,
  primaryActionLabel,
  onPrimaryAction,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        collaborators={collaborators}
        onSubtaskToggle={onSubtaskToggle}
        onDelete={onDelete}
        onEdit={onEdit}
        primaryActionLabel={primaryActionLabel}
        onPrimaryAction={onPrimaryAction}
      />
    </div>
  );
}
