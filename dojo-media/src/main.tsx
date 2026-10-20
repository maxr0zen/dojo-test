import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/oranienbaum/400.css";
import "@fontsource/manrope/400.css";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
