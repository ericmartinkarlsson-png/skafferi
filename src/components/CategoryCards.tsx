import React from 'react';
import { CategoryId, Product } from '../types';
import { Refrigerator, Archive, Sparkles, Box, AlertTriangle, AlertCircle, ShoppingCart, ChevronRight } from 'lucide-react';
import { getDaysUntil } from '../utils/dateUtils';

interface CategoryCardsProps {
  products: Product[];
  onSelectCategory: (category: CategoryId) => void;
}

interface CategoryMeta {
  id: CategoryId;
  name: string;
  description: string;
  icon: React.ReactNode;
  bgLight: string;
  textColor: string;
  borderColor: string;
  iconBg: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'kylskåp',
    name: 'Kylskåp',
    description: 'Färskvaror, mejeri, chark och pålägg',
    icon: <Refrigerator className="w-6 h-6 text-emerald-700" />,
    bgLight: 'bg-emerald-50/70 hover:bg-emerald-50',
    textColor: 'text-emerald-900',
    borderColor: 'border-emerald-200/90 hover:border-emerald-400',
    iconBg: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: 'skafferi',
    name: 'Skafferi',
    description: 'Torrvaror, konserver, kaffe, pasta och kryddor',
    icon: <Archive className="w-6 h-6 text-amber-700" />,
    bgLight: 'bg-amber-50/70 hover:bg-amber-50',
    textColor: 'text-amber-900',
    borderColor: 'border-amber-200/90 hover:border-amber-400',
    iconBg: 'bg-amber-100 text-amber-700',
  },
  {
    id: 'förbrukning',
    name: 'Förbrukning',
    description: 'Diskmedel, toapapper, hushållsark och tändstickor',
    icon: <Sparkles className="w-6 h-6 text-sky-700" />,
    bgLight: 'bg-sky-50/70 hover:bg-sky-50',
    textColor: 'text-sky-900',
    borderColor: 'border-sky-200/90 hover:border-sky-400',
    iconBg: 'bg-sky-100 text-sky-700',
  },
  {
    id: 'övrigt',
    name: 'Övrigt',
    description: 'Ljus, medicin, första hjälpen, batterier och diverse',
    icon: <Box className="w-6 h-6 text-stone-700" />,
    bgLight: 'bg-stone-100/70 hover:bg-stone-100',
    textColor: 'text-stone-900',
    borderColor: 'border-stone-300 hover:border-stone-400',
    iconBg: 'bg-stone-200 text-stone-700',
  },
];

export const CategoryCards: React.FC<CategoryCardsProps> = ({
  products,
  onSelectCategory,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Kategorier</h2>
          <p className="text-sm text-stone-500">Välj ett utrymme för att hantera varor</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        {CATEGORIES.map((cat) => {
          const catProducts = products.filter((p) => p.category === cat.id);
          const totalUnits = catProducts.reduce((sum, p) => sum + p.quantity, 0);

          // Expired items
          const expiredCount = catProducts.filter(
            (p) => p.expirationDate && getDaysUntil(p.expirationDate) < 0
          ).length;

          // Urgent items (0 to 3 days left)
          const urgentCount = catProducts.filter((p) => {
            if (!p.expirationDate) return false;
            const days = getDaysUntil(p.expirationDate);
            return days >= 0 && days <= 3;
          }).length;

          // Low stock items (below minQuantity)
          const lowStockCount = catProducts.filter(
            (p) => p.quantity <= p.minQuantity
          ).length;

          return (
            <button
              key={cat.id}
              id={`category-btn-${cat.id}`}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`text-left p-4 sm:p-5 rounded-2xl border ${cat.borderColor} ${cat.bgLight} transition-all duration-150 shadow-xs hover:shadow-md cursor-pointer group flex flex-col justify-between relative overflow-hidden`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.iconBg} shadow-inner`}>
                    {cat.icon}
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${cat.textColor} tracking-tight group-hover:underline decoration-2 underline-offset-2`}>
                      {cat.name}
                    </h3>
                    <span className="text-xs font-semibold text-stone-600">
                      {catProducts.length} {catProducts.length === 1 ? 'artikel' : 'artiklar'} ({totalUnits} st i lager)
                    </span>
                  </div>
                </div>

                <div className="text-stone-400 group-hover:text-stone-700 transition transform group-hover:translate-x-1">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>

              <p className="text-xs text-stone-600 line-clamp-1 mb-3">
                {cat.description}
              </p>

              {/* Warning Badges on Category Card */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-200/60 text-xs">
                {expiredCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold border border-rose-200">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    {expiredCount} utgången{expiredCount > 1 ? 'a' : ''}
                  </span>
                )}

                {urgentCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-medium border border-amber-300">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    {urgentCount} går ut snart
                  </span>
                )}

                {lowStockCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-200/80 text-stone-800 font-medium border border-stone-300">
                    <ShoppingCart className="w-3 h-3 text-stone-600" />
                    {lowStockCount} lågt lager
                  </span>
                )}

                {expiredCount === 0 && urgentCount === 0 && lowStockCount === 0 && (
                  <span className="text-stone-400 text-xs py-0.5">
                    Allt i gott skick
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
