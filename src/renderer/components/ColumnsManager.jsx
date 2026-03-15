import { useState } from "react";
import { useColumns } from "../context/ColumnsContext";
import styles from "./ColumnsManager.module.css";

const PRESET_COLORS = [
  "#4F4F4F",
  "#00A676",
  "#94D2BD",
  "#C0392B",
  "#E85D24",
  "#005F73",
  "#8B5CF6",
  "#0EA5E9",
  "#B45309",
  "#758956",
];

function ColumnEditor({ column, onSave, onCancel }) {
  const [label, setLabel] = useState(column?.label || "");
  const [color, setColor] = useState(column?.color || "#005F73");

  return (
    <div className={styles.editor}>
      <input
        className={styles.editorInput}
        placeholder="Nome da coluna"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
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
        />
      </div>
      <div className={styles.preview}>
        <span className={styles.dot} style={{ background: color }} />
        <span className={styles.previewLabel}>{label || "Preview"}</span>
      </div>
      <div className={styles.editorActions}>
        <button className={styles.btnCancel} onClick={onCancel}>
          Cancelar
        </button>
        <button
          className={styles.btnSave}
          onClick={() => label.trim() && onSave({ label: label.trim(), color })}
          disabled={!label.trim()}
        >
          Salvar
        </button>
      </div>
    </div>
  );
}

export default function ColumnsManager({ onClose }) {
  const { columns, addColumn, editColumn, deleteColumn } = useColumns();
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);

  const systemCols = columns.filter((c) => c.isSystem);
  const customCols = columns.filter((c) => !c.isSystem);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Gerenciar colunas</h2>
          <button className={styles.btnClose} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>Colunas do sistema</p>
          <div className={styles.list}>
            {systemCols.map((col) => (
              <div key={col.id}>
                {editingId === col.id ? (
                  <ColumnEditor
                    column={col}
                    onSave={(changes) => {
                      editColumn(col.id, changes);
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className={styles.colRow}>
                    <div className={styles.colInfo}>
                      <span
                        className={styles.dot}
                        style={{ background: col.color }}
                      />
                      <span className={styles.colLabel}>{col.label}</span>
                    </div>
                    <button
                      className={styles.btnEdit}
                      onClick={() => setEditingId(col.id)}
                    >
                      Editar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>Colunas customizadas</p>
          <div className={styles.list}>
            {customCols.map((col) => (
              <div key={col.id}>
                {editingId === col.id ? (
                  <ColumnEditor
                    column={col}
                    onSave={(changes) => {
                      editColumn(col.id, changes);
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className={styles.colRow}>
                    <div className={styles.colInfo}>
                      <span
                        className={styles.dot}
                        style={{ background: col.color }}
                      />
                      <span className={styles.colLabel}>{col.label}</span>
                    </div>
                    <div className={styles.colActions}>
                      <button
                        className={styles.btnEdit}
                        onClick={() => setEditingId(col.id)}
                      >
                        Editar
                      </button>
                      <button
                        className={styles.btnDelete}
                        onClick={() => deleteColumn(col.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {customCols.length === 0 && (
              <p className={styles.empty}>Nenhuma coluna customizada ainda</p>
            )}
          </div>
        </div>

        {adding ? (
          <ColumnEditor
            onSave={(col) => {
              addColumn(col);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button className={styles.btnAdd} onClick={() => setAdding(true)}>
            + Nova coluna
          </button>
        )}
      </div>
    </div>
  );
}
