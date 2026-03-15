import { createContext, useContext, useState } from "react";

const SYSTEM_CARD_TYPES = [
  { id: "task", name: "Task", icon: "✓", color: "#005F73", isSystem: true },
  { id: "bug", name: "Bug", icon: "⚠", color: "#C0392B", isSystem: true },
  {
    id: "story",
    name: "História",
    icon: "📖",
    color: "#8B5CF6",
    isSystem: true,
  },
  { id: "spike", name: "Spike", icon: "🔍", color: "#B45309", isSystem: true },
  {
    id: "blocker",
    name: "Blocker",
    icon: "🚫",
    color: "#E85D24",
    isSystem: true,
  },
  { id: "epic", name: "Epic", icon: "⚡", color: "#0EA5E9", isSystem: true },
];

function loadCustomTypes() {
  try {
    const saved = localStorage.getItem("codesprint:card-types");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveCustomTypes(types) {
  localStorage.setItem("codesprint:card-types", JSON.stringify(types));
}

const CardTypesContext = createContext(null);

export function CardTypesProvider({ children }) {
  const [customTypes, setCustomTypes] = useState(loadCustomTypes);

  const allTypes = [...SYSTEM_CARD_TYPES, ...customTypes];

  const updateCustomTypes = (updated) => {
    setCustomTypes(updated);
    saveCustomTypes(updated);
  };

  const addType = (type) => {
    const newType = {
      id: `type-${Date.now()}`,
      name: type.name,
      icon: type.icon,
      color: type.color,
      isSystem: false,
    };
    updateCustomTypes([...customTypes, newType]);
  };

  const editType = (id, changes) => {
    updateCustomTypes(
      customTypes.map((t) => (t.id === id ? { ...t, ...changes } : t)),
    );
  };

  const deleteType = (id) => {
    updateCustomTypes(customTypes.filter((t) => t.id !== id));
  };

  return (
    <CardTypesContext.Provider
      value={{ allTypes, customTypes, addType, editType, deleteType }}
    >
      {children}
    </CardTypesContext.Provider>
  );
}

export function useCardTypes() {
  return useContext(CardTypesContext);
}
