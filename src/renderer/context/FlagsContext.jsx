import { createContext, useContext, useState } from "react";

const SYSTEM_FLAGS = [
  { id: "bug", name: "Bug", color: "#C0392B", bold: false, isSystem: true },
  {
    id: "feature",
    name: "Feature",
    color: "#005F73",
    bold: false,
    isSystem: true,
  },
  {
    id: "urgente",
    name: "Urgente",
    color: "#E85D24",
    bold: true,
    isSystem: true,
  },
  {
    id: "melhoria",
    name: "Melhoria",
    color: "#00A676",
    bold: false,
    isSystem: true,
  },
  { id: "docs", name: "Docs", color: "#758956", bold: false, isSystem: true },
  { id: "teste", name: "Teste", color: "#2B2D42", bold: false, isSystem: true },
];

function loadCustomFlags() {
  try {
    const saved = localStorage.getItem("codesprint:custom-flags");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveCustomFlags(flags) {
  localStorage.setItem("codesprint:custom-flags", JSON.stringify(flags));
}

const FlagsContext = createContext(null);

export function FlagsProvider({ children }) {
  const [customFlags, setCustomFlags] = useState(loadCustomFlags);

  const allFlags = [...SYSTEM_FLAGS, ...customFlags];

  const updateCustomFlags = (updated) => {
    setCustomFlags(updated);
    saveCustomFlags(updated);
  };

  const addFlag = (flag) => {
    const newFlag = {
      id: `flag-${Date.now()}`,
      name: flag.name,
      color: flag.color,
      bold: flag.bold || false,
      isSystem: false,
    };
    updateCustomFlags([...customFlags, newFlag]);
  };

  const editFlag = (id, changes) => {
    updateCustomFlags(
      customFlags.map((f) => (f.id === id ? { ...f, ...changes } : f)),
    );
  };

  const deleteFlag = (id) => {
    updateCustomFlags(customFlags.filter((f) => f.id !== id));
  };

  return (
    <FlagsContext.Provider
      value={{ allFlags, customFlags, addFlag, editFlag, deleteFlag }}
    >
      {children}
    </FlagsContext.Provider>
  );
}

export function useFlags() {
  return useContext(FlagsContext);
}
