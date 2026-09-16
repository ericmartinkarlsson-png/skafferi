import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, RefreshCw, Barcode, CheckCircle2, AlertCircle, Plus, Minus, Search } from 'lucide-react';
import { Product, AppMode } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currentMode: AppMode;
  onProductScanned: (product: Product, action: 'increment' | 'decrement' | 'select') => void;
  onUnknownBarcodeScanned: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  currentMode,
  onProductScanned,
  onUnknownBarcodeScanned,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedMessage, setLastScannedMessage] = useState<{
    text: string;
    type: 'success' | 'warning' | 'info';
  } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader-container';

  // Play subtle feedback audio beep
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // AudioContext might be constrained
    }
  };

  const handleBarcodeDetected = (decodedText: string) => {
    const cleanCode = decodedText.trim();
    if (!cleanCode) return;

    playBeep();

    // Look for matching product
    const matched = products.find(
      (p) => p.barcode && p.barcode.trim().toLowerCase() === cleanCode.toLowerCase()
    );

    if (matched) {
      if (currentMode === 'påfyllnad') {
        onProductScanned(matched, 'increment');
        setLastScannedMessage({
          text: `+1 ${matched.name} (Nytt saldo: ${matched.quantity + 1} ${matched.unit})`,
          type: 'success',
        });
      } else if (currentMode === 'uttag') {
        const newQty = Math.max(0, matched.quantity - 1);
        onProductScanned(matched, 'decrement');
        setLastScannedMessage({
          text: `-1 ${matched.name} (Kvar i lager: ${newQty} ${matched.unit})`,
          type: 'warning',
        });
      } else {
        onProductScanned(matched, 'select');
        setLastScannedMessage({
          text: `Hittade: ${matched.name} (${matched.quantity} ${matched.unit})`,
          type: 'info',
        });
      }
    } else {
      setLastScannedMessage({
        text: `Okänd streckkod (${cleanCode}). Klicka nedan för att registrera artikeln.`,
        type: 'warning',
      });
      onUnknownBarcodeScanned(cleanCode);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
      return;
    }

    let isMounted = true;
    setCameraError(null);
    setLastScannedMessage(null);

    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode(scannerContainerId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 160 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (isMounted) {
              handleBarcodeDetected(decodedText);
            }
          },
          () => {
            // Ignore frame scan failures
          }
        );

        if (isMounted) {
          setIsScanning(true);
        }
      } catch (err) {
        console.warn('Camera scanner initialization failed:', err);
        if (isMounted) {
          setCameraError(
            'Kunde inte starta kameran. Kontrollera behörigheter eller använd manuell inmatning/snabbknappar nedan.'
          );
          setIsScanning(false);
        }
      }
    };

    // Small delay to ensure DOM element exists
    const timeout = setTimeout(() => {
      startScanner();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [isOpen, currentMode]);

  if (!isOpen) return null;

  // Sample quick barcodes from existing products for instant testing without a physical camera
  const sampleProductsWithBarcode = products.filter((p) => p.barcode).slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        id="scanner-modal"
        className="w-full max-w-md bg-stone-900 text-white rounded-2xl border border-stone-700 shadow-2xl overflow-hidden flex flex-col my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="font-semibold text-sm sm:text-base text-white">Streckkodsläsare</h2>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-stone-400">Läge:</span>
                {currentMode === 'påfyllnad' && (
                  <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                    <Plus className="w-3 h-3" /> Påfyllnad (+1)
                  </span>
                )}
                {currentMode === 'uttag' && (
                  <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                    <Minus className="w-3 h-3" /> Uttag (-1)
                  </span>
                )}
                {currentMode === 'normal' && (
                  <span className="text-stone-300">Översikt / Sök</span>
                )}
              </div>
            </div>
          </div>
          <button
            id="close-scanner-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Area */}
        <div className="relative bg-black min-h-[260px] flex items-center justify-center overflow-hidden">
          <div id={scannerContainerId} className="w-full max-w-sm" />

          {/* Overlay viewfinder box if camera is running */}
          {isScanning && !cameraError && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
              <div className="w-64 h-40 border-2 border-emerald-400/80 rounded-xl relative shadow-lg">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-scanline" />
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] text-emerald-300 bg-stone-900/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  Rikta mot streckkod
                </span>
              </div>
            </div>
          )}

          {cameraError && (
            <div className="p-6 text-center max-w-xs">
              <div className="w-12 h-12 mx-auto rounded-full bg-stone-800 text-stone-400 flex items-center justify-center mb-3">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-xs text-stone-300 mb-2">{cameraError}</p>
              <p className="text-[11px] text-stone-400">
                Du kan testa snabb-skanning med knapparna nedan eller skriva in koden manuellt.
              </p>
            </div>
          )}
        </div>

        {/* Scan feedback notification */}
        {lastScannedMessage && (
          <div
            className={`p-3 text-xs flex items-center gap-2 border-y ${
              lastScannedMessage.type === 'success'
                ? 'bg-emerald-950/70 text-emerald-200 border-emerald-800/80'
                : lastScannedMessage.type === 'warning'
                ? 'bg-amber-950/70 text-amber-200 border-amber-800/80'
                : 'bg-stone-800 text-stone-200 border-stone-700'
            }`}
          >
            {lastScannedMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
            {lastScannedMessage.type === 'warning' && <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />}
            {lastScannedMessage.type === 'info' && <Search className="w-4 h-4 shrink-0 text-sky-400" />}
            <span className="font-medium flex-1">{lastScannedMessage.text}</span>
          </div>
        )}

        {/* Manual Barcode input & Quick presets */}
        <div className="p-4 space-y-3 bg-stone-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualCode.trim()) {
                handleBarcodeDetected(manualCode.trim());
                setManualCode('');
              }
            }}
            className="flex gap-2"
          >
            <input
              id="manual-barcode-input"
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Skriv in eller klistra in streckkod..."
              className="flex-1 px-3 py-2 text-xs bg-stone-800 border border-stone-700 rounded-lg text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              id="manual-barcode-submit-btn"
              type="submit"
              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Kör
            </button>
          </form>

          {/* Quick simulator buttons */}
          <div>
            <span className="text-[11px] text-stone-400 block mb-1.5 font-medium">
              Simulera skanning (för test):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sampleProductsWithBarcode.map((p) => (
                <button
                  key={p.id}
                  id={`test-scan-btn-${p.id}`}
                  type="button"
                  onClick={() => {
                    if (p.barcode) handleBarcodeDetected(p.barcode);
                  }}
                  className="px-2 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded text-[11px] text-stone-200 transition cursor-pointer flex items-center gap-1"
                >
                  <Barcode className="w-3 h-3 text-emerald-400" />
                  <span>{p.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            id="scanner-done-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-xs font-medium rounded-lg text-stone-200 transition cursor-pointer"
          >
            Klar
          </button>
        </div>
      </div>
    </div>
  );
};
