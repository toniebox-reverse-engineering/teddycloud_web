import ReactDOM from "react-dom/client";
import "./index.css";
import "./i18n";
import App from "./App";
import React from "react";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
