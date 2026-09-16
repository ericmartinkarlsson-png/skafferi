import React, { useState, useMemo } from 'react';
import { 
  Product, 
  CategoryId, 
  AppMode, 
  SortField 
} from '../types';
import { 
  Plus, 
  Minus, 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Calendar, 
  AlertCircle, 
  AlertTriangle, 
  Package, 
  Edit3, 
  Barcode, 
  MapPin, 
  ShoppingBag,
  Check,
  Trash2
} from 'lucide-react';
import { getDaysUntil, getExpiryStatus, formatSwedishDate } from '../utils/dateUtils';

interface ProductListProps {
  products: Product[];
  currentCategory?: CategoryId | 'all';
  currentMode: AppMode;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onQuickQuantityChange: (productId: string, delta: number) => void;
  onAddNewProduct: () => void;
  onOpenScanner: () => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  currentCategory = 'all',
  currentMode,
  searchQuery,
  onSearchChange,
  onEditProduct,
  onDeleteProduct,
  onQuickQuantityChange,
  onAddNewProduct,
  onOpenScanner,
}) => {
  const [sortField, setSortField] = useState<SortField>('expiry-asc');
  const [filterType, setFilterType] = useState<'all' | 'expiring' | 'lowstock'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category filter
      if (currentCategory !== 'all' && product.category !== currentCategory) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesBarcode = product.barcode?.toLowerCase().includes(q);
        const matchesLocation = product.locationDetails?.toLowerCase().includes(q);
        const matchesNotes = product.notes?.toLowerCase().includes(q);
        if (!matchesName && !matchesBarcode && !matchesLocation && !matchesNotes) {
          return false;
        }
      }

      // Quick tab filter
      if (filterType === 'expiring') {
        if (!product.expirationDate) return false;
        const days = getDaysUntil(product.expirationDate);
        return days <= 7; // Expired or within 7 days
      }

      if (filterType === 'lowstock') {
        return product.quantity <= product.minQuantity;
      }

      return true;
    });
  }, [products, currentCategory, searchQuery, filterType]);

  // Sort
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (sortField === 'expiry-asc') {
        const daysA = a.expirationDate ? getDaysUntil(a.expirationDate) : 9999;
        const daysB = b.expirationDate ? getDaysUntil(b.expirationDate) : 9999;
        return daysA - daysB;
      }
      if (sortField === 'expiry-desc') {
        const daysA = a.expirationDate ? getDaysUntil(a.expirationDate) : -9999;
        const daysB = b.expirationDate ? getDaysUntil(b.expirationDate) : -9999;
        return daysB - daysA;
      }
      if (sortField === 'name-asc') {
        return a.name.localeCompare(b.name, 'sv');
      }
      if (sortField === 'quantity-asc') {
        return a.quantity - b.quantity;
      }
      if (sortField === 'quantity-desc') {
        return b.quantity - a.quantity;
      }
      return 0;
    });
  }, [filteredProducts, sortField]);

  return (
    <div className="space-y-4">
      {/* Search & Sort Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/90 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="search-products-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Sök artikel, streckkod eller plats..."
              className="w-full pl-9 pr-8 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            id="open-scanner-from-list-btn"
            type="button"
            onClick={onOpenScanner}
            className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl border border-stone-200 transition cursor-pointer shrink-0 flex items-center gap-1.5"
            title="Öppna streckkodsläsare"
          >
            <Barcode className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-semibold hidden sm:inline">Skanna</span>
          </button>
        </div>

        {/* Sort & Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs">
          {/* Quick filter tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            <button
              id="filter-all-btn"
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-stone-800 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Alla ({products.filter((p) => currentCategory === 'all' || p.category === currentCategory).length})
            </button>
            <button
              id="filter-expiring-btn"
              type="button"
              onClick={() => setFilterType('expiring')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1 ${
                filterType === 'expiring'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Går ut snart</span>
            </button>
            <button
              id="filter-lowstock-btn"
              type="button"
              onClick={() => setFilterType('lowstock')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1 ${
                filterType === 'lowstock'
                  ? 'bg-stone-800 text-white font-semibold'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Package className="w-3 h-3" />
              <span>Lågt lager</span>
            </button>
          </div>

          {/* Sortering dropdown */}
          <div className="flex items-center gap-1.5 ml-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
            <select
              id="sort-products-select"
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="py-1 px-2 bg-stone-100 border border-stone-200 rounded-lg text-stone-700 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
            >
              <option value="expiry-asc">Utgångsdatum: Kortast först</option>
              <option value="expiry-desc">Utgångsdatum: Längst hållbarhet</option>
              <option value="name-asc">Namn: A till Ö</option>
              <option value="quantity-asc">Lagersaldo: Lägst först</option>
              <option value="quantity-desc">Lagersaldo: Högst först</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Prompt when in Restock / Consume mode */}
      {currentMode !== 'normal' && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            currentMode === 'påfyllnad'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full animate-ping ${
                currentMode === 'påfyllnad' ? 'bg-emerald-600' : 'bg-amber-600'
              }`}
            />
            <span className="font-semibold">
              {currentMode === 'påfyllnad'
                ? 'Läge Påfyllnad aktivt: Klicka "+" på en artikel för att öka lagret'
                : 'Läge Uttag aktivt: Klicka "-" på en artikel för att registrera uttag'}
            </span>
          </div>
        </div>
      )}

      {/* Product Cards List */}
      {sortedProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
          <Package className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-stone-800">Inga artiklar hittades</h4>
          <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
            {searchQuery
              ? `Inga resultat matchade sökningen "${searchQuery}".`
              : 'Det finns inga artiklar här ännu.'}
          </p>
          <button
            id="empty-add-product-btn"
            type="button"
            onClick={onAddNewProduct}
            className="mt-4 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Lägg till artikel</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {sortedProducts.map((product) => {
            const expiry = getExpiryStatus(product.expirationDate);
            const isLowStock = product.quantity <= product.minQuantity;

            return (
              <div
                key={product.id}
                id={`product-card-${product.id}`}
                className={`bg-white rounded-2xl border p-3.5 sm:p-4 shadow-xs transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  expiry.status === 'expired'
                    ? 'border-rose-300 bg-rose-50/30'
                    : expiry.status === 'urgent'
                    ? 'border-amber-300/80 bg-amber-50/20'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                {/* Left side: Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between sm:justify-start gap-2 mb-1">
                    <h4 
                      onClick={() => onEditProduct(product)}
                      className="font-bold text-stone-900 text-sm sm:text-base tracking-tight hover:text-emerald-700 transition cursor-pointer truncate"
                      title={product.name}
                    >
                      {product.name}
                    </h4>

                    {/* Expiry Badge */}
                    {product.expirationDate && (
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 flex items-center gap-1 ${expiry.badgeClass}`}
                      >
                        {expiry.status === 'expired' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                        {expiry.status === 'urgent' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                        <span>{expiry.label}</span>
                      </span>
                    )}
                  </div>

                  {/* Metadata Row (Location, barcode, min level) */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                    <span className="capitalize font-medium text-stone-600">
                      {product.category}
                    </span>

                    {product.locationDetails && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        <span>{product.locationDetails}</span>
                      </span>
                    )}

                    {product.barcode && (
                      <span className="flex items-center gap-0.5 font-mono text-[11px] text-stone-400">
                        <Barcode className="w-3 h-3" />
                        <span>{product.barcode.slice(-5)}</span>
                      </span>
                    )}

                    {isLowStock && (
                      <span className="text-amber-700 font-medium bg-amber-100/70 px-1.5 py-0.2 rounded text-[11px]">
                        Miniminivå: {product.minQuantity} {product.unit}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side: Stock Quantity & Mode Controls */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                  {/* Current Quantity display */}
                  <div className="text-left sm:text-right">
                    <div className="text-base sm:text-lg font-bold text-stone-900 tracking-tight flex items-baseline gap-1">
                      <span className={product.quantity === 0 ? 'text-rose-600' : 'text-stone-900'}>
                        {product.quantity}
                      </span>
                      <span className="text-xs font-normal text-stone-500">{product.unit}</span>
                    </div>
                    <span className="text-[11px] text-stone-400 block -mt-1">
                      {product.quantity === 0 ? 'Slut i lager' : 'i lager'}
                    </span>
                  </div>

                  {/* Quantity Stepper buttons */}
                  <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
                    <button
                      id={`qty-decrement-${product.id}`}
                      type="button"
                      disabled={product.quantity <= 0}
                      onClick={() => onQuickQuantityChange(product.id, -1)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition cursor-pointer ${
                        currentMode === 'uttag'
                          ? 'bg-amber-500 text-white shadow-xs hover:bg-amber-600'
                          : 'hover:bg-white text-stone-700 disabled:opacity-30 disabled:hover:bg-transparent'
                      }`}
                      title="Ta ur lagret (-1)"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <button
                      id={`qty-increment-${product.id}`}
                      type="button"
                      onClick={() => onQuickQuantityChange(product.id, 1)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition cursor-pointer ${
                        currentMode === 'påfyllnad'
                          ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                          : 'hover:bg-white text-stone-700'
                      }`}
                      title="Fyll på lagret (+1)"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Edit and Delete product buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      id={`edit-product-btn-${product.id}`}
                      type="button"
                      onClick={() => onEditProduct(product)}
                      className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                      title="Redigera detaljer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {onDeleteProduct && (
                      confirmDeleteId === product.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg p-1 animate-fade-in">
                          <button
                            id={`confirm-delete-row-btn-${product.id}`}
                            type="button"
                            onClick={() => {
                              onDeleteProduct(product.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold shadow-xs cursor-pointer flex items-center gap-1"
                            title="Bekräfta borttagning"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Ta bort</span>
                          </button>
                          <button
                            id={`cancel-delete-row-btn-${product.id}`}
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-1.5 py-1 text-stone-500 hover:text-stone-800 text-[11px] font-medium cursor-pointer"
                            title="Avbryt"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          id={`delete-product-icon-${product.id}`}
                          type="button"
                          onClick={() => setConfirmDeleteId(product.id)}
                          className="p-2 text-stone-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Ta bort artikel ur lagret"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
