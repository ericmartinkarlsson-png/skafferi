import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import { Shield, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Optional: prompt user to select account each time
      googleAuthProvider.setCustomParameters({
        prompt: 'select_account',
      });

      await signInWithPopup(auth, googleAuthProvider);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error: any) {
      console.error('Firebase Google Sign-In Error:', error);

      if (error?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Inloggningen avbröts eftersom popup-fönstret stängdes.');
      } else if (error?.code === 'auth/popup-blocked') {
        setErrorMessage('Popup-fönstret blockerades av webbläsaren. Tillåt popup-fönster för den här webbplatsen och försök igen.');
      } else if (error?.code === 'auth/unauthorized-domain') {
        setErrorMessage(
          'Domänen är inte auktoriserad i Firebase Console. Lägg till aktuell domän under "Authentication -> Settings -> Authorized domains" i Firebase.'
        );
      } else if (error?.code === 'auth/operation-not-allowed') {
        setErrorMessage(
          'Google-inloggning är inte aktiverat i Firebase Console. Aktivera Google under "Authentication -> Sign-in method" i Firebase Console.'
        );
      } else {
        setErrorMessage(error?.message || 'Ett oväntat fel uppstod vid inloggningen. Försök igen.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background glow accent */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-900/25 rounded-full blur-3xl pointer-events-none" />

      <div 
        id="login-container"
        className="w-full max-w-sm bg-stone-800/95 backdrop-blur-md border border-stone-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10"
      >
        {/* Cabin Brand Identity */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-800/40 border border-emerald-500/30 flex items-center justify-center text-3xl mb-3 shadow-inner">
            🐻
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Björnstugan
          </h1>
          <p className="text-emerald-400 font-medium text-xs tracking-wider uppercase mt-0.5">
            Lager & Skafferi
          </p>
          <p className="text-stone-400 text-xs mt-2 leading-relaxed max-w-xs">
            Logga in med ditt Google-konto för att få tillgång till stugans gemensamma inventarium, bäst-före-datum och inköpslista.
          </p>
        </div>

        {/* Security & Access Notice */}
        <div className="bg-stone-900/70 border border-stone-700/60 rounded-xl p-3 mb-5 text-[11px] text-stone-300 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span className="leading-snug">
            Appen är skyddad med <strong>Firebase Authentication</strong>. Endast inloggade användare kan läsa och uppdatera varor.
          </span>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div 
            id="login-error-alert"
            className="mb-4 p-3 bg-rose-950/60 border border-rose-800/70 rounded-xl text-rose-300 text-xs flex items-start gap-2 leading-snug"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          id="google-signin-btn"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-800 font-semibold rounded-xl flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed border border-stone-200 text-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-stone-600" />
              <span>Loggar in med Google...</span>
            </>
          ) : (
            <>
              {/* Google G Logo SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.27 21.43 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.25C.45 8.16 0 9.98 0 12s.45 3.84 1.25 5.43l4.03-3.14z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.57 1.25 6.57l4.03 3.14c.95-2.83 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>Logga in med Google</span>
            </>
          )}
        </button>

        {/* Security & Sync Details */}
        <div className="mt-6 pt-4 border-t border-stone-700/60 text-center space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Automatisk realtidssynk via Firestore</span>
          </div>
          <p className="text-[10px] text-stone-500">
            Björnstugan Skafferi • Version för hushållet
          </p>
        </div>
      </div>
    </div>
  );
};
