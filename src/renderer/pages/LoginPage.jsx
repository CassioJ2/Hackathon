import { useState, useEffect } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import styles from "./LoginPage.module.css";
import logo from "../logo.svg";

export default function LoginPage({ onAuthSuccess }) {
  const [step, setStep] = useState("idle"); // idle | waiting | polling | error
  const [userCode, setUserCode] = useState("");
  const [verificationUri, setVerificationUri] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const cleanup = window.electron.on("github:auth-success", () => {
      setStep("idle");
      onAuthSuccess();
    });

    const cleanupError = window.electron.on("github:auth-error", (msg) => {
      setError(msg);
      setStep("error");
    });

    return () => {
      cleanup?.();
      cleanupError?.();
    };
  }, [onAuthSuccess]);

  const handleLogin = async () => {
    try {
      setStep("waiting");
      setError("");

      const data = await window.electron.invoke("github:login");

      setUserCode(data.userCode);
      setVerificationUri(data.verificationUri);
      setStep("polling");
    } catch (err) {
      setError(err.message);
      setStep("error");
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(userCode);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <img src={logo} width="250" height="140" alt="CodeSprint" />
        </div>

        <h1 className={styles.title}>CodeSprint</h1>
        <p className={styles.subtitle}>
          AI-Native project manager synced with GitHub
        </p>

        {step === "idle" && (
          <button className={styles.btnPrimary} onClick={handleLogin}>
            Entrar com GitHub
          </button>
        )}

        {step === "waiting" && (
          <div className={styles.loadingWrap}>
            <LoadingSpinner />
            <p className={styles.loadingText}>Iniciando autenticação...</p>
          </div>
        )}

        {step === "polling" && (
          <div className={styles.codeWrap}>
            <p className={styles.instruction}>
              Acesse o link abaixo e insira o código:
            </p>

            <a
              className={styles.link}
              href={verificationUri}
              target="_blank"
              rel="noreferrer"
            >
              {verificationUri}
            </a>

            <div className={styles.codeBox}>
              <span className={styles.code}>{userCode}</span>

              <button className={styles.btnCopy} onClick={handleCopyCode}>
                Copiar
              </button>
            </div>

            <div className={styles.pollingWrap}>
              <LoadingSpinner size="sm" />
              <p className={styles.pollingText}>Aguardando autorização...</p>
            </div>
          </div>
        )}

        {step === "error" && (
          <div className={styles.errorWrap}>
            <p className={styles.errorText}>{error}</p>

            <button className={styles.btnPrimary} onClick={handleLogin}>
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
