"use client";

import React from "react";

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Errore non gestito nel BookingBoard:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="board-wrap" style={{ padding: "24px", display: "grid", gap: "12px" }}>
          <p className="error-box" style={{ margin: 0 }}>
            <strong>Errore imprevisto nel board.</strong>
            {this.state.error ? <><br />{this.state.error.message}</> : null}
          </p>
          <div>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Riprova
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
