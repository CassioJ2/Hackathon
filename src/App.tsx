import { useState } from "react";

function App() {
  const [result, setResult] = useState("");

  const handleTest = async () => {
    const platform = window.electron.platform;
    setResult(`Rodando no: ${platform}`);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>CodeSprint</h1>
      <button onClick={handleTest}>Testar IPC Bridge</button>
      <p>{result}</p>
    </div>
  );
}

export default App;
