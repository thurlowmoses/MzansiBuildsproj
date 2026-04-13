// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

import React from "react";
import "../styles/error-boundary.css";

// Handles ErrorBoundary class.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || "Unknown runtime error." };
  }

  componentDidCatch(error) {
    console.error("Runtime error captured by ErrorBoundary:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="error-boundary-layout">
          <h1 className="error-boundary-title">App crashed at runtime</h1>
          <p className="error-boundary-message">
            This usually means a Firebase init/config issue or a component runtime error.
          </p>
          <pre className="error-boundary-details">
            {this.state.errorMessage}
          </pre>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

