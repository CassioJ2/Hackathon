import { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import RepoSelectPage from "./pages/RepoSelectPage";
import KanbanPage from "./pages/KanbanPage";

const DEFAULT_REPO_SELECT_UI = {
  search: "",
  selectedRepoId: null,
  scrollTop: 0,
  localPath: "",
};

export default function App() {
  const [page, setPage] = useState("login");
  const [tasks, setTasks] = useState([]);
  const [activeRepo, setActiveRepo] = useState(null);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const [repoSelectUi, setRepoSelectUi] = useState(DEFAULT_REPO_SELECT_UI);

  useEffect(() => {
    window.electron.invoke("session:get").then(async (session) => {
      if (session.isAuthenticated && session.activeRepo) {
        try {
          const loadedTasks = await window.electron.invoke("tasks:load", {
            owner: session.activeRepo.owner,
            repo: session.activeRepo.repo,
            localPath: session.activeRepo.localPath,
          });
          const refreshedSession = await window.electron.invoke("session:get");

          setActiveRepo(refreshedSession.activeRepo || session.activeRepo);
          setTasks(loadedTasks);
          setHasLocalChanges(!!refreshedSession.tasksDirty);
          setPage("kanban");
        } catch (_error) {
          setPage("repo-select");
        }
      } else if (session.isAuthenticated) {
        setPage("repo-select");
      } else {
        setPage("login");
      }
    });
  }, []);

  return (
    <>
      {page === "login" && (
        <LoginPage
          onAuthSuccess={() => {
            setTasks([]);
            setActiveRepo(null);
            setHasLocalChanges(false);
            setRepoSelectUi(DEFAULT_REPO_SELECT_UI);
            setPage("repo-select");
          }}
        />
      )}
      {page === "repo-select" && (
        <RepoSelectPage
          initialUiState={repoSelectUi}
          onUiStateChange={setRepoSelectUi}
          onRepoSelected={({ repo, tasks: selectedTasks, hasDirtyCache }) => {
            setActiveRepo(repo);
            setTasks(selectedTasks);
            setHasLocalChanges(!!hasDirtyCache);
            setPage("kanban");
          }}
        />
      )}
      {page === "kanban" && (
        <KanbanPage
          initialTasks={tasks}
          initialHasChanges={hasLocalChanges}
          activeRepo={activeRepo}
          onTasksChange={setTasks}
          onDirtyChange={setHasLocalChanges}
          onChangeRepo={() => {
            setTasks([]);
            setPage("repo-select");
          }}
          onLogout={() => {
            setTasks([]);
            setActiveRepo(null);
            setHasLocalChanges(false);
            setRepoSelectUi(DEFAULT_REPO_SELECT_UI);
            setPage("login");
          }}
        />
      )}
    </>
  );
}
