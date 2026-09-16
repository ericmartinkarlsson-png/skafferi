import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { 
  getAllProducts, 
  upsertProduct, 
  deleteProductById, 
  adjustProductQuantity,
  getManualShoppingItems,
  upsertManualItem,
  deleteManualItem,
  resetAllToDefaults
} from './src/db/inventoryRepo.ts';
import { requireCabinAuth, AuthRequest } from './src/middleware/auth.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Verify Passcode / Auth endpoint
  app.post('/api/auth/verify', (req, res) => {
    const { passcode } = req.body;
    if (passcode === 'Björnstugan1337') {
      res.json({ success: true, token: 'Björnstugan1337' });
    } else {
      res.status(401).json({ success: false, error: 'Felaktig lösenkod' });
    }
  });

  // Products API
  app.get('/api/products', requireCabinAuth, async (req: AuthRequest, res) => {
    try {
      const items = await getAllProducts();
      res.json(items);
    } catch (error: any) {
      console.error('Failed to get products:', error);
      res.status(500).json({ error: error.message || 'Kunde inte hämta produkter' });
    }
  });

  app.post('/api/products', requireCabinAuth, async (req: AuthRequest, res) => {
    try {
      const product = req.body;
      const saved = await upsertProduct(product);
      res.json(saved);
    } catch (error: any) {
      console.error('Failed to save product:', error);
      res.status(500).json({ error: error.message || 'Kunde inte spara produkt' });
    }
  });

  app.delete('/api/products/:id', requireCabinAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await deleteProductById(id);
      res.json({ success: true, id });
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      res.status(500).json({ error: error.message || 'Kunde inte ta bort produkt' });
    }
  });

  app.patch('/api/products/:id/quantity', requireCabinAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { delta } = req.body;
      const updated = await adjustProductQuantity(id, Number(delta) || 0);
      if (!updated) {
        return res.status(404).json({ error: 'Produkten hittades inte' });
      }
      res.json(updated);
    } catch (error: any) {
      console.error('Failed to adjust quantity:', error);
      res.status(500).json({ error: error.message || 'Kunde inte uppdatera lagersaldo' });
    }
  });

  // Shopping List API
  app.get('/api/shopping/manual', requireCabinAuth, async (req: AuthRequest, res) => {
    try {
      const items = await getManualShoppingItems();
      res.json(items);
    } catch (error: any) {
      console.error('Failed to get manual shopping items:', error);
      res.status(500).json({ error: error.message || 'Kunde inte hämta inköpslista' });
    }
  });

  app.post('/api/shopping/manual', requireCabinAuth, async (req: AuthRequest, res) => {
    try {
      const item = req.body;
      await upsertManualItem(item);
      res.json({ success: true, item });
    } catch (error: any) {
      console.error('Failed to save manual shopping item:', error);
      res.status(500).json({ error: error.message || 'Kunde inte spara inköpsvara' });
    }
  });

  app.delete('/api/shopping/manual/:id', requireCabinAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await deleteManualItem(id);
      res.json({ success: true, id });
    } catch (error: any) {
      console.error('Failed to delete manual shopping item:', error);
      res.status(500).json({ error: error.message || 'Kunde inte ta bort inköpsvara' });
    }
  });

  // Restock batch from shopping list
  app.post('/api/shopping/restock', requireCabinAuth, async (req: AuthRequest, res) => {
    try {
      const { items } = req.body; // array of { productId, addQty }
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.productId && item.addQty) {
            await adjustProductQuantity(item.productId, item.addQty);
          }
        }
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error('Failed to restock items:', error);
      res.status(500).json({ error: error.message || 'Kunde inte fylla på lagret' });
    }
  });

  // Reset database to defaults
  app.post('/api/database/reset', requireCabinAuth, async (req: AuthRequest, res) => {
    try {
      const resetProducts = await resetAllToDefaults();
      res.json({ success: true, products: resetProducts });
    } catch (error: any) {
      console.error('Failed to reset database:', error);
      res.status(500).json({ error: error.message || 'Kunde inte återställa databasen' });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Björnstugan server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
