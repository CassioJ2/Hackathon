import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { FlagsProvider } from "./context/FlagsContext";
import { CardTypesProvider } from "./context/CardTypesContext";
import "./styles/tokens.css";
import "./styles/global.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CardTypesProvider>
      <FlagsProvider>
        <App />
      </FlagsProvider>
    </CardTypesProvider>
  </React.StrictMode>,
);
