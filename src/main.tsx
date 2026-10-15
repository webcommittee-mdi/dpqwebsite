import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Fonts are bundled with the site (no Google Fonts request); only the weights used are included.
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/400-italic.css";
import "./styles.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
