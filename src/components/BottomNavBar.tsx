import React from 'react';
import { LayoutGrid, Package, Barcode, ShoppingCart, Clock, Settings } from 'lucide-react';

interface BottomNavBarProps {
  activeTab: 'categories' | 'inventory' | 'shopping' | 'expiry' | 'settings';
  onSelectTab: (tab: 'categories' | 'inventory' | 'shopping' | 'expiry' | 'settings') => void;
  onOpenScanner: () => void;
  urgentExpiryCount: number;
  shoppingListCount: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenScanner,
  urgentExpiryCount,
  shoppingListCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-stone-900/95 backdrop-blur-md border-t border-stone-800 pb-safe">
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around">
        {/* 1. Kategorier (Front Page) */}
        <button
          id="nav-categories-btn"
          type="button"
          onClick={() => onSelectTab('categories')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-xs transition cursor-pointer ${
            activeTab === 'categories'
              ? 'text-emerald-400 font-bold'
              : 'text-stone-400 hover:text-stone-200 font-medium'
          }`}
        >
          <LayoutGrid className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Kategorier</span>
        </button>

        {/* 2. Lager (Alla artiklar) */}
        <button
          id="nav-inventory-btn"
          type="button"
          onClick={() => onSelectTab('inventory')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-xs transition cursor-pointer ${
            activeTab === 'inventory'
              ? 'text-emerald-400 font-bold'
              : 'text-stone-400 hover:text-stone-200 font-medium'
          }`}
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Lager</span>
        </button>

        {/* 3. Skanna (Prominent center button) */}
        <button
          id="nav-scan-btn"
          type="button"
          onClick={onOpenScanner}
          className="flex flex-col items-center -mt-4 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-600 group-hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-950/60 border-2 border-stone-900 transition transform group-active:scale-95">
            <Barcode className="w-6 h-6" />
          </div>
          <span className="text-[10px] text-emerald-400 font-bold mt-0.5">Skanna</span>
        </button>

        {/* 4. Inköpslista */}
        <button
          id="nav-shopping-btn"
          type="button"
          onClick={() => onSelectTab('shopping')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-xs transition relative cursor-pointer ${
            activeTab === 'shopping'
              ? 'text-emerald-400 font-bold'
              : 'text-stone-400 hover:text-stone-200 font-medium'
          }`}
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5 mb-0.5" />
            {shoppingListCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 bg-emerald-500 text-stone-950 rounded-full text-[9px] font-extrabold flex items-center justify-center">
                {shoppingListCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Inköp</span>
        </button>

        {/* 5. Varningar (Utgångsdatum) */}
        <button
          id="nav-expiry-btn"
          type="button"
          onClick={() => onSelectTab('expiry')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-xs transition relative cursor-pointer ${
            activeTab === 'expiry'
              ? 'text-emerald-400 font-bold'
              : 'text-stone-400 hover:text-stone-200 font-medium'
          }`}
        >
          <div className="relative">
            <Clock className="w-5 h-5 mb-0.5" />
            {urgentExpiryCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-extrabold flex items-center justify-center animate-pulse">
                {urgentExpiryCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Varningar</span>
        </button>
      </div>
    </nav>
  );
};
