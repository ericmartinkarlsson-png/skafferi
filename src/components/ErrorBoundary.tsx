import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Björnstugan App Error Caught:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/30">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold mb-2">Ett tillfälligt fel uppstod</h1>
          <p className="text-stone-400 text-sm max-w-sm mb-6 leading-relaxed">
            Kamera- eller gränssnittshanteringen stötte på ett oväntat fel. Ditt inventarium är säkert sparat.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Ladda om appen</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
