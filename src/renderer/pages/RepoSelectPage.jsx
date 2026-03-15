import { useEffect, useRef, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import styles from "./RepoSelectPage.module.css";

export default function RepoSelectPage({
  initialUiState,
  onUiStateChange,
  onRepoSelected,
}) {
  const [repos, setRepos] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState(initialUiState?.search || "");
  const [selected, setSelected] = useState(null);
  const [localPath, setLocalPath] = useState(initialUiState?.localPath || "");
  const [localRepoHint, setLocalRepoHint] = useState("");
  const [step, setStep] = useState("loading");
  const [error, setError] = useState("");
  const listRef = useRef(null);

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
    const nextFiltered = repos.filter((r) =>
      r.name.toLowerCase().includes(q) || r.fullName.toLowerCase().includes(q),
    );
    setFiltered(nextFiltered);
  }, [search, repos]);

  useEffect(() => {
    if (!repos.length || !initialUiState?.selectedRepoId) return;

    const selectedRepo = repos.find(
      (repo) => repo.id === initialUiState.selectedRepoId,
    );

    if (selectedRepo) {
      setSelected(selectedRepo);
    }
  }, [repos, initialUiState?.selectedRepoId]);

  useEffect(() => {
    if (step !== "ready" || !listRef.current) return;

    listRef.current.scrollTop = initialUiState?.scrollTop || 0;
  }, [step, initialUiState?.scrollTop]);

  useEffect(() => {
    onUiStateChange?.({
      search,
      selectedRepoId: selected?.id || null,
      scrollTop: listRef.current?.scrollTop || 0,
      localPath,
    });
  }, [search, selected, localPath, onUiStateChange]);

  const handlePickLocalPath = async () => {
    try {
      const pickedPath = await window.electron.invoke("repo:pick-local-path");
      if (pickedPath) {
        setLocalPath(pickedPath);
        setLocalRepoHint("");
      }
    } catch (err) {
      if (err.message?.includes("No handler registered")) {
        setError("O app precisa ser reiniciado para carregar o seletor de pasta local.");
        setStep("ready");
        return;
      }

      setError(err.message);
      setStep("error");
    }
  };

  const handleConfirm = async () => {
    if (!selected) return;
    try {
      setStep("confirming");
      setError("");

      if (localPath) {
        const validation = await window.electron.invoke(
          "repo:validate-local-path",
          {
            owner: selected.owner,
            repo: selected.name,
            localPath,
          },
        );

        if (!validation?.valid) {
          const detectedFullName = validation?.detectedRepo
            ? `${validation.detectedRepo.owner}/${validation.detectedRepo.repo}`
            : null;

          const reasonMessage = detectedFullName
            ? `A pasta escolhida aponta para ${detectedFullName}, nao para ${selected.owner}/${selected.name}.`
            : "A pasta escolhida nao parece ser o clone local desse repositorio.";

          setLocalRepoHint(reasonMessage);
          setError(reasonMessage);
          setStep("ready");
          return;
        }

        setLocalRepoHint(`Clone local validado para ${selected.owner}/${selected.name}.`);
      }

      const tasks = await window.electron.invoke("tasks:load", {
        owner: selected.owner,
        repo: selected.name,
        localPath: localPath || undefined,
      });
      const session = await window.electron.invoke("session:get");
      onRepoSelected({
        repo: { owner: selected.owner, repo: selected.name, localPath: localPath || null },
        tasks,
        hasDirtyCache: !!session.tasksDirty,
      });
    } catch (err) {
      setError(err.message);
      setStep("error");
    }
  };

  const handleScroll = () => {
    onUiStateChange?.({
      search,
      selectedRepoId: selected?.id || null,
      scrollTop: listRef.current?.scrollTop || 0,
      localPath,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Selecionar repositorio</h1>
        <p className={styles.subtitle}>
          Escolha o repositorio e, se quiser usar o clone local real, vincule a pasta do projeto.
        </p>

        {step === "loading" && (
          <div className={styles.loadingWrap}>
            <LoadingSpinner />
            <p className={styles.loadingText}>Carregando repositorios...</p>
          </div>
        )}

        {(step === "ready" || step === "confirming") && (
          <>
            <input
              className={styles.search}
              type="text"
              placeholder="Buscar repositorio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className={styles.list} ref={listRef} onScroll={handleScroll}>
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
                <p className={styles.empty}>Nenhum repositorio encontrado</p>
              )}
            </div>

            <div className={styles.localRepoBox}>
              <div className={styles.localRepoHeader}>
                <span className={styles.localRepoTitle}>Repositorio local</span>
                <button className={styles.btnSecondary} onClick={handlePickLocalPath}>
                  {localPath ? "Trocar pasta" : "Selecionar pasta"}
                </button>
              </div>
              <p className={styles.localRepoText}>
                {localPath || "Nenhuma pasta vinculada. Sem isso, o app usa o cache interno."}
              </p>
              {localRepoHint && (
                <p className={styles.localRepoHint}>{localRepoHint}</p>
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
                "Confirmar selecao"
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
