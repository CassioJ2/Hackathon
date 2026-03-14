import { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import RepoSelectPage from "./pages/RepoSelectPage";

export default function App() {
  const [page, setPage] = useState("login"); // login | repo-select | kanban

  useEffect(() => {
    window.electron.invoke("session:get").then((session) => {
      if (session.isAuthenticated && session.activeRepo) {
        setPage("kanban");
      } else if (session.isAuthenticated) {
        setPage("repo-select");
      }
    });
  }, []);

  return (
    <>
      {page === "login" && (
        <LoginPage onAuthSuccess={() => setPage("repo-select")} />
      )}
      {page === "repo-select" && (
        <RepoSelectPage onRepoSelected={() => setPage("kanban")} />
      )}
      {page === "kanban" && (
        <div style={{ padding: 32 }}>
          <h1>Kanban — em breve!</h1>
        </div>
      )}
    </>
  );
}
