import { useState } from "react";
import styles from "./TaskModal.module.css";
import { useFlags } from "../context/FlagsContext";
import FlagsManager from "./FlagsManager";
import { useCardTypes } from "../context/CardTypesContext";
import CardTypesManager from "./CardTypesManager";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Baixa", color: "#4F4F4F" },
  { value: "medium", label: "Média", color: "#00A676" },
  { value: "high", label: "Alta", color: "#E85D24" },
];

export default function TaskModal({ task, onSave, onClose }) {
  const isEditing = !!task;
  const { allFlags } = useFlags();
  const { allTypes } = useCardTypes();

  const [cardType, setCardType] = useState(task?.cardType || "task");
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [subtasks, setSubtasks] = useState(
    task?.subtasks?.map((s) => s.title) || [""],
  );
  const [priority, setPriority] = useState(task?.priority || "");
  const [labels, setLabels] = useState(task?.labels || []);
  const [showFlagsManager, setShowFlagsManager] = useState(false);
  const [showTypesManager, setShowTypesManager] = useState(false);

  const handleAddSubtask = () => setSubtasks([...subtasks, ""]);

  const handleSubtaskChange = (index, value) => {
    const updated = [...subtasks];
    updated[index] = value;
    setSubtasks(updated);
  };

  const handleRemoveSubtask = (index) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const toggleLabel = (id) => {
    setLabels((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const saved = {
      id: task?.id || `TASK-${Date.now()}`,
      cardType,
      title: title.trim(),
      description: description.trim(),
      priority,
      labels,
      status: task?.status || "pending",
      subtasks: subtasks
        .filter((s) => s.trim())
        .map((s, i) => ({
          id: task?.subtasks?.[i]?.id || `TASK-${Date.now()}-${i}`,
          title: s.trim(),
          status: task?.subtasks?.[i]?.status || "pending",
        })),
    };

    onSave(saved);
    onClose();
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>
              {isEditing ? "Editar task" : "Nova task"}
            </h2>
            <button className={styles.btnClose} onClick={onClose}>
              ✕
            </button>
          </div>

          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label}>Tipo</label>
              <button
                className={styles.btnAddFlag}
                onClick={() => setShowTypesManager(true)}
              >
                + Gerenciar
              </button>
            </div>
            <div className={styles.flagRow}>
              {allTypes.map((t) => (
                <button
                  key={t.id}
                  className={`${styles.flagBtn} ${cardType === t.id ? styles.flagBtnActive : ""}`}
                  style={{ "--flag-color": t.color }}
                  onClick={() => setCardType(t.id)}
                >
                  {t.icon} {t.name}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Título</label>
            <input
              className={styles.input}
              type="text"
              placeholder="Ex: Implementar autenticação"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Descrição</label>
            <textarea
              className={styles.textarea}
              placeholder="Descreva a task em detalhes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Prioridade</label>
            <div className={styles.flagRow}>
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  className={`${styles.flagBtn} ${priority === p.value ? styles.flagBtnActive : ""}`}
                  style={{ "--flag-color": p.color }}
                  onClick={() =>
                    setPriority(priority === p.value ? "" : p.value)
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label}>Etiquetas</label>
              <button
                className={styles.btnAddFlag}
                onClick={() => setShowFlagsManager(true)}
              >
                + Gerenciar
              </button>
            </div>
            <div className={styles.flagRow}>
              {allFlags.map((f) => (
                <button
                  key={f.id}
                  className={`${styles.flagBtn} ${labels.includes(f.id) ? styles.flagBtnActive : ""}`}
                  style={{
                    "--flag-color": f.color,
                    fontWeight: f.bold ? 600 : 400,
                  }}
                  onClick={() => toggleLabel(f.id)}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Subtasks</label>
            <div className={styles.subtaskList}>
              {subtasks.map((sub, i) => (
                <div key={i} className={styles.subtaskRow}>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder={`Subtask ${i + 1}`}
                    value={sub}
                    onChange={(e) => handleSubtaskChange(i, e.target.value)}
                  />
                  <button
                    className={styles.btnRemove}
                    onClick={() => handleRemoveSubtask(i)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button className={styles.btnAddSubtask} onClick={handleAddSubtask}>
              + Adicionar subtask
            </button>
          </div>

          <div className={styles.modalFooter}>
            <button className={styles.btnCancel} onClick={onClose}>
              Cancelar
            </button>
            <button
              className={styles.btnSave}
              onClick={handleSave}
              disabled={!title.trim()}
            >
              {isEditing ? "Salvar alterações" : "Criar task"}
            </button>
          </div>
        </div>
      </div>

      {showFlagsManager && (
        <FlagsManager onClose={() => setShowFlagsManager(false)} />
      )}
      {showTypesManager && (
        <CardTypesManager onClose={() => setShowTypesManager(false)} />
      )}
    </>
  );
}
