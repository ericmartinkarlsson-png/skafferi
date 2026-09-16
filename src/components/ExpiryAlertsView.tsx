import React from 'react';
import { Product } from '../types';
import { getDaysUntil, getExpiryStatus } from '../utils/dateUtils';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, Trash2, Minus, Edit3, ArrowRight } from 'lucide-react';

interface ExpiryAlertsViewProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
  onConsumeProduct: (productId: string) => void;
  onDeleteProduct: (productId: string) => void;
  onNavigateToCategory: (category: string) => void;
}

export const ExpiryAlertsView: React.FC<ExpiryAlertsViewProps> = ({
  products,
  onEditProduct,
  onConsumeProduct,
  onDeleteProduct,
  onNavigateToCategory,
}) => {
  const [confirmDiscardId, setConfirmDiscardId] = React.useState<string | null>(null);

  // Filter products with expiration dates
  const datedProducts = products.filter((p) => p.expirationDate && p.quantity > 0);

  // Group into expired (< 0), critical (0 to 3 days), warning (4 to 7 days)
  const expiredItems = datedProducts.filter((p) => getDaysUntil(p.expirationDate) < 0);
  const criticalItems = datedProducts.filter((p) => {
    const d = getDaysUntil(p.expirationDate);
    return d >= 0 && d <= 3;
  });
  const upcomingItems = datedProducts.filter((p) => {
    const d = getDaysUntil(p.expirationDate);
    return d > 3 && d <= 7;
  });

  const totalAlerts = expiredItems.length + criticalItems.length;

  return (
    <div className="space-y-4">
      {/* Header banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-700" />
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
              Datumkontroll & Varningar
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Översikt över artiklar som håller på att gå ut eller har passerat bäst-före datum.
          </p>
        </div>

        {totalAlerts > 0 ? (
          <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            {totalAlerts} kräver åtgärd
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Allt grönt
          </span>
        )}
      </div>

      {expiredItems.length === 0 && criticalItems.length === 0 && upcomingItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
          <h3 className="text-base font-bold text-stone-800">Inga varningar!</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Alla artiklar i kylskåpet och skafferiet har god hållbarhet framöver.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 1. Expired Items (Utgångna varor) */}
          {expiredItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-rose-300 overflow-hidden shadow-xs">
              <div className="px-4 py-2.5 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                    Utgångna varor ({expiredItems.length})
                  </h3>
                </div>
                <span className="text-[11px] text-rose-700 font-medium">
                  Kontrollera eller kassera
                </span>
              </div>

              <div className="divide-y divide-rose-100">
                {expiredItems.map((item) => {
                  const expiry = getExpiryStatus(item.expirationDate);
                  return (
                    <div
                      key={item.id}
                      id={`expired-item-${item.id}`}
                      className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-rose-50/20"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 text-sm sm:text-base">
                            {item.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] bg-rose-100 text-rose-800 font-semibold border border-rose-300">
                            {expiry.label}
                          </span>
                        </div>
                        <div className="text-xs text-stone-500 mt-0.5">
                          Kategori: <strong className="capitalize text-stone-700">{item.category}</strong> • Saldo: {item.quantity} {item.unit}
                          {item.locationDetails ? ` • Plats: ${item.locationDetails}` : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => onConsumeProduct(item.id)}
                          className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="Minska antal med 1"
                        >
                          <Minus className="w-3.5 h-3.5" />
                          <span>Använd (-1)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditProduct(item)}
                          className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Nytt datum</span>
                        </button>
                        {confirmDiscardId === item.id ? (
                          <div className="flex items-center gap-1 bg-rose-50 border border-rose-300 rounded-lg p-1 animate-fade-in">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteProduct(item.id);
                                setConfirmDiscardId(null);
                              }}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Bekräfta kassera</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDiscardId(null)}
                              className="px-2 py-1 text-stone-600 hover:text-stone-900 text-xs font-semibold cursor-pointer"
                            >
                              Avbryt
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDiscardId(item.id)}
                            className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            title="Kassera och ta bort ur lagret"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Kassera</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Critical Items (Går ut inom 3 dagar) */}
          {criticalItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-300 overflow-hidden shadow-xs">
              <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Går ut inom 3 dagar ({criticalItems.length})
                  </h3>
                </div>
                <span className="text-[11px] text-amber-800 font-medium">
                  Prioritera för användning
                </span>
              </div>

              <div className="divide-y divide-amber-100">
                {criticalItems.map((item) => {
                  const expiry = getExpiryStatus(item.expirationDate);
                  return (
                    <div
                      key={item.id}
                      id={`critical-item-${item.id}`}
                      className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/15"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 text-sm sm:text-base">
                            {item.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] bg-amber-100 text-amber-900 font-semibold border border-amber-300">
                            {expiry.label}
                          </span>
                        </div>
                        <div className="text-xs text-stone-500 mt-0.5">
                          Kategori: <strong className="capitalize text-stone-700">{item.category}</strong> • Saldo: {item.quantity} {item.unit}
                          {item.locationDetails ? ` • Plats: ${item.locationDetails}` : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => onConsumeProduct(item.id)}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                          <span>Använd i matlagning (-1)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditProduct(item)}
                          className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
                          title="Redigera"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Upcoming Items (4 to 7 days) */}
          {upcomingItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
              <div className="px-4 py-2.5 bg-stone-100/70 border-b border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-stone-500" />
                  <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Går ut inom en vecka ({upcomingItems.length})
                  </h3>
                </div>
                <span className="text-[11px] text-stone-500">Planera i veckan</span>
              </div>

              <div className="divide-y divide-stone-100">
                {upcomingItems.map((item) => {
                  const expiry = getExpiryStatus(item.expirationDate);
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-stone-50 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-stone-900 text-sm">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-stone-500">
                            ({item.quantity} {item.unit})
                          </span>
                        </div>
                        <div className="text-xs text-stone-400">
                          {item.category} • Utgår: {item.expirationDate}
                        </div>
                      </div>

                      <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {expiry.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
