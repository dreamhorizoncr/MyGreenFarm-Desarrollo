// ErrorBoundary.tsx
import React from "react";
import i18n from "../i18n/index.ts";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Error capturado por ErrorBoundary:", error, info);
    // Opcional: enviar a un servicio de logging/monitoreo
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h2>{i18n.t("common.errorBoundary.title")}</h2>
          <p>{i18n.t("common.errorBoundary.description")}</p>
          <button onClick={() => window.location.reload()}>{i18n.t("common.errorBoundary.reload")}</button>
        </div>
      );
    }
    return this.props.children;
  }
}