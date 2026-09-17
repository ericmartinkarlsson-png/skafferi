import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, Hash, Barcode, MapPin, Tag, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Product, CategoryId, ProductUnit } from '../types';
import { getDateWithOffset } from '../utils/dateUtils';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'updatedAt'>, existingId?: string) => void;
  onDelete?: (id: string) => void;
  initialCategory: CategoryId;
  productToEdit?: Product | null;
  prefilledBarcode?: string;
  prefilledProduct?: Partial<Product> | null;
}

const UNITS: { value: ProductUnit; label: string }[] = [
  { value: 'st', label: 'st (styck)' },
  { value: 'pkt', label: 'pkt (paket)' },
  { value: 'l', label: 'l (liter)' },
  { value: 'dl', label: 'dl (deciliter)' },
  { value: 'kg', label: 'kg (kilo)' },
  { value: 'g', label: 'g (gram)' },
  { value: 'burk', label: 'burk' },
  { value: 'flaska', label: 'flaska' },
  { value: 'rullar', label: 'rullar' },
  { value: 'påse', label: 'påse' },
];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialCategory,
  productToEdit,
  prefilledBarcode,
  prefilledProduct,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryId>(initialCategory);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<ProductUnit>('st');
  const [expirationDate, setExpirationDate] = useState('');
  const [minQuantity, setMinQuantity] = useState(1);
  const [barcode, setBarcode] = useState('');
  const [brand, setBrand] = useState('');
  const [packageSize, setPackageSize] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    setIsConfirmingDelete(false);
    if (productToEdit) {
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setQuantity(productToEdit.quantity);
      setUnit(productToEdit.unit);
      setExpirationDate(productToEdit.expirationDate || '');
      setMinQuantity(productToEdit.minQuantity ?? 1);
      setBarcode(productToEdit.barcode || '');
      setBrand(productToEdit.brand || '');
      setPackageSize(productToEdit.packageSize || '');
      setImageUrl(productToEdit.imageUrl || '');
      setLocationDetails(productToEdit.locationDetails || '');
      setNotes(productToEdit.notes || '');
    } else if (prefilledProduct) {
      setName(prefilledProduct.name || '');
      setCategory(prefilledProduct.category || initialCategory);
      setQuantity(prefilledProduct.quantity ?? 1);
      setUnit(prefilledProduct.unit || 'st');
      setExpirationDate(prefilledProduct.expirationDate || '');
      setMinQuantity(prefilledProduct.minQuantity ?? 1);
      setBarcode(prefilledProduct.barcode || prefilledBarcode || '');
      setBrand(prefilledProduct.brand || '');
      setPackageSize(prefilledProduct.packageSize || '');
      setImageUrl(prefilledProduct.imageUrl || '');
      setLocationDetails(prefilledProduct.locationDetails || '');
      setNotes(prefilledProduct.notes || '');
    } else {
      setName('');
      setCategory(initialCategory);
      setQuantity(1);
      setUnit('st');
      setExpirationDate('');
      setMinQuantity(1);
      setBarcode(prefilledBarcode || '');
      setBrand('');
      setPackageSize('');
      setImageUrl('');
      setLocationDetails('');
      setNotes('');
    }
    setErrors({});
  }, [productToEdit, initialCategory, prefilledBarcode, prefilledProduct, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Vänligen ange produktnamn';
    }

    if (quantity < 0) {
      newErrors.quantity = 'Antal kan inte vara negativt';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(
      {
        name: name.trim(),
        category,
        quantity: Number(quantity),
        unit,
        expirationDate: expirationDate.trim(),
        minQuantity: Number(minQuantity),
        barcode: barcode.trim() || undefined,
        brand: brand.trim() || undefined,
        packageSize: packageSize.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        locationDetails: locationDetails.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      productToEdit?.id
    );

    onClose();
  };

  const setPresetDate = (days: number | null) => {
    if (days === null) {
      setExpirationDate('');
    } else {
      setExpirationDate(getDateWithOffset(days));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        id="product-modal-dialog"
        className="w-full max-w-lg bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-stone-50">
          <div>
            <h2 className="text-lg font-bold text-stone-900 tracking-tight">
              {productToEdit ? 'Redigera artikel' : 'Lägg till artikel'}
            </h2>
            <p className="text-xs text-stone-500">
              {productToEdit ? 'Uppdatera saldo och datum' : 'Registrera ny vara i inventariet'}
            </p>
          </div>
          <button
            id="close-product-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-stone-800 text-sm">
          {/* Image & Auto-fill Info Preview if available */}
          {imageUrl && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center gap-3">
              <img
                src={imageUrl}
                alt={name || 'Produktbild'}
                referrerPolicy="no-referrer"
                className="w-14 h-14 object-contain rounded-lg bg-white border border-stone-200 shrink-0"
                onError={(e) => {
                  // If image fails to load, gracefully hide without breaking
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="flex-1 min-w-0 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Information hämtad automatiskt</span>
                </div>
                <p className="text-stone-600 truncate">
                  {brand ? `${brand} • ` : ''}{packageSize || 'Produktbild från Open Food Facts'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="text-[11px] text-stone-400 hover:text-stone-600 p-1 rounded hover:bg-stone-100 transition"
                title="Ta bort bild"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="product-name-input">
              Artikelnamn <span className="text-rose-500">*</span>
            </label>
            <input
              id="product-name-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              placeholder="T.ex. Arla Mellanmjölk, Havregryn, Diskmedel..."
              className={`w-full px-3.5 py-2.5 bg-stone-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition text-stone-900 ${
                errors.name ? 'border-rose-400 focus:ring-rose-400' : 'border-stone-300 focus:ring-emerald-500'
              }`}
              autoFocus
            />
            {errors.name && <p className="text-rose-600 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Brand & Package Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="product-brand-input">
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-stone-500" />
                  Varumärke
                </span>
              </label>
              <input
                id="product-brand-input"
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="T.ex. OLW, Arla, Findus..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-900 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="product-package-size-input">
                <span className="flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-stone-500" />
                  Mängd / Storlek
                </span>
              </label>
              <input
                id="product-package-size-input"
                type="text"
                value={packageSize}
                onChange={(e) => setPackageSize(e.target.value)}
                placeholder="T.ex. 275 g, 1.5 l, 6-pack..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-900 text-xs"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="product-category-select">
              Kategori
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['kylskåp', 'skafferi', 'förbrukning', 'övrigt'] as CategoryId[]).map((cat) => (
                <button
                  key={cat}
                  id={`cat-select-${cat}`}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition text-center cursor-pointer ${
                    category === cat
                      ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="product-quantity-input">
                Antal i lager
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(0, quantity - 1))}
                  className="w-9 h-10 bg-stone-100 border border-stone-300 rounded-l-xl flex items-center justify-center font-bold text-stone-700 hover:bg-stone-200 cursor-pointer"
                >
                  -
                </button>
                <input
                  id="product-quantity-input"
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-center py-2 bg-stone-50 border-y border-stone-300 text-stone-900 font-bold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-10 bg-stone-100 border border-stone-300 rounded-r-xl flex items-center justify-center font-bold text-stone-700 hover:bg-stone-200 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="product-unit-select">
                Enhet
              </label>
              <select
                id="product-unit-select"
                value={unit}
                onChange={(e) => setUnit(e.target.value as ProductUnit)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-800"
              >
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Expiration Date with quick buttons */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1" htmlFor="product-expiry-input">
                <Calendar className="w-3.5 h-3.5 text-stone-500" />
                <span>Utgångsdatum</span>
              </label>
              <span className="text-[11px] text-stone-500">Valfritt för torrvaror/övrigt</span>
            </div>
            <input
              id="product-expiry-input"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-900"
            />
            {/* Quick date presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-stone-400 self-center mr-1">Snabbval:</span>
              <button
                type="button"
                onClick={() => setPresetDate(3)}
                className="px-2 py-0.5 text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-700 rounded border border-stone-200 cursor-pointer"
              >
                +3 dgr
              </button>
              <button
                type="button"
                onClick={() => setPresetDate(7)}
                className="px-2 py-0.5 text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-700 rounded border border-stone-200 cursor-pointer"
              >
                +1 vecka
              </button>
              <button
                type="button"
                onClick={() => setPresetDate(14)}
                className="px-2 py-0.5 text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-700 rounded border border-stone-200 cursor-pointer"
              >
                +2 veckor
              </button>
              <button
                type="button"
                onClick={() => setPresetDate(30)}
                className="px-2 py-0.5 text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-700 rounded border border-stone-200 cursor-pointer"
              >
                +1 månad
              </button>
              <button
                type="button"
                onClick={() => setPresetDate(180)}
                className="px-2 py-0.5 text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-700 rounded border border-stone-200 cursor-pointer"
              >
                +6 mån
              </button>
              {expirationDate && (
                <button
                  type="button"
                  onClick={() => setPresetDate(null)}
                  className="px-2 py-0.5 text-[11px] bg-stone-200 hover:bg-rose-100 text-stone-600 hover:text-rose-700 rounded cursor-pointer"
                >
                  Rensa
                </button>
              )}
            </div>
          </div>

          {/* Min Level (for automated shopping list) */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-emerald-900 flex items-center gap-1" htmlFor="product-min-quantity-input">
                <Hash className="w-3.5 h-3.5 text-emerald-700" />
                <span>Miniminivå i lager</span>
              </label>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                {minQuantity} {unit}
              </span>
            </div>
            <p className="text-[11px] text-emerald-800/80 mb-2 leading-relaxed">
              När lagersaldot sjunker under detta antal förs artikeln automatiskt upp på <strong>inköpslistan</strong>.
            </p>
            <input
              id="product-min-quantity-input"
              type="range"
              min="0"
              max="10"
              step="1"
              value={minQuantity}
              onChange={(e) => setMinQuantity(parseInt(e.target.value) || 0)}
              className="w-full accent-emerald-700 cursor-pointer"
            />
          </div>

          {/* Barcode & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-stone-700 flex items-center gap-1" htmlFor="product-barcode-input">
                  <Barcode className="w-3.5 h-3.5 text-stone-500" />
                  <span>Streckkod (EAN)</span>
                </label>
                {barcode && (
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Kopplad
                  </span>
                )}
              </div>
              <input
                id="product-barcode-input"
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="T.ex. 7310865004819"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-900 text-xs font-mono"
              />
              <p className="text-[10px] text-stone-500 mt-1">
                Sparas med artikeln och möjliggör snabb skanning för in- och uttag.
              </p>
            </div>


            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="product-location-input">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-500" />
                  Plats i stugan
                </span>
              </label>
              <input
                id="product-location-input"
                type="text"
                value={locationDetails}
                onChange={(e) => setLocationDetails(e.target.value)}
                placeholder="T.ex. Övre hyllan, Skafferi 2..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-900 text-xs"
              />
            </div>
          </div>

          {/* Modal Actions */}
          {isConfirmingDelete ? (
            <div className="pt-3 border-t border-rose-200">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="text-xs text-rose-900 text-center sm:text-left">
                  <span className="font-bold block">Ta bort "{productToEdit?.name}"?</span>
                  <span className="text-[11px] text-rose-700">Artikeln raderas permanent från lagret.</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    id="cancel-delete-product-btn"
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="px-3 py-1.5 bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Avbryt
                  </button>
                  <button
                    id="confirm-delete-product-btn"
                    type="button"
                    onClick={() => {
                      if (productToEdit && onDelete) {
                        onDelete(productToEdit.id);
                        onClose();
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ja, ta bort</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-3">
              {productToEdit && onDelete ? (
                <button
                  id="delete-product-btn"
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="px-3 py-2 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ta bort</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  id="cancel-product-btn"
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Avbryt
                </button>
                <button
                  id="save-product-btn"
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  {productToEdit ? 'Spara ändringar' : 'Lägg till i lager'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
