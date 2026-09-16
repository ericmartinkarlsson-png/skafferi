import React from 'react';
import { AppMode, CategoryId } from '../types';
import { 
  Barcode, 
  Plus, 
  Minus, 
  RotateCcw, 
  LogOut, 
  Layers, 
  Home, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface TopBarProps {
  currentCategory: CategoryId | 'all' | null;
  activeTab: 'categories' | 'inventory' | 'shopping' | 'expiry' | 'settings';
  onNavigateHome: () => void;
  onNavigateTab: (tab: 'categories' | 'inventory' | 'shopping' | 'expiry' | 'settings') => void;
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onOpenScanner: () => void;
  onLogout: () => void;
  urgentExpiryCount: number;
  shoppingListCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentCategory,
  activeTab,
  onNavigateHome,
  onNavigateTab,
  currentMode,
  onModeChange,
  onOpenScanner,
  onLogout,
  urgentExpiryCount,
  shoppingListCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-md">
      {/* Top Header Row */}
      <div className="max-w-4xl mx-auto px-3.5 sm:px-4 py-2.5 flex items-center justify-between gap-2">
        {/* Brand & Breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            id="brand-home-btn"
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-2 hover:opacity-85 transition cursor-pointer shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-base shadow-xs">
              🐻
            </div>
            <div className="text-left hidden xs:block">
              <span className="font-bold text-sm sm:text-base tracking-tight text-white block leading-tight">
                Björnstugan
              </span>
              <span className="text-[10px] text-emerald-400 font-medium tracking-wide">
                Lager & Skafferi
              </span>
            </div>
          </button>

          {currentCategory && currentCategory !== 'all' && activeTab === 'inventory' && (
            <div className="flex items-center gap-1.5 text-xs text-stone-400 ml-1">
              <ChevronRight className="w-3.5 h-3.5 text-stone-600 shrink-0" />
              <span className="capitalize font-bold text-emerald-400 truncate">
                {currentCategory}
              </span>
            </div>
          )}
        </div>

        {/* Action Controls: Mode Switcher & Scanner & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mode Switcher Pills */}
          <div className="bg-stone-800/90 p-1 rounded-xl border border-stone-700 flex items-center gap-0.5">
            <button
              id="mode-normal-btn"
              type="button"
              onClick={() => onModeChange('normal')}
              className={`px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentMode === 'normal'
                  ? 'bg-stone-700 text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Normal vy"
            >
              Normal
            </button>

            <button
              id="mode-restock-btn"
              type="button"
              onClick={() => onModeChange(currentMode === 'påfyllnad' ? 'normal' : 'påfyllnad')}
              className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                currentMode === 'påfyllnad'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-emerald-400'
              }`}
              title="Påfyllnadsläge (öka saldo snabbt)"
            >
              <Plus className="w-3 h-3 stroke-3" />
              <span className="hidden sm:inline">Påfyllnad</span>
            </button>

            <button
              id="mode-consume-btn"
              type="button"
              onClick={() => onModeChange(currentMode === 'uttag' ? 'normal' : 'uttag')}
              className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                currentMode === 'uttag'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-amber-400'
              }`}
              title="Uttagsläge (minska saldo snabbt)"
            >
              <Minus className="w-3 h-3 stroke-3" />
              <span className="hidden sm:inline">Uttag</span>
            </button>
          </div>

          {/* Barcode scanner launcher */}
          <button
            id="top-scanner-btn"
            type="button"
            onClick={onOpenScanner}
            className="p-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100 border border-emerald-500/40 transition cursor-pointer flex items-center gap-1.5"
            title="Öppna streckkodsläsare"
          >
            <Barcode className="w-4 h-4" />
            <span className="text-xs font-semibold hidden md:inline">Skanna</span>
          </button>

          {/* Logout button */}
          <button
            id="logout-btn"
            type="button"
            onClick={onLogout}
            className="p-2 text-stone-400 hover:text-rose-400 hover:bg-stone-800/80 rounded-xl transition cursor-pointer"
            title="Lås / Logga ut"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
