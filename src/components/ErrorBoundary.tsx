import { Component, type ReactNode } from 'react';

interface Props {
  // Drawn instead of the children once one of them throws while drawing; `retry` draws the children again.
  fallback: (retry: () => void) => ReactNode;
  children: ReactNode;
}

// Without a boundary, a throw while drawing unmounts the whole app and leaves a blank page. Only a class
// can catch one: React has no hook for it. React itself still logs the error to the console.
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  retry = () => this.setState({ failed: false });

  render() {
    return this.state.failed ? this.props.fallback(this.retry) : this.props.children;
  }
}
