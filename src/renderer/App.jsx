import { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import RepoSelectPage from "./pages/RepoSelectPage";
import KanbanPage from "./pages/KanbanPage";

export default function App() {
  const [page, setPage] = useState("login");
  const [tasks, setTasks] = useState([]);
  const [activeRepo, setActiveRepo] = useState(null);

  useEffect(() => {
    window.electron.invoke("session:get").then(async (session) => {
      if (session.isAuthenticated && session.activeRepo) {
        try {
          const loadedTasks = await window.electron.invoke("tasks:load", {
            owner: session.activeRepo.owner,
            repo: session.activeRepo.repo,
          });

          setActiveRepo(session.activeRepo);
          setTasks(loadedTasks);
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
            setPage("repo-select");
          }}
        />
      )}
      {page === "repo-select" && (
        <RepoSelectPage
          onRepoSelected={({ repo, tasks: selectedTasks }) => {
            setActiveRepo(repo);
            setTasks(selectedTasks);
            setPage("kanban");
          }}
        />
      )}
      {page === "kanban" && (
        <KanbanPage
          initialTasks={tasks}
          activeRepo={activeRepo}
          onTasksChange={setTasks}
          onLogout={() => {
            setTasks([]);
            setActiveRepo(null);
            setPage("login");
          }}
        />
      )}
    </>
  );
}
