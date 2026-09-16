import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Product, 
  CategoryId, 
  AppMode, 
  ShoppingItem 
} from './types';
import { 
  loadStoredProducts, 
  saveStoredProducts, 
  loadManualShoppingItems, 
  saveManualShoppingItems, 
  checkIsAuthenticated, 
  setAuthenticated,
  resetInventoryToDefaults
} from './services/storage';
import {
  fetchProductsApi,
  saveProductApi,
  deleteProductApi,
  adjustQuantityApi,
  fetchManualShoppingApi,
  saveManualShoppingApi,
  deleteManualShoppingApi,
  restockFromShoppingApi,
  resetDatabaseApi,
} from './services/api';
import { PasscodeLock } from './components/PasscodeLock';
import { TopBar } from './components/TopBar';
import { BottomNavBar } from './components/BottomNavBar';
import { CategoryCards } from './components/CategoryCards';
import { ProductList } from './components/ProductList';
import { ProductModal } from './components/ProductModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { ShoppingListView } from './components/ShoppingListView';
import { ExpiryAlertsView } from './components/ExpiryAlertsView';
import { SettingsModal } from './components/SettingsModal';
import { getDaysUntil } from './utils/dateUtils';
import { 
  Plus, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle,
  Settings,
  Cloud,
  RefreshCw
} from 'lucide-react';

