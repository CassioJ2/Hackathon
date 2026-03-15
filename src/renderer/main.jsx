import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { FlagsProvider } from "./context/FlagsContext";
import { CardTypesProvider } from "./context/CardTypesContext";
import { ColumnsProvider } from "./context/ColumnsContext";
import "./styles/tokens.css";
import "./styles/global.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ColumnsProvider>
      <CardTypesProvider>
        <FlagsProvider>
          <App />
        </FlagsProvider>
      </CardTypesProvider>
    </ColumnsProvider>
  </React.StrictMode>,
);
