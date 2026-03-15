import { useEffect } from "react";
import styles from "./Toast.module.css";

export default function Toast({ message, type = "info", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <span className={styles.message}>{message}</span>
      <button className={styles.btnClose} onClick={onClose}>
        ✕
      </button>
    </div>
  );
}
