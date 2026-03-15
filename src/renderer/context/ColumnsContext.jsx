import { createContext, useContext, useState } from "react";

const DEFAULT_COLUMNS = [
  { id: "pending", label: "Pendente", color: "#4F4F4F", isSystem: true },
  {
    id: "in_progress",
    label: "Em andamento",
    color: "#00A676",
    isSystem: true,
  },
  { id: "done", label: "Concluído", color: "#94D2BD", isSystem: true },
];

function loadColumns() {
  try {
    const saved = localStorage.getItem("codesprint:columns");
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
  } catch {
    return DEFAULT_COLUMNS;
  }
}

function saveColumns(columns) {
  localStorage.setItem("codesprint:columns", JSON.stringify(columns));
}

const ColumnsContext = createContext(null);

export function ColumnsProvider({ children }) {
  const [columns, setColumns] = useState(loadColumns);

  const updateColumns = (updated) => {
    setColumns(updated);
    saveColumns(updated);
  };

  const addColumn = (col) => {
    const newCol = {
      id: `col-${Date.now()}`,
      label: col.label,
      color: col.color,
      isSystem: false,
    };
    updateColumns([...columns, newCol]);
  };

  const editColumn = (id, changes) => {
    updateColumns(columns.map((c) => (c.id === id ? { ...c, ...changes } : c)));
  };

  const deleteColumn = (id) => {
    updateColumns(columns.filter((c) => c.id !== id));
  };

  return (
    <ColumnsContext.Provider
      value={{ columns, addColumn, editColumn, deleteColumn }}
    >
      {children}
    </ColumnsContext.Provider>
  );
}

export function useColumns() {
  return useContext(ColumnsContext);
}
