import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, 
  X, 
  Barcode, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Minus, 
  Search, 
  PackagePlus,
  RefreshCw,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Product, AppMode } from '../types';
import { lookupOpenFoodFacts } from '../services/openFoodFactsService';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currentMode: AppMode;
  onProductScanned: (product: Product, action: 'increment' | 'decrement' | 'select') => void;
  onUnknownBarcodeScanned: (barcode: string, prefilledData?: Partial<Product> | null) => void;
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
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);
  const [searchingBarcode, setSearchingBarcode] = useState('');
  const [detectedUnknownBarcode, setDetectedUnknownBarcode] = useState<string | null>(null);
  const [detectedProduct, setDetectedProduct] = useState<Product | null>(null);
  const [lastScannedMessage, setLastScannedMessage] = useState<{
    text: string;
    type: 'success' | 'warning' | 'info';
  } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(false);
  const lastScannedBarcodeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
  const scannerContainerId = 'qr-reader-container';

  // Play subtle feedback audio beep safely
  const playBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // AudioContext might be constrained or blocked by browser policy
    }
  };

  const stopScannerSafely = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (e) {
        console.warn('Error while stopping camera scanner:', e);
      }
      try {
        await scannerRef.current.clear();
      } catch {
        // ignore clear error
      }
    }
    if (isMountedRef.current) {
      setIsScanning(false);
    }
  };

  const handleBarcodeDetected = async (decodedText: string) => {
    const cleanCode = decodedText.trim();
    if (!cleanCode || isProcessingRef.current) return;

    // Cooldown/debounce: prevent duplicate calls if the same barcode stays in front of camera
    const now = Date.now();
    if (
      lastScannedBarcodeRef.current.code === cleanCode &&
      now - lastScannedBarcodeRef.current.time < 3000
    ) {
      return;
    }
    lastScannedBarcodeRef.current = { code: cleanCode, time: now };
    isProcessingRef.current = true;

    playBeep();

    // 1. Sök alltid i vår egen Firestore-data först.
    // Om samma streckkod redan finns på en produkt i Björnstugan ska den befintliga
    // produktinformationen användas direkt. Gör då inget externt anrop till Open Food Facts.
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
        // Allow scanning next item after brief cooldown
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 1200);
      } else if (currentMode === 'uttag') {
        const newQty = Math.max(0, matched.quantity - 1);
        onProductScanned(matched, 'decrement');
        setLastScannedMessage({
          text: `-1 ${matched.name} (Kvar i lager: ${newQty} ${matched.unit})`,
          type: 'warning',
        });
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 1200);
      } else {
        // Normal mode: Pause and display match card
        await stopScannerSafely();
        setDetectedProduct(matched);
      }
      return;
    }

    // 2. Streckkoden finns inte i Firestore.
    // Gör ett produktuppslag mot Open Food Facts API med den skannade EAN-koden.
    await stopScannerSafely();
    setIsSearchingExternal(true);
    setSearchingBarcode(cleanCode);

    try {
      const offProduct = await lookupOpenFoodFacts(cleanCode);
      if (!isMountedRef.current) return;

      setIsSearchingExternal(false);

      if (offProduct) {
        // 3. Open Food Facts hittade produkten:
        // Förifyll formuläret med namn, varumärke, storlek, kategori, bild, enhet & streckkod
        onUnknownBarcodeScanned(cleanCode, {
          name: offProduct.name,
          brand: offProduct.brand,
          packageSize: offProduct.packageSize,
          category: offProduct.category,
          imageUrl: offProduct.imageUrl,
          unit: offProduct.suggestedUnit || 'st',
          barcode: cleanCode,
        });
      } else {
        // 4. Open Food Facts hittade inte produkten eller nätverksfel:
        // Öppna manuellt formulär med streckkoden redan ifylld.
        onUnknownBarcodeScanned(cleanCode, null);
      }
    } catch (err) {
      console.warn('Open Food Facts lookup error:', err);
      if (isMountedRef.current) {
        setIsSearchingExternal(false);
        onUnknownBarcodeScanned(cleanCode, null);
      }
    } finally {
      isProcessingRef.current = false;
    }
  };

  const handleRegisterNewProduct = async (code: string) => {
    await stopScannerSafely();
    setIsSearchingExternal(true);
    setSearchingBarcode(code);

    try {
      const offProduct = await lookupOpenFoodFacts(code);
      if (!isMountedRef.current) return;
      setIsSearchingExternal(false);

      if (offProduct) {
        onUnknownBarcodeScanned(code, {
          name: offProduct.name,
          brand: offProduct.brand,
          packageSize: offProduct.packageSize,
          category: offProduct.category,
          imageUrl: offProduct.imageUrl,
          unit: offProduct.suggestedUnit || 'st',
          barcode: code,
        });
      } else {
        onUnknownBarcodeScanned(code, null);
      }
    } catch {
      if (isMountedRef.current) {
        setIsSearchingExternal(false);
        onUnknownBarcodeScanned(code, null);
      }
    }
  };

  const handleOpenExistingProduct = async (product: Product) => {
    await stopScannerSafely();
    onProductScanned(product, 'select');
  };

  const handleResumeScanning = async () => {
    setDetectedUnknownBarcode(null);
    setDetectedProduct(null);
    setLastScannedMessage(null);
    isProcessingRef.current = false;
    startScanner();
  };

  const handleCloseModal = async () => {
    await stopScannerSafely();
    onClose();
  };

  const startScanner = async () => {
    if (!isMountedRef.current) return;
    setCameraError(null);

    try {
      const container = document.getElementById(scannerContainerId);
      if (!container) {
        console.warn('Scanner container DOM element not found yet.');
        return;
      }

      // If an existing scanner is alive, stop it first
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
        } catch {
          // ignore
        }
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 260, height: 160 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          if (isMountedRef.current) {
            handleBarcodeDetected(decodedText);
          }
        },
        () => {
          // Ignore intermittent scan frame misses
        }
      );

      if (isMountedRef.current) {
        setIsScanning(true);
        isProcessingRef.current = false;
      }
    } catch (err: any) {
      console.warn('Camera scanner initialization notice:', err);
      if (isMountedRef.current) {
        setIsScanning(false);
        setCameraError(
          'Kameran är inte tillgänglig i denna vy eller nekades behörighet. Du kan mata in streckkoden manuellt eller testa snabbknapparna nedan.'
        );
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    isProcessingRef.current = false;
    setDetectedUnknownBarcode(null);
    setDetectedProduct(null);
    setLastScannedMessage(null);
    setCameraError(null);

    if (isOpen) {
      const timer = setTimeout(() => {
        startScanner();
      }, 180);

      return () => {
        clearTimeout(timer);
        isMountedRef.current = false;
        stopScannerSafely();
      };
    } else {
      stopScannerSafely();
    }

    return () => {
      isMountedRef.current = false;
      stopScannerSafely();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sampleProductsWithBarcode = products.filter((p) => p.barcode).slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        id="scanner-modal"
        className="w-full max-w-md bg-stone-900 text-white rounded-2xl border border-stone-700 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-800 bg-stone-950/80">
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
            onClick={handleCloseModal}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View 0: When searching Open Food Facts */}
        {isSearchingExternal ? (
          <div className="p-6 bg-stone-900 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <RefreshCw className="w-7 h-7 animate-spin text-emerald-400" />
            </div>

            <div className="space-y-1">
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
                Open Food Facts
              </span>
              <h3 className="text-base font-bold text-white pt-1">
                Söker artikelinformation...
              </h3>
              <p className="text-stone-400 text-xs max-w-xs">
                Letar efter produktnamn, varumärke och bild för kod <span className="font-mono text-emerald-300">{searchingBarcode}</span>.
              </p>
            </div>

            <div className="w-full pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsSearchingExternal(false);
                  onUnknownBarcodeScanned(searchingBarcode, null);
                }}
                className="text-xs text-stone-400 hover:text-stone-200 underline cursor-pointer py-1"
              >
                Hoppa över och fyll i manuellt
              </button>
            </div>
          </div>
        ) : detectedUnknownBarcode ? (
          <div className="p-5 bg-stone-900 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <PackagePlus className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
                Ny streckkod upptäckt
              </span>
              <h3 className="text-lg font-bold text-white pt-1">
                Registrera ny artikel
              </h3>
              <p className="text-stone-400 text-xs max-w-xs">
                Denna streckkod finns inte i Björnstugans inventarium än. Vill du spara den som en ny vara?
              </p>
            </div>

            <div className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 flex items-center justify-between font-mono text-sm">
              <span className="text-stone-400 text-xs">Streckkod (EAN):</span>
              <span className="text-emerald-300 font-bold tracking-wider bg-stone-900 px-2.5 py-1 rounded border border-stone-700">
                {detectedUnknownBarcode}
              </span>
            </div>

            <div className="w-full space-y-2 pt-1">
              <button
                id="register-new-from-scan-btn"
                type="button"
                onClick={() => handleRegisterNewProduct(detectedUnknownBarcode)}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-950/50 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Lägg till artikel med denna streckkod</span>
              </button>

              <button
                id="resume-scanning-btn"
                type="button"
                onClick={handleResumeScanning}
                className="w-full py-2 px-3 text-xs text-stone-400 hover:text-stone-200 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Skanna en annan kod</span>
              </button>
            </div>
          </div>
        ) : detectedProduct ? (
          /* View 2: When an existing product is found in Normal mode */
          <div className="p-5 bg-stone-900 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-stone-800 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
                Hittade artikel i lager
              </span>
              <h3 className="text-lg font-bold text-white pt-1">
                {detectedProduct.name}
              </h3>
              <p className="text-stone-400 text-xs">
                Kategori: <strong className="text-stone-300 capitalize">{detectedProduct.category}</strong> • Saldo: <strong className="text-emerald-400">{detectedProduct.quantity} {detectedProduct.unit}</strong>
              </p>
            </div>

            <div className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 flex items-center justify-between text-xs">
              <span className="text-stone-400">Streckkod:</span>
              <span className="font-mono text-stone-200 bg-stone-900 px-2 py-0.5 rounded border border-stone-700">
                {detectedProduct.barcode}
              </span>
            </div>

            <div className="w-full space-y-2 pt-1">
              <button
                id="open-detected-product-btn"
                type="button"
                onClick={() => handleOpenExistingProduct(detectedProduct)}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Öppna & Redigera artikel</span>
              </button>

              <button
                type="button"
                onClick={handleResumeScanning}
                className="w-full py-2 px-3 text-xs text-stone-400 hover:text-stone-200 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Skanna nästa artikel</span>
              </button>
            </div>
          </div>
        ) : (
          /* View 3: Active Scanner Camera / Fallback */
          <>
            <div className="relative bg-black min-h-[260px] flex items-center justify-center overflow-hidden">
              <div id={scannerContainerId} className="w-full max-w-sm" />

              {/* Viewfinder scan line */}
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
                    Mata in koden manuellt nedan eller klicka på en testknapp.
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
                  className="flex-1 px-3 py-2 text-xs bg-stone-800 border border-stone-700 rounded-lg text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
                <button
                  id="manual-barcode-submit-btn"
                  type="submit"
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Sök / Skanna
                </button>
              </form>

              {/* Quick simulator buttons */}
              <div>
                <span className="text-[11px] text-stone-400 block mb-1.5 font-medium">
                  Testa streckkod (klicka för att simulera):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sampleProductsWithBarcode.map((p) => (
                    <button
                      key={p.id}
                      id={`test-scan-btn-${p.id}`}
                      type="button"
                      title="Testa befintlig vara i lagret (Firestore, inget API-anrop)"
                      onClick={() => {
                        if (p.barcode) handleBarcodeDetected(p.barcode);
                      }}
                      className="px-2 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded text-[11px] text-stone-200 transition cursor-pointer flex items-center gap-1"
                    >
                      <Barcode className="w-3 h-3 text-emerald-400" />
                      <span>{p.name.split(' ')[0]} (i lager)</span>
                    </button>
                  ))}
                  <button
                    id="test-scan-olw-btn"
                    type="button"
                    title="Testa Open Food Facts uppslag: OLW Grillchips 275g"
                    onClick={() => handleBarcodeDetected('7310532109315')}
                    className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 rounded text-[11px] text-emerald-300 transition cursor-pointer flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>OLW Chips (Open Food Facts)</span>
                  </button>
                  <button
                    id="test-scan-unknown-btn"
                    type="button"
                    title="Testa okänd streckkod som ej finns i Open Food Facts (manuell registrering)"
                    onClick={() => handleBarcodeDetected('7399999999999')}
                    className="px-2 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded text-[11px] text-stone-300 transition cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-stone-400" />
                    <span>Okänd kod (Manuell)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-stone-950 border-t border-stone-800 flex justify-end">
              <button
                id="scanner-done-btn"
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-xs font-medium rounded-lg text-stone-200 transition cursor-pointer"
              >
                Stäng
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
