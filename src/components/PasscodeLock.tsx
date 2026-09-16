import React, { useState } from 'react';
import { Lock, KeyRound, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { AUTH_PASSCODE } from '../services/storage';

interface PasscodeLockProps {
  onSuccess: () => void;
}

export const PasscodeLock: React.FC<PasscodeLockProps> = ({ onSuccess }) => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passcode.trim() === AUTH_PASSCODE) {
      setError(false);
      onSuccess();
    } else {
      setError(true);
      setErrorMessage('Felaktig lösenkod. Försök igen.');
      setTimeout(() => setError(false), 2000);
    }
  };

  const handleQuickFill = () => {
    setPasscode(AUTH_PASSCODE);
    setError(false);
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle atmospheric background accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-900/30 rounded-full blur-3xl pointer-events-none" />

      <div 
        id="passcode-container"
        className={`w-full max-w-sm bg-stone-800/90 backdrop-blur-md border border-stone-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 transition-transform duration-200 ${
          error ? 'animate-bounce border-rose-500/80' : ''
        }`}
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-800/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Björnstugan
          </h1>
          <p className="text-stone-400 text-sm mt-1">
            Privat lager, skafferi och förbrukning
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              id="passcode-input"
              type={showPasscode ? 'text' : 'password'}
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                if (error) setError(false);
              }}
              placeholder="Ange lösenkod..."
              autoFocus
              className="w-full pl-10 pr-11 py-3 bg-stone-900/90 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition text-base tracking-wide"
            />
            <button
              id="toggle-passcode-visibility-btn"
              type="button"
              onClick={() => setShowPasscode(!showPasscode)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-200"
              title={showPasscode ? 'Dölj lösenord' : 'Visa lösenord'}
            >
              {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <div className="text-rose-400 text-xs font-medium bg-rose-950/40 border border-rose-800/50 rounded-lg p-2.5 text-center">
              {errorMessage}
            </div>
          )}

          <button
            id="passcode-submit-btn"
            type="submit"
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition duration-150 cursor-pointer"
          >
            <span>Logga in</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-stone-700/60 text-center">
          <button
            id="quick-fill-passcode-btn"
            type="button"
            onClick={handleQuickFill}
            className="text-xs text-stone-400 hover:text-emerald-400 transition inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Fyll i lösenkod: <strong className="font-mono text-stone-300">Björnstugan1337</strong></span>
          </button>
        </div>
      </div>
    </div>
  );
};
