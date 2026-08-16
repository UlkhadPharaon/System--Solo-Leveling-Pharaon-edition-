import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  confirmPurge: boolean;
}

/**
 * Last line of defense against runtime crashes. Without it, a throw inside
 * any component unmounts the whole React tree and the player is left on a
 * blank page with no way back in. The fallback offers two escapes:
 * a plain reload, and — for crash loops caused by corrupted local state —
 * a purge of everything the app keeps in localStorage.
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, confirmPurge: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('SYSTEM ERROR — component tree crashed:', error, info.componentStack);
  }

  private purgeLocalData = () => {
    // App state lives under the `aura_` prefix plus two legacy unprefixed keys.
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('aura_') || key === 'narrative_chapter_index' || key === 'last_ritual_claim')) {
        keys.push(key);
      }
    }
    keys.forEach((key) => localStorage.removeItem(key));
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-obsidian px-6 text-center">
        <div className="border border-gold/40 bg-obsidian-elevated px-8 py-10 shadow-[0_0_40px_var(--color-gold-glow)] rounded-2xl max-w-md">
          <p className="font-mono text-xs tracking-[0.3em] text-blood uppercase">
            Critical Failure
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold text-gold">
            The System Has Crashed
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-text-secondary">
            An unexpected error interrupted the System. Your progress is stored
            locally and is safe. Try restarting — if the crash repeats on launch,
            purging local data will restore the System to a clean state.
          </p>
          {import.meta.env.DEV && (
            <pre className="mt-4 max-h-32 overflow-auto rounded-lg border border-lapis-border bg-obsidian p-3 text-left font-mono text-xs text-text-muted">
              {this.state.error.message}
            </pre>
          )}
          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-gold px-6 py-3 font-semibold text-text-inverse transition-colors hover:bg-gold-bright"
            >
              Restart the System
            </button>
            {this.state.confirmPurge ? (
              <div className="flex gap-2">
                <button
                  onClick={this.purgeLocalData}
                  className="flex-1 rounded-lg border border-blood bg-blood/10 px-4 py-2 text-sm font-semibold text-blood transition-colors hover:bg-blood hover:text-white"
                >
                  Confirm purge
                </button>
                <button
                  onClick={() => this.setState({ confirmPurge: false })}
                  className="flex-1 rounded-lg border border-lapis-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-obsidian-hover"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => this.setState({ confirmPurge: true })}
                className="text-xs text-text-muted underline transition-colors hover:text-blood"
              >
                Crash loop? Purge local data (erases progress)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
