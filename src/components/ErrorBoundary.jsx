import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Runtime error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#1f2333", color: "#fff", padding: "24px" }}>
          <div style={{ maxWidth: "860px", background: "#2a2f43", borderRadius: "12px", padding: "20px" }}>
            <h2 style={{ marginTop: 0 }}>Runtime Error</h2>
            <p>The page crashed while rendering. Copy this and send it to me:</p>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{String(this.state.error)}</pre>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;