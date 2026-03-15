import { useState } from "react";
import { useFlags } from "../context/FlagsContext";
import styles from "./FlagsManager.module.css";

const PRESET_COLORS = [
  "#C0392B",
  "#E85D24",
  "#B45309",
  "#00A676",
  "#005F73",
  "#2B2D42",
  "#758956",
  "#8B5CF6",
  "#EC4899",
  "#0EA5E9",
];

function FlagEditor({ flag, onSave, onCancel }) {
  const [name, setName] = useState(flag?.name || "");
  const [color, setColor] = useState(flag?.color || "#005F73");
  const [bold, setBold] = useState(flag?.bold || false);

  return (
    <div className={styles.editor}>
      <input
        className={styles.editorInput}
        placeholder="Nome da flag"
        value={name}
        maxLength={20}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      <div className={styles.colorRow}>
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            className={`${styles.colorDot} ${color === c ? styles.colorDotActive : ""}`}
            style={{ background: c }}
            onClick={() => setColor(c)}
          />
        ))}
        <input
          type="color"
          className={styles.colorPicker}
          value={color}
          onChange={(e) => setColor(e.target.value)}
          title="Cor personalizada"
        />
      </div>
      <label className={styles.boldToggle}>
        <input
          type="checkbox"
          checked={bold}
          onChange={(e) => setBold(e.target.checked)}
        />
        <span>Negrito</span>
      </label>
      <div className={styles.editorPreview}>
        <span
          className={styles.flagPreview}
          style={{ borderColor: color, color, fontWeight: bold ? 600 : 400 }}
        >
          {name || "Preview"}
        </span>
      </div>
      <div className={styles.editorActions}>
        <button className={styles.btnCancel} onClick={onCancel}>
          Cancelar
        </button>
        <button
          className={styles.btnSave}
          onClick={() =>
            name.trim() && onSave({ name: name.trim(), color, bold })
          }
          disabled={!name.trim()}
        >
          Salvar
        </button>
      </div>
    </div>
  );
}

export default function FlagsManager({ onClose }) {
  const { allFlags, customFlags, addFlag, editFlag, deleteFlag } = useFlags();
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);

  const systemFlags = allFlags.filter((f) => f.isSystem);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Gerenciar flags</h2>
          <button className={styles.btnClose} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>Flags do sistema</p>
          <div className={styles.list}>
            {systemFlags.map((flag) => (
              <div key={flag.id} className={styles.flagRow}>
                <span
                  className={styles.flagBadge}
                  style={{
                    borderColor: flag.color,
                    color: flag.color,
                    fontWeight: flag.bold ? 600 : 400,
                  }}
                >
                  {flag.name}
                </span>
                <span className={styles.systemTag}>Sistema</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>Flags customizadas</p>
          <div className={styles.list}>
            {customFlags.map((flag) => (
              <div key={flag.id}>
                {editingId === flag.id ? (
                  <FlagEditor
                    flag={flag}
                    onSave={(changes) => {
                      editFlag(flag.id, changes);
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className={styles.flagRow}>
                    <span
                      className={styles.flagBadge}
                      style={{
                        borderColor: flag.color,
                        color: flag.color,
                        fontWeight: flag.bold ? 600 : 400,
                      }}
                    >
                      {flag.name}
                    </span>
                    <div className={styles.flagActions}>
                      <button
                        className={styles.btnEdit}
                        onClick={() => setEditingId(flag.id)}
                      >
                        Editar
                      </button>
                      <button
                        className={styles.btnDelete}
                        onClick={() => deleteFlag(flag.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {customFlags.length === 0 && (
              <p className={styles.empty}>Nenhuma flag customizada ainda</p>
            )}
          </div>
        </div>

        {adding ? (
          <FlagEditor
            onSave={(flag) => {
              addFlag(flag);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button className={styles.btnAdd} onClick={() => setAdding(true)}>
            + Nova flag
          </button>
        )}
      </div>
    </div>
  );
}
