import { useState } from "react";
import { useCardTypes } from "../context/CardTypesContext";
import styles from "./CardTypesManager.module.css";

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

const PRESET_ICONS = ["✓", "⚠", "🔍", "⚡", "🚫", "📖", "🐛", "💡", "🔧", "📌"];

function TypeEditor({ type, onSave, onCancel }) {
  const [name, setName] = useState(type?.name || "");
  const [icon, setIcon] = useState(type?.icon || "✓");
  const [color, setColor] = useState(type?.color || "#005F73");

  return (
    <div className={styles.editor}>
      <div className={styles.editorRow}>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Nome</label>
          <input
            className={styles.editorInput}
            placeholder="Ex: Review"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>Ícone</label>
        <div className={styles.iconRow}>
          {PRESET_ICONS.map((i) => (
            <button
              key={i}
              className={`${styles.iconBtn} ${icon === i ? styles.iconBtnActive : ""}`}
              onClick={() => setIcon(i)}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel}>Cor</label>
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
          />
        </div>
      </div>

      <div className={styles.preview}>
        <span className={styles.typeBadge} style={{ "--type-color": color }}>
          <span className={styles.typeIcon}>{icon}</span>
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
            name.trim() && onSave({ name: name.trim(), icon, color })
          }
          disabled={!name.trim()}
        >
          Salvar
        </button>
      </div>
    </div>
  );
}

export default function CardTypesManager({ onClose }) {
  const { allTypes, customTypes, addType, editType, deleteType } =
    useCardTypes();
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);

  const systemTypes = allTypes.filter((t) => t.isSystem);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Tipos de cartão</h2>
          <button className={styles.btnClose} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>Tipos do sistema</p>
          <div className={styles.list}>
            {systemTypes.map((type) => (
              <div key={type.id} className={styles.typeRow}>
                <span
                  className={styles.typeBadge}
                  style={{ "--type-color": type.color }}
                >
                  <span className={styles.typeIcon}>{type.icon}</span>
                  {type.name}
                </span>
                <span className={styles.systemTag}>Sistema</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>Tipos customizados</p>
          <div className={styles.list}>
            {customTypes.map((type) => (
              <div key={type.id}>
                {editingId === type.id ? (
                  <TypeEditor
                    type={type}
                    onSave={(changes) => {
                      editType(type.id, changes);
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className={styles.typeRow}>
                    <span
                      className={styles.typeBadge}
                      style={{ "--type-color": type.color }}
                    >
                      <span className={styles.typeIcon}>{type.icon}</span>
                      {type.name}
                    </span>
                    <div className={styles.typeActions}>
                      <button
                        className={styles.btnEdit}
                        onClick={() => setEditingId(type.id)}
                      >
                        Editar
                      </button>
                      <button
                        className={styles.btnDelete}
                        onClick={() => deleteType(type.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {customTypes.length === 0 && (
              <p className={styles.empty}>Nenhum tipo customizado ainda</p>
            )}
          </div>
        </div>

        {adding ? (
          <TypeEditor
            onSave={(type) => {
              addType(type);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button className={styles.btnAdd} onClick={() => setAdding(true)}>
            + Novo tipo
          </button>
        )}
      </div>
    </div>
  );
}
