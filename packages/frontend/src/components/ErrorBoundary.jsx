import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(err) {
    return { hasError: true, message: err?.message || 'Unexpected error' };
  }

  componentDidCatch(err, info) {
    console.error('ErrorBoundary caught:', err, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.message}</p>
          <button
            className="btn-primary"
            onClick={() => this.setState({ hasError: false, message: '' })}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
