import React from "react";
import i18n from "../../i18n/index.ts";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches the errors of the components below it and shows a message with a button to reload the page,
 * instead of a blank page.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Error caught by ErrorBoundary:", error, info);
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