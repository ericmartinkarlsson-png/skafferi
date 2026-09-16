import React, { useState } from 'react';
import { Database, Download, Upload, RotateCcw, ShieldAlert, Check, X, FileText } from 'lucide-react';
import { Product } from '../types';
import { exportInventoryData, resetInventoryToDefaults } from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onResetData: () => void;
  onImportData: (importedProducts: Product[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  products,
  onResetData,
  onImportData,
}) => {
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    const json = exportInventoryData(products);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bjornstugan-lager-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed && Array.isArray(parsed.products)) {
          onImportData(parsed.products);
          setImportSuccess(true);
          setImportError(null);
          setTimeout(() => {
            setImportSuccess(false);
            onClose();
          }, 1500);
        } else {
          setImportError('Ogiltig filstruktur. Förväntade en lista med produkter.');
        }
      } catch (err) {
        setImportError('Kunde inte läsa JSON-filen.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="settings-modal"
        className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden text-stone-800"
      >
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-stone-900">Lokal Databas & Säkerhetskopia</h3>
          </div>
          <button
            id="close-settings-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <p className="text-stone-600 leading-relaxed">
            All data sparas lokalt i enhetens webbläsardatabas (localStorage). Du kan exportera en säkerhetskopia eller återställa standarddata för Björnstugan.
          </p>

          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex justify-between items-center">
            <div>
              <span className="font-bold text-stone-800 block text-sm">Totalt i inventariet</span>
              <span className="text-stone-500">{products.length} artiklar sparade</span>
            </div>
            <button
              id="export-data-btn"
              type="button"
              onClick={handleExport}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-white font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportera</span>
            </button>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3">
            <span className="font-bold text-stone-800 block mb-1">Importera säkerhetskopia</span>
            <input
              id="import-file-input"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-xs text-stone-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-stone-200 file:text-stone-700 hover:file:bg-stone-300 cursor-pointer"
            />
            {importSuccess && (
              <p className="text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Databas importerad!
              </p>
            )}
            {importError && (
              <p className="text-rose-600 font-semibold mt-1.5">
                {importError}
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-stone-100 flex justify-between items-center">
            {confirmReset ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-700 font-semibold">Återställ allt?</span>
                <button
                  id="confirm-reset-db-btn"
                  type="button"
                  onClick={() => {
                    onResetData();
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  Ja, återställ
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-2 py-1 text-stone-500 hover:text-stone-700 text-xs font-medium cursor-pointer"
                >
                  Avbryt
                </button>
              </div>
            ) : (
              <button
                id="reset-db-btn"
                type="button"
                onClick={() => setConfirmReset(true)}
                className="text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 transition cursor-pointer text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Återställ standardartiklar</span>
              </button>
            )}

            <button
              id="close-settings-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold cursor-pointer text-xs"
            >
              Stäng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
