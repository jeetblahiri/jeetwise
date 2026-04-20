import { Component } from 'react';

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'The app hit an unexpected error while loading.',
    };
  }

  componentDidCatch(error) {
    console.error('jeetwise crashed during render:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-canvas bg-grain px-4 py-6 text-ink sm:px-6">
          <div className="mx-auto max-w-xl rounded-[1.75rem] border border-ink/10 bg-white/85 p-5 shadow-float backdrop-blur sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink/45">
              App Load Issue
            </p>
            <h1 className="mt-2 font-display text-3xl leading-tight text-ink">jeetwise</h1>
            <p className="mt-3 text-sm leading-6 text-ink/70">
              The page hit an unexpected runtime error before the interface finished loading.
            </p>
            <div className="mt-4 rounded-2xl border border-coral/25 bg-coral/10 px-4 py-3 text-sm leading-6 text-coral">
              {this.state.errorMessage}
            </div>
            <p className="mt-4 text-sm leading-6 text-ink/65">
              Refresh the page once. If it still happens, send this message and I can keep tracing
              it from the deployed build.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
