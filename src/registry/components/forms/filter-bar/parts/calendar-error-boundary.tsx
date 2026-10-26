"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

/**
 * Catches a failed lazy calendar chunk so it cannot unmount the host app. The fallback
 * announces the failure (`role="alert"`) and offers a Retry that re-attempts the import.
 */
export class CalendarErrorBoundary extends Component<
  { message: string; retryText: string; onRetry: () => void; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  private retry = () => {
    this.props.onRetry();
    this.setState({ failed: false });
  };

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="flex flex-col items-start gap-2 p-4 text-sm">
        <span>{this.props.message}</span>
        <Button type="button" variant="outline" size="sm" onClick={this.retry}>
          {this.props.retryText}
        </Button>
      </div>
    );
  }
}
