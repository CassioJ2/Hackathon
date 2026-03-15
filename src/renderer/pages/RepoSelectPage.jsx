import { useState, useEffect } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import styles from "./RepoSelectPage.module.css";

export default function RepoSelectPage({ onRepoSelected }) {
  const [repos, setRepos] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState("loading"); // loading | ready | confirming | error
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRepos = async () => {
      try {
        setStep("loading");
        setError("");
        const data = await window.electron.invoke("github:repos");
        setRepos(data);
        setFiltered(data);
        setStep("ready");
      } catch (err) {
        setError(err.message);
        setStep("error");
      }
    };

    loadRepos();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(repos.filter((r) => r.name.toLowerCase().includes(q)));
  }, [search, repos]);

  const handleConfirm = async () => {
    if (!selected) return;
    try {
      setStep("confirming");
      const tasks = await window.electron.invoke("tasks:load", {
        owner: selected.owner,
        repo: selected.name,
      });
      onRepoSelected({
        repo: { owner: selected.owner, repo: selected.name },
        tasks,
      });
    } catch (err) {
      setError(err.message);
      setStep("error");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Selecionar repositório</h1>
        <p className={styles.subtitle}>
          Escolha o repositório onde o tasks.md ser sincronizado
        </p>

        {step === "loading" && (
          <div className={styles.loadingWrap}>
            <LoadingSpinner />
            <p className={styles.loadingText}>Carregando repositórios...</p>
          </div>
        )}

        {(step === "ready" || step === "confirming") && (
          <>
            <input
              className={styles.search}
              type="text"
              placeholder="Buscar repositório..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className={styles.list}>
              {filtered.map((repo) => (
                <button
                  key={repo.id}
                  className={`${styles.repoItem} ${selected?.id === repo.id ? styles.repoItemActive : ""}`}
                  onClick={() => setSelected(repo)}
                >
                  <span className={styles.repoName}>{repo.name}</span>
                  <span className={styles.repoDesc}>{repo.fullName}</span>
                </button>
              ))}

              {filtered.length === 0 && (
                <p className={styles.empty}>Nenhum repositório encontrado</p>
              )}
            </div>

            <button
              className={styles.btnPrimary}
              onClick={handleConfirm}
              disabled={!selected || step === "confirming"}
            >
              {step === "confirming" ? (
                <LoadingSpinner size="sm" />
              ) : (
                "Confirmar seleção"
              )}
            </button>
          </>
        )}

        {step === "error" && (
          <div className={styles.errorWrap}>
            <p className={styles.errorText}>{error}</p>
            <button
              className={styles.btnPrimary}
              onClick={() => window.location.reload()}
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