export default function App() {
  // 1. Authentication
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => checkIsAuthenticated());

  // 2. Inventory Products & Database state
  const [products, setProducts] = useState<Product[]>(() => loadStoredProducts());
  const [manualShoppingItems, setManualShoppingItems] = useState<ShoppingItem[]>(() => loadManualShoppingItems());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  // 3. Navigation & Views
  const [activeTab, setActiveTab] = useState<'categories' | 'inventory' | 'shopping' | 'expiry' | 'settings'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 4. Operating Mode: 'normal' | 'påfyllnad' | 'uttag'
  const [currentMode, setCurrentMode] = useState<AppMode>('normal');

  // 5. Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [prefilledBarcode, setPrefilledBarcode] = useState<string | undefined>(undefined);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 6. Toast Notification for Fast Feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'warning' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 2800);
  };

  // Sync data with Cloud Database
  const syncWithDatabase = useCallback(async (quiet = false) => {
    if (!isAuthenticated) return;
    try {
      if (!quiet) setIsSyncing(true);
      setSyncStatus('syncing');

      const [dbProducts, dbShopping] = await Promise.all([
        fetchProductsApi(),
        fetchManualShoppingApi(),
      ]);

      setProducts(dbProducts);
      saveStoredProducts(dbProducts);

      setManualShoppingItems(dbShopping);
      saveManualShoppingItems(dbShopping);

      setSyncStatus('synced');
      if (!quiet) {
        showToast('Ansluten till molnet! Alla artiklar är synkade.', 'success');
      }
    } catch (err: any) {
      console.warn('Sync failed, using offline cache:', err);
      setSyncStatus('offline');
      if (!quiet) {
        showToast(`Kunde inte ansluta till molnet (${err?.message || 'Nätverksfel'}). Sparad lokalt.`, 'warning');
      }
    } finally {
      if (!quiet) setIsSyncing(false);
    }
  }, [isAuthenticated]);


  // Initial load and periodic background sync for multi-device collaboration
  useEffect(() => {
    if (isAuthenticated) {
      syncWithDatabase();
      const interval = setInterval(() => {
        syncWithDatabase(true);
      }, 20000); // 20s background sync
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, syncWithDatabase]);

  // Save to local cache on product changes
  useEffect(() => {
    saveStoredProducts(products);
  }, [products]);

  useEffect(() => {
    saveManualShoppingItems(manualShoppingItems);
  }, [manualShoppingItems]);

  // Auth Handlers
  const handleLoginSuccess = () => {
    setAuthenticated(true);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setIsAuthenticated(false);
  };

  // Computed urgent notifications
  const urgentExpiryCount = useMemo(() => {
    return products.filter((p) => {
      if (!p.expirationDate || p.quantity <= 0) return false;
      const d = getDaysUntil(p.expirationDate);
      return d <= 3;
    }).length;
  }, [products]);

  const shoppingListCount = useMemo(() => {
    const autoCount = products.filter((p) => p.quantity <= p.minQuantity).length;
    return autoCount + manualShoppingItems.length;
  }, [products, manualShoppingItems]);

  // Category Selection from Front Page
  const handleSelectCategory = (cat: CategoryId) => {
    setSelectedCategory(cat);
    setActiveTab('inventory');
    setSearchQuery('');
  };

  // Quick Quantity Stepper with Cloud Sync
  const handleQuickQuantityChange = async (productId: string, delta: number) => {
    // Optimistic UI update
    setProducts((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const newQty = Math.max(0, item.quantity + delta);
          if (delta > 0) {
            showToast(`+${delta} ${item.name} (Nu: ${newQty} ${item.unit})`, 'success');
          } else {
            showToast(`-${Math.abs(delta)} ${item.name} (Kvar: ${newQty} ${item.unit})`, 'warning');
          }
          return {
            ...item,
            quantity: newQty,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );

    // Sync to Cloud SQL database
    try {
      await adjustQuantityApi(productId, delta);
    } catch (err) {
      console.error('Failed to sync quantity to cloud:', err);
    }
  };

  // Add or Edit Product with Cloud Sync
  const handleSaveProduct = async (
    productData: Omit<Product, 'id' | 'updatedAt'>,
    existingId?: string
  ) => {
    const id = existingId || `prod-${Date.now()}`;
    const fullProduct: Product = {
      id,
      ...productData,
      updatedAt: new Date().toISOString(),
    };

    // Optimistic UI update
    if (existingId) {
      setProducts((prev) =>
        prev.map((p) => (p.id === existingId ? fullProduct : p))
      );
      showToast(`Uppdaterade ${productData.name}`, 'info');
    } else {
      setProducts((prev) => [fullProduct, ...prev]);
      showToast(`Lade till ${fullProduct.name} i ${fullProduct.category}`, 'success');
    }

    // Sync to Cloud SQL database
    try {
      await saveProductApi(fullProduct);
    } catch (err) {
      console.error('Failed to save to cloud database:', err);
    }
  };

  // Delete Product with Cloud Sync
  const handleDeleteProduct = async (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      saveStoredProducts(updated);
      return updated;
    });

    if (prod) {
      showToast(`Tog bort "${prod.name}" ur inventariet`, 'info');
    }

    try {
      setSyncStatus('syncing');
      await deleteProductApi(productId);
      setSyncStatus('synced');
    } catch (err: any) {
      console.error('Failed to delete from cloud database:', err);
      setSyncStatus('offline');
      showToast(`Kunde inte ta bort artikeln från molnet (${err?.message || 'Nätverksfel'}). Sparad lokalt.`, 'warning');
    }
  };

  // Barcode scanned actions
  const handleProductScanned = (
    product: Product,
    action: 'increment' | 'decrement' | 'select'
  ) => {
    if (action === 'increment') {
      handleQuickQuantityChange(product.id, 1);
    } else if (action === 'decrement') {
      handleQuickQuantityChange(product.id, -1);
    } else {
      setProductToEdit(product);
      setIsScannerOpen(false);
      setIsProductModalOpen(true);
    }
  };

  const handleUnknownBarcodeScanned = (barcode: string) => {
    setPrefilledBarcode(barcode);
    setProductToEdit(null);
    setIsScannerOpen(false);
    setIsProductModalOpen(true);
    showToast(`Streckkod ${barcode} sparad! Fyll i artikelnamn och saldo.`, 'info');
  };


  // Shopping list actions
  const handleAddManualShoppingItem = async (
    itemData: Omit<ShoppingItem, 'id' | 'isChecked'>
  ) => {
    const newItem: ShoppingItem = {
      id: `manual-${Date.now()}`,
      ...itemData,
      isChecked: false,
      isManual: true,
    };
    setManualShoppingItems((prev) => [newItem, ...prev]);
    showToast(`Lade till "${newItem.name}" på inköpslistan`, 'info');

    try {
      await saveManualShoppingApi(newItem);
    } catch (err) {
      console.error('Failed to sync manual shopping item:', err);
    }
  };

  const handleRemoveManualShoppingItem = async (id: string) => {
    setManualShoppingItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await deleteManualShoppingApi(id);
    } catch (err) {
      console.error('Failed to delete manual shopping item:', err);
    }
  };

  const handleRestockFromShoppingList = async (
    restockedItems: { productId: string; addQty: number }[]
  ) => {
    setProducts((prev) =>
      prev.map((prod) => {
        const found = restockedItems.find((r) => r.productId === prod.id);
        if (found) {
          return {
            ...prod,
            quantity: prod.quantity + found.addQty,
            updatedAt: new Date().toISOString(),
          };
        }
        return prod;
      })
    );
    showToast(`Fyllde på ${restockedItems.length} artiklar i lagret! 🎉`, 'success');

    try {
      await restockFromShoppingApi(restockedItems);
    } catch (err) {
      console.error('Failed to restock in cloud database:', err);
    }
  };

  // Reset database to defaults
  const handleResetData = async () => {
    try {
      const resetProducts = await resetDatabaseApi();
      setProducts(resetProducts);
      setManualShoppingItems([]);
      showToast('Återställde databasen till Björnstugans standardartiklar', 'info');
    } catch (err) {
      const defaults = resetInventoryToDefaults();
      setProducts(defaults);
      setManualShoppingItems([]);
      showToast('Återställde lokala artiklar', 'info');
    }
  };

  const handleImportData = async (importedProducts: Product[]) => {
    setProducts(importedProducts);
    for (const prod of importedProducts) {
      try {
        await saveProductApi(prod);
      } catch (err) {
        // Continue with rest
      }
    }
    showToast(`Importerade ${importedProducts.length} artiklar till molndatabasen`, 'success');
  };

  // If not authenticated, show passcode screen
  if (!isAuthenticated) {
    return <PasscodeLock onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-32 sm:pb-28 flex flex-col antialiased">

      {/* Top Header with Mode Switcher & Quick Actions */}
      <TopBar
        currentCategory={selectedCategory}
        activeTab={activeTab}
        onNavigateHome={() => {
          setActiveTab('categories');
          setSelectedCategory('all');
          setSearchQuery('');
        }}
        onNavigateTab={(tab) => setActiveTab(tab)}
        currentMode={currentMode}
        onModeChange={(mode) => {
          setCurrentMode(mode);
          if (mode === 'påfyllnad') {
            showToast('Läge: Påfyllnad aktiverat (+1 vid klick/skanning)', 'success');
          } else if (mode === 'uttag') {
            showToast('Läge: Uttag aktiverat (-1 vid klick/skanning)', 'warning');
          } else {
            showToast('Läge: Normal vy', 'info');
          }
        }}
        onOpenScanner={() => setIsScannerOpen(true)}
        onLogout={handleLogout}
        urgentExpiryCount={urgentExpiryCount}
        shoppingListCount={shoppingListCount}
      />

      {/* Cloud Sync Status Banner */}
      <div className="bg-stone-800 text-stone-300 text-[11px] px-4 py-1.5 flex items-center justify-between border-b border-stone-700/60 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-1.5">
          <Cloud className={`w-3.5 h-3.5 ${syncStatus === 'synced' ? 'text-emerald-400' : syncStatus === 'syncing' ? 'text-amber-400 animate-pulse' : 'text-amber-400'}`} />
          <span>
            {syncStatus === 'synced' && 'Molndatabas: Synkad med alla enheter'}
            {syncStatus === 'syncing' && 'Synkroniserar ändringar med molnet...'}
            {syncStatus === 'offline' && 'Offlineläge (sparar lokalt i webbläsaren)'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {syncStatus === 'offline' && (
            <button
              id="reconnect-cloud-btn"
              type="button"
              onClick={() => syncWithDatabase()}
              className="text-emerald-400 hover:text-emerald-300 font-bold bg-stone-700/80 hover:bg-stone-700 px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Återanslut moln</span>
            </button>
          )}
          <button
            id="manual-sync-btn"
            type="button"
            onClick={() => syncWithDatabase()}
            className="text-stone-400 hover:text-emerald-400 transition cursor-pointer flex items-center gap-1"
            title="Synka nu"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Synka</span>
          </button>
        </div>
      </div>


      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg text-xs font-semibold flex items-center gap-2 animate-fade-in transition-all">
          <div
            className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md border ${
              toastMessage.type === 'success'
                ? 'bg-emerald-800 text-white border-emerald-700'
                : toastMessage.type === 'warning'
                ? 'bg-amber-700 text-white border-amber-600'
                : 'bg-stone-900 text-white border-stone-800'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />}
            {toastMessage.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-4xl w-full mx-auto px-3.5 sm:px-4 py-4 flex-1">
        {/* 1. Front Page: Categories */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <CategoryCards
              products={products}
              onSelectCategory={handleSelectCategory}
            />

            {/* Quick overview of urgent items if any */}
            {urgentExpiryCount > 0 && (
              <div 
                id="urgent-alert-banner"
                onClick={() => setActiveTab('expiry')}
                className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-amber-100/60 transition shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-900">
                      {urgentExpiryCount} {urgentExpiryCount === 1 ? 'artikel' : 'artiklar'} går ut inom kort
                    </h3>
                    <p className="text-xs text-amber-700">
                      Klicka här för att granska och använda före bäst-före datumet
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-lg">
                  Visa
                </span>
              </div>
            )}

            {/* Quick Actions & Database info */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
              <button
                id="open-settings-btn"
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-200/70 hover:bg-stone-200 text-stone-700 rounded-xl font-medium transition cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Databas & Säkerhetskopia</span>
              </button>

              <button
                id="front-add-item-btn"
                type="button"
                onClick={() => {
                  setProductToEdit(null);
                  setPrefilledBarcode(undefined);
                  setIsProductModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-semibold shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Lägg till artikel</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. Inventory List inside selected category or all */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            {/* Category header & Back button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  id="back-to-categories-btn"
                  type="button"
                  onClick={() => {
                    setActiveTab('categories');
                    setSelectedCategory('all');
                  }}
                  className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded-lg transition cursor-pointer"
                  title="Tillbaka till alla kategorier"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-stone-900 tracking-tight capitalize">
                    {selectedCategory === 'all' ? 'Hela Lagret' : selectedCategory}
                  </h2>
                  <span className="text-xs text-stone-500">
                    {products.filter((p) => selectedCategory === 'all' || p.category === selectedCategory).length} artiklar i detta utrymme
                  </span>
                </div>
              </div>

              {/* Add product button */}
              <button
                id="inventory-add-product-btn"
                type="button"
                onClick={() => {
                  setProductToEdit(null);
                  setPrefilledBarcode(undefined);
                  setIsProductModalOpen(true);
                }}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden xs:inline">Ny artikel</span>
              </button>
            </div>

            {/* Category Filter Pills when in inventory */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                id="cat-pill-all"
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'
                }`}
              >
                Alla
              </button>
              {(['kylskåp', 'skafferi', 'förbrukning', 'övrigt'] as CategoryId[]).map((cat) => (
                <button
                  key={cat}
                  id={`cat-pill-${cat}`}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-semibold capitalize transition cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <ProductList
              products={products}
              currentCategory={selectedCategory}
              currentMode={currentMode}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onEditProduct={(product) => {
                setProductToEdit(product);
                setPrefilledBarcode(undefined);
                setIsProductModalOpen(true);
              }}
              onDeleteProduct={handleDeleteProduct}
              onQuickQuantityChange={handleQuickQuantityChange}
              onAddNewProduct={() => {
                setProductToEdit(null);
                setPrefilledBarcode(undefined);
                setIsProductModalOpen(true);
              }}
              onOpenScanner={() => setIsScannerOpen(true)}
            />
          </div>
        )}

        {/* 3. Automatic Shopping List */}
        {activeTab === 'shopping' && (
          <ShoppingListView
            products={products}
            manualItems={manualShoppingItems}
            onAddManualItem={handleAddManualShoppingItem}
            onRemoveManualItem={handleRemoveManualShoppingItem}
            onRestockFromShoppingList={handleRestockFromShoppingList}
          />
        )}

        {/* 4. Expiry Dates & Warnings */}
        {activeTab === 'expiry' && (
          <ExpiryAlertsView
            products={products}
            onEditProduct={(product) => {
              setProductToEdit(product);
              setPrefilledBarcode(undefined);
              setIsProductModalOpen(true);
            }}
            onConsumeProduct={(id) => handleQuickQuantityChange(id, -1)}
            onDeleteProduct={handleDeleteProduct}
            onNavigateToCategory={(cat) => {
              setSelectedCategory(cat as CategoryId);
              setActiveTab('inventory');
            }}
          />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'categories') {
            setSelectedCategory('all');
          }
        }}
        onOpenScanner={() => setIsScannerOpen(true)}
        urgentExpiryCount={urgentExpiryCount}
        shoppingListCount={shoppingListCount}
      />

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
          setPrefilledBarcode(undefined);
        }}
        onSave={handleSaveProduct}
        onDelete={handleDeleteProduct}
        initialCategory={selectedCategory === 'all' ? 'skafferi' : selectedCategory}
        productToEdit={productToEdit}
        prefilledBarcode={prefilledBarcode}
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
        currentMode={currentMode}
        onProductScanned={handleProductScanned}
        onUnknownBarcodeScanned={handleUnknownBarcodeScanned}
      />

      {/* Database & Backup Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        products={products}
        onResetData={handleResetData}
        onImportData={handleImportData}
      />
    </div>
  );
}
