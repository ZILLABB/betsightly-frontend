import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode);
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Root-level error boundary. Catches any uncaught render error in the
 * React tree and shows a styled fallback instead of a blank white page.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Uncaught render error:", error, info?.componentStack);
  }

  reset = (): void => this.setState({ hasError: false, error: null });

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) {
      if (typeof this.props.fallback === "function" && this.state.error) {
        return (this.props.fallback as (e: Error, r: () => void) => ReactNode)(this.state.error, this.reset);
      }
      return this.props.fallback as ReactNode;
    }

    const msg = this.state.error?.message || "An unexpected error occurred";

    return (
      <div style={{
        minHeight: "70vh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "40px 24px", textAlign: "center", gap: 16,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.20)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <AlertTriangle size={24} color="var(--red)" />
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: "var(--text-1)" }}>
          Something went wrong
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)", maxWidth: 380, lineHeight: 1.6 }}>
          We hit an unexpected error while rendering this page.
          Try refreshing — if it persists, head back home.
        </p>
        <p style={{
          fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)",
          maxWidth: 480, wordBreak: "break-word",
          padding: "8px 12px", borderRadius: 6,
          background: "var(--surface-2)", border: "1px solid var(--border)",
        }}>
          {msg}
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 18px", borderRadius: 8, cursor: "pointer",
              fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600,
              background: "var(--brand)", color: "#fff", border: "none",
            }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <a
            href="/"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 18px", borderRadius: 8,
              fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600,
              background: "var(--surface-2)", color: "var(--text-1)", textDecoration: "none",
              border: "1px solid var(--border)",
            }}>
            <Home size={14} /> Back to home
          </a>
        </div>
      </div>
    );
  }
}

export { ErrorBoundary };
export default ErrorBoundary;
