import React, { useState } from 'react';
import { Product, ShoppingItem, CategoryId } from '../types';
import { 
  ShoppingCart, 
  Check, 
  Plus, 
  Trash2, 
  Share2, 
  CheckCircle2, 
  PackagePlus, 
  ArrowRight,
  Sparkles,
  ClipboardCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ShoppingListViewProps {
  products: Product[];
  manualItems: ShoppingItem[];
  onAddManualItem: (item: Omit<ShoppingItem, 'id' | 'isChecked'>) => void;
  onRemoveManualItem: (id: string) => void;
  onRestockFromShoppingList: (restockedItems: { productId: string; addQty: number }[]) => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  products,
  manualItems,
  onAddManualItem,
  onRemoveManualItem,
  onRestockFromShoppingList,
}) => {
  // Local state to keep track of checked items in current shopping session
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [newManualName, setNewManualName] = useState('');
  const [newManualCategory, setNewManualCategory] = useState<CategoryId>('skafferi');
  const [newManualQty, setNewManualQty] = useState(1);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Compute automatic shopping items from products where quantity <= minQuantity
  const autoItems: ShoppingItem[] = products
    .filter((p) => p.quantity <= p.minQuantity)
    .map((p) => {
      // Need enough to reach at least minQuantity + 1 or 2
      const targetQty = Math.max(p.minQuantity * 2, p.minQuantity + 1);
      const needed = Math.max(1, targetQty - p.quantity);

      return {
        id: `auto-${p.id}`,
        productId: p.id,
        name: p.name,
        category: p.category,
        currentQuantity: p.quantity,
        minQuantity: p.minQuantity,
        neededQuantity: needed,
        unit: p.unit,
        isChecked: checkedIds.has(`auto-${p.id}`),
        isManual: false,
      };
    });

  const allItems = [...autoItems, ...manualItems.map(m => ({ ...m, isChecked: checkedIds.has(m.id) }))];

  const toggleCheck = (id: string) => {
    const next = new Set(checkedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setCheckedIds(next);
  };

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newManualName.trim()) return;

    onAddManualItem({
      name: newManualName.trim(),
      category: newManualCategory,
      currentQuantity: 0,
      minQuantity: 1,
      neededQuantity: Math.max(1, newManualQty),
      unit: 'st',
    });

    setNewManualName('');
    setNewManualQty(1);
  };

  // Perform 1-click Restock into inventory for all checked items
  const handleRestockPurchased = () => {
    const toRestock: { productId: string; addQty: number }[] = [];
    const manualToRemove: string[] = [];

    allItems.forEach((item) => {
      if (checkedIds.has(item.id)) {
        if (item.productId) {
          toRestock.push({
            productId: item.productId,
            addQty: item.neededQuantity,
          });
        } else {
          manualToRemove.push(item.id);
        }
      }
    });

    if (toRestock.length > 0 || manualToRemove.length > 0) {
      onRestockFromShoppingList(toRestock);
      manualToRemove.forEach((id) => onRemoveManualItem(id));
      setCheckedIds(new Set());

      // Celebration effect
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch {
        // Safe fallback
      }
    }
  };

  // Copy clean text list for SMS / Messaging
  const handleShareList = () => {
    const lines = [
      '🛒 Inköpslista - Björnstugan',
      `Datum: ${new Date().toLocaleDateString('sv-SE')}`,
      '--------------------------------',
    ];

    const categories: CategoryId[] = ['kylskåp', 'skafferi', 'förbrukning', 'övrigt'];
    categories.forEach((cat) => {
      const itemsInCat = allItems.filter((item) => item.category === cat);
      if (itemsInCat.length > 0) {
        lines.push(`\n[${cat.toUpperCase()}]`);
        itemsInCat.forEach((item) => {
          const checkedMark = checkedIds.has(item.id) ? '✓ ' : '• ';
          lines.push(`${checkedMark}${item.name}: ${item.neededQuantity} ${item.unit}`);
        });
      }
    });

    lines.push('\nGenererad automatiskt av Björnstugan Lager.');

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    });
  };

  const checkedCount = allItems.filter((i) => checkedIds.has(i.id)).length;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
              Automatisk Inköpslista
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Baserad på definierade miniminivåer i lager. {allItems.length} artiklar att handla.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="share-shopping-list-btn"
            type="button"
            onClick={handleShareList}
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Kopiera lista för SMS eller meddelanden"
          >
            {copiedNotification ? (
              <>
                <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Kopierad!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-stone-600" />
                <span>Kopiera lista</span>
              </>
            )}
          </button>

          {checkedCount > 0 && (
            <button
              id="restock-purchased-btn"
              type="button"
              onClick={handleRestockPurchased}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Fyll på ({checkedCount} köpta)</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Add Extra Item Form */}
      <form onSubmit={handleAddManual} className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 flex flex-wrap sm:flex-nowrap gap-2 items-center text-xs">
        <input
          id="add-manual-item-input"
          type="text"
          value={newManualName}
          onChange={(e) => setNewManualName(e.target.value)}
          placeholder="Lägg till extra vara på inköpslistan..."
          className="flex-1 min-w-[180px] px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
        <select
          id="add-manual-item-category"
          value={newManualCategory}
          onChange={(e) => setNewManualCategory(e.target.value as CategoryId)}
          className="px-2.5 py-2 bg-white border border-stone-300 rounded-xl text-stone-700 capitalize focus:outline-none"
        >
          <option value="kylskåp">Kylskåp</option>
          <option value="skafferi">Skafferi</option>
          <option value="förbrukning">Förbrukning</option>
          <option value="övrigt">Övrigt</option>
        </select>
        <div className="flex items-center gap-1">
          <input
            id="add-manual-item-qty"
            type="number"
            min="1"
            value={newManualQty}
            onChange={(e) => setNewManualQty(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16 px-2 py-2 text-center bg-white border border-stone-300 rounded-xl text-stone-900 font-bold focus:outline-none"
          />
          <span className="text-stone-500 font-medium">st</span>
        </div>
        <button
          id="add-manual-item-btn"
          type="submit"
          className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Lägg till</span>
        </button>
      </form>

      {/* Shopping List Items grouped by category */}
      {allItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
          <h3 className="text-base font-bold text-stone-800">Lagret är fullt!</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Alla artiklar i Björnstugan ligger över sina definierade miniminivåer. Inget behöver köpas in just nu.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {(['kylskåp', 'skafferi', 'förbrukning', 'övrigt'] as CategoryId[]).map((cat) => {
            const catItems = allItems.filter((item) => item.category === cat);
            if (catItems.length === 0) return null;

            return (
              <div key={cat} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                <div className="px-4 py-2.5 bg-stone-100/70 border-b border-stone-200/80 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    {cat} ({catItems.length})
                  </h4>
                  <span className="text-[11px] text-stone-500">
                    Bocka av när du plockat varan
                  </span>
                </div>

                <div className="divide-y divide-stone-100">
                  {catItems.map((item) => {
                    const isChecked = checkedIds.has(item.id);

                    return (
                      <div
                        key={item.id}
                        id={`shopping-item-${item.id}`}
                        onClick={() => toggleCheck(item.id)}
                        className={`px-4 py-3 flex items-center justify-between gap-3 transition-colors cursor-pointer select-none ${
                          isChecked ? 'bg-stone-50/80 text-stone-400' : 'hover:bg-stone-50 text-stone-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Checkbox button */}
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                              isChecked
                                ? 'bg-emerald-600 border-emerald-700 text-white'
                                : 'border-stone-300 bg-white hover:border-stone-400'
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-3" />}
                          </div>

                          <div className="min-w-0">
                            <span
                              className={`text-sm font-semibold block truncate ${
                                isChecked ? 'line-through text-stone-400' : 'text-stone-900'
                              }`}
                            >
                              {item.name}
                            </span>
                            <div className="text-[11px] text-stone-500 flex items-center gap-2">
                              {item.isManual ? (
                                <span className="text-stone-400">Manuellt tillagd</span>
                              ) : (
                                <span>
                                  I lager: <strong className={item.currentQuantity === 0 ? 'text-rose-600' : 'text-stone-700'}>{item.currentQuantity}</strong> / min: {item.minQuantity}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Needed quantity pill */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              isChecked
                                ? 'bg-stone-200 text-stone-500'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}
                          >
                            Köp: {item.neededQuantity} {item.unit}
                          </span>

                          {item.isManual && (
                            <button
                              id={`remove-manual-item-${item.id}`}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveManualItem(item.id);
                              }}
                              className="p-1 text-stone-400 hover:text-rose-600 transition"
                              title="Ta bort från listan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
