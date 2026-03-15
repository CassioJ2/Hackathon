import { useEffect, useMemo, useState } from "react";
import styles from "./TaskModal.module.css";
import { useFlags } from "../context/FlagsContext";
import FlagsManager from "./FlagsManager";
import { useCardTypes } from "../context/CardTypesContext";
import CardTypesManager from "./CardTypesManager";
import { useColumns } from "../context/ColumnsContext";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Baixa", color: "#4F4F4F" },
  { value: "medium", label: "Media", color: "#00A676" },
  { value: "high", label: "Alta", color: "#E85D24" },
];

export default function TaskModal({
  task,
  activeRepo,
  defaultStatus = "pending",
  onSave,
  onClose,
}) {
  const isEditing = !!task;
  const { allFlags } = useFlags();
  const { allTypes } = useCardTypes();
  const { columns } = useColumns();

  const [cardType, setCardType] = useState(task?.cardType || "task");
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [assignee, setAssignee] = useState(task?.assignee || "");
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [subtasks, setSubtasks] = useState(
    task?.subtasks?.map((s) => s.title) || [""],
  );
  const [priority, setPriority] = useState(task?.priority || "");
  const [labels, setLabels] = useState(task?.labels || []);
  const [showFlagsManager, setShowFlagsManager] = useState(false);
  const [showTypesManager, setShowTypesManager] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(false);
  const [collaboratorsError, setCollaboratorsError] = useState("");
  const [status, setStatus] = useState(task?.status || defaultStatus);

  useEffect(() => {
    let isMounted = true;

    const loadCollaborators = async () => {
      if (!activeRepo?.owner || !activeRepo?.repo) {
        if (isMounted) {
          setCollaborators([]);
          setCollaboratorsError("");
        }
        return;
      }

      try {
        if (isMounted) {
          setIsLoadingCollaborators(true);
          setCollaboratorsError("");
        }

        const result = await window.electron.invoke(
          "github:repo-collaborators",
        );

        if (isMounted) {
          setCollaborators(Array.isArray(result) ? result : []);
        }
      } catch (error) {
        if (isMounted) {
          setCollaborators([]);
          setCollaboratorsError(
            error?.message || "Nao foi possivel carregar pessoas do GitHub.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingCollaborators(false);
        }
      }
    };

    loadCollaborators();

    return () => {
      isMounted = false;
    };
  }, [activeRepo?.owner, activeRepo?.repo]);

  const assigneeOptions = useMemo(() => {
    const options = [...collaborators];

    if (
      assignee &&
      !options.some((collaborator) => collaborator.login === assignee)
    ) {
      options.unshift({
        id: `current-${assignee}`,
        login: assignee,
        name: "",
      });
    }

    return options.sort((a, b) => {
      const labelA = (a.name || a.login).toLowerCase();
      const labelB = (b.name || b.login).toLowerCase();
      return labelA.localeCompare(labelB);
    });
  }, [assignee, collaborators]);

  const filteredAssigneeOptions = useMemo(() => {
    const query = assigneeSearch.trim().toLowerCase();
    if (!query) return assigneeOptions;

    return assigneeOptions.filter((collaborator) => {
      const name = collaborator.name?.toLowerCase() || "";
      const login = collaborator.login?.toLowerCase() || "";
      return name.includes(query) || login.includes(query);
    });
  }, [assigneeOptions, assigneeSearch]);

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
      assignee: assignee.trim(),
      priority,
      labels,
      status,
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
              x
            </button>
          </div>

          <div className={styles.modalBody}>
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
              <label className={styles.label}>Destino</label>
              <div className={styles.flagRow}>
                <button
                  className={`${styles.flagBtn} ${status === "backlog" ? styles.flagBtnActive : ""}`}
                  style={{ "--flag-color": "#7C6A0A" }}
                  onClick={() => setStatus("backlog")}
                >
                  Backlog
                </button>
                {columns.map((column) => (
                  <button
                    key={column.id}
                    className={`${styles.flagBtn} ${status === column.id ? styles.flagBtnActive : ""}`}
                    style={{ "--flag-color": column.color }}
                    onClick={() => setStatus(column.id)}
                  >
                    {column.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Titulo</label>
              <input
                className={styles.input}
                type="text"
                placeholder="Ex: Implementar autenticacao"
                value={title}
                maxLength={80}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
              <span className={styles.charCount}>{title.length}/80</span>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Descricao</label>
              <textarea
                className={styles.textarea}
                placeholder="Descreva a task em detalhes..."
                value={description}
                maxLength={300}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
              <span className={styles.charCount}>{description.length}/300</span>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Responsavel</label>
              <input
                className={styles.input}
                type="text"
                placeholder="Buscar por nome ou @usuario..."
                value={assigneeSearch}
                onChange={(e) => setAssigneeSearch(e.target.value)}
                disabled={isLoadingCollaborators}
              />
              <div className={styles.assigneeList}>
                <button
                  type="button"
                  className={`${styles.assigneeOption} ${!assignee ? styles.assigneeOptionActive : ""}`}
                  onClick={() => setAssignee("")}
                  disabled={isLoadingCollaborators}
                >
                  <div className={styles.assigneeFallback}>-</div>
                  <div className={styles.assigneeMeta}>
                    <span className={styles.assigneeName}>Sem responsavel</span>
                  </div>
                </button>
                {filteredAssigneeOptions.map((collaborator) => (
                  <button
                    key={collaborator.id || collaborator.login}
                    type="button"
                    className={`${styles.assigneeOption} ${assignee === collaborator.login ? styles.assigneeOptionActive : ""}`}
                    onClick={() => setAssignee(collaborator.login)}
                    disabled={isLoadingCollaborators}
                  >
                    {collaborator.avatarUrl ? (
                      <img
                        className={styles.assigneeAvatar}
                        src={collaborator.avatarUrl}
                        alt={collaborator.name || collaborator.login}
                      />
                    ) : (
                      <div className={styles.assigneeFallback}>
                        {(collaborator.name || collaborator.login)
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    <div className={styles.assigneeMeta}>
                      <span className={styles.assigneeName}>
                        {collaborator.name || collaborator.login}
                      </span>
                      <span className={styles.assigneeLogin}>
                        @{collaborator.login}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <span className={styles.helperText}>
                {isLoadingCollaborators
                  ? "Carregando pessoas do repositorio..."
                  : "Quem vai executar essa task."}
              </span>
              {collaboratorsError && (
                <span className={styles.helperError}>{collaboratorsError}</span>
              )}
              {!isLoadingCollaborators &&
                !collaboratorsError &&
                filteredAssigneeOptions.length === 0 && (
                  <span className={styles.helperText}>
                    Nenhuma pessoa encontrada para essa busca.
                  </span>
                )}
              {!collaboratorsError &&
                collaborators.length > 0 &&
                activeRepo?.owner &&
                activeRepo?.repo && (
                  <span className={styles.helperText}>
                    Lista carregada de {activeRepo.owner}/{activeRepo.repo}.
                  </span>
                )}
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
                      x
                    </button>
                  </div>
                ))}
              </div>
              <button
                className={styles.btnAddSubtask}
                onClick={handleAddSubtask}
              >
                + Adicionar subtask
              </button>
            </div>
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
              {isEditing ? "Salvar alteracoes" : "Criar task"}
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
