import React from "react";

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
        <main style={{ padding: "1.5rem", fontFamily: "sans-serif" }}>
          <h1 style={{ marginBottom: "0.75rem" }}>App crashed at runtime</h1>
          <p style={{ marginBottom: "0.5rem" }}>
            This usually means a Firebase init/config issue or a component runtime error.
          </p>
          <pre
            style={{
              background: "#111",
              color: "#f8fafc",
              padding: "0.75rem",
              borderRadius: "8px",
              whiteSpace: "pre-wrap",
            }}
          >
            {this.state.errorMessage}
          </pre>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
