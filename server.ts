import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { Request, Response } from 'express';

interface StoredUser {
  uid: string;
  displayName: string;
  email: string;
  passwordHash: string;
  salt: string;
  phone: string;
  barangay: string;
  streetAddress: string;
  role?: 'customer' | 'admin';
  createdAt: string;
}

interface StoredOrderItem {
  id: string;
  recipientName: string;
  recipientPhone: string;
  barangay: string;
  streetLandmark: string;
  deliverySlot: string;
  paymentMethod: string;
  status: 'preparing' | 'out_for_delivery' | 'delivered';
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  summaryText: string;
  createdAt: string;
}

interface StoredDatabase {
  users: StoredUser[];
  sessions: Record<string, string>;
  userStates: Record<
    string,
    {
      cart: unknown[];
      savedBouquets: unknown[];
      orders: unknown[];
    }
  >;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_PATH = path.join(DATA_DIR, 'floraview_db.json');

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function ensureAdminSeeded(db: StoredDatabase): boolean {
  let modified = false;
  const adminEmail = 'admin';
  const existingAdmin = db.users.find(
    (u) => u.email.toLowerCase() === adminEmail,
  );
  if (!existingAdmin) {
    const adminSalt = 'dagupan_atelier_admin_salt_2026';
    const adminUid = 'user-admin-dagupan';
    db.users.push({
      uid: adminUid,
      displayName: 'Dagupan Atelier Admin',
      email: adminEmail,
      passwordHash: hashPassword('admin123', adminSalt),
      salt: adminSalt,
      phone: '+63 917 500 2026',
      barangay: 'Poblacion Oeste',
      streetAddress: 'Plaza Rizal & A.B. Fernandez Ave, Dagupan City',
      role: 'admin',
      createdAt: '2026-10-01T08:00:00.000Z',
    });
    if (!db.userStates[adminUid]) {
      db.userStates[adminUid] = { cart: [], savedBouquets: [], orders: [] };
    }
    modified = true;
  } else if (existingAdmin.role !== 'admin') {
    existingAdmin.role = 'admin';
    modified = true;
  }
  return modified;
}

function loadDatabase(): StoredDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const demoSalt = 'dagupan_flora_seed_2026';
    const demoUid = 'user-clara-dagupan';
    const initial: StoredDatabase = {
      users: [
        {
          uid: demoUid,
          displayName: 'Clara Reyes',
          email: 'clara.reyes@dagupanflora.ph',
          passwordHash: hashPassword('Flora2026!', demoSalt),
          salt: demoSalt,
          phone: '+63 917 842 3910',
          barangay: 'Lucao',
          streetAddress: '184 De Venecia Rd, near CSI City Mall, Brgy. Lucao, Dagupan City',
          role: 'customer',
          createdAt: '2026-10-18T08:30:00.000Z',
        },
      ],
      sessions: {},
      userStates: {
        [demoUid]: {
          cart: [],
          savedBouquets: [
            {
              id: 'bq-saved-101',
              title: 'Lingayen Sunset Sampaguita & Rose',
              totalPrice: 2145,
              stemCount: 15,
              createdAt: '2026-10-25T10:15:00.000Z',
              config: {
                title: 'Lingayen Sunset Sampaguita & Rose',
                stems: {
                  rose: 5,
                  sunflower: 2,
                  stargazer: 1,
                  orchid: 1,
                  sampaguita: 3,
                  eucalyptus: 3,
                },
                petalPalette: 'sunset',
                wrapStyle: 'kraft_linen',
                ribbonStyle: 'champagne',
              },
            },
          ],
          orders: [
            {
              id: 'FV-8421',
              recipientName: 'Elena Reyes',
              recipientPhone: '+63 917 842 3910',
              barangay: 'Tapuac',
              streetLandmark: '72 Tapuac District Rd, near Region 1 Medical Center',
              deliverySlot: 'Express 90-Min',
              paymentMethod: 'GCash',
              status: 'delivered',
              subtotal: 1890,
              deliveryFee: 65,
              totalAmount: 1955,
              summaryText: '1x Sampaguita & Capiz Blush Hand-Tie (Pantal River Botanicals)',
              createdAt: '2026-10-28T09:12:00.000Z',
            },
            {
              id: 'FV-8490',
              recipientName: 'Marco Bautista',
              recipientPhone: '+63 918 510 7724',
              barangay: 'Bonuan Gueset',
              streetLandmark: 'Tondaligan Blue Beach Pavilion, Brgy. Bonuan Gueset',
              deliverySlot: 'Afternoon 1PM–5PM',
              paymentMethod: 'Maya',
              status: 'out_for_delivery',
              subtotal: 2450,
              deliveryFee: 0,
              totalAmount: 2450,
              summaryText: '1x Lucao Stargazer & Phalaenopsis (Lucao Garden Atelier)',
              createdAt: '2026-11-05T14:20:00.000Z',
            },
          ],
        },
      },
    };
    ensureAdminSeeded(initial);
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) as StoredDatabase;
    if (!Array.isArray(parsed.users)) parsed.users = [];
    if (!parsed.sessions) parsed.sessions = {};
    if (!parsed.userStates) parsed.userStates = {};
    if (ensureAdminSeeded(parsed)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), 'utf8');
    }
    return parsed;
  } catch {
    const fallback: StoredDatabase = { users: [], sessions: {}, userStates: {} };
    ensureAdminSeeded(fallback);
    return fallback;
  }
}

function saveDatabase(db: StoredDatabase): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function getSessionToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

function requireAdminUser(
  req: Request,
  res: Response,
  db: StoredDatabase,
): StoredUser | null {
  const token = getSessionToken(req);
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }
  const uid = db.sessions[token];
  const user = uid ? db.users.find((u) => u.uid === uid) : undefined;
  if (!user) {
    res.status(401).json({ error: 'Session expired' });
    return null;
  }
  if ((user.role || 'customer') !== 'admin') {
    res.status(403).json({ error: 'Administrator privileges required.' });
    return null;
  }
  return user;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'floraview-dagupan' });
  });

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { displayName, email, password, phone, barangay, streetAddress } = req.body || {};
    if (!displayName || !email || !password || String(password).length < 6) {
      res.status(400).json({ error: 'Name, email, and a password of at least 6 characters are required.' });
      return;
    }

    const db = loadDatabase();
    const normalizedEmail = String(email).trim().toLowerCase();
    if (
      normalizedEmail === 'admin' ||
      db.users.some((u) => u.email.toLowerCase() === normalizedEmail)
    ) {
      res.status(409).json({ error: 'An account with this identifier already exists. Please log in instead.' });
      return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const uid = `user-${crypto.randomBytes(6).toString('hex')}`;
    const newUser: StoredUser = {
      uid,
      displayName: String(displayName).trim().slice(0, 80),
      email: normalizedEmail,
      passwordHash: hashPassword(String(password), salt),
      salt,
      phone: String(phone || '+63 917 000 0000').trim().slice(0, 24),
      barangay: String(barangay || 'Lucao').trim().slice(0, 64),
      streetAddress: String(streetAddress || 'Dagupan City, Pangasinan').trim().slice(0, 200),
      role: 'customer',
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    db.userStates[uid] = { cart: [], savedBouquets: [], orders: [] };
    const token = crypto.randomBytes(24).toString('hex');
    db.sessions[token] = uid;
    saveDatabase(db);

    res.status(201).json({
      token,
      user: {
        uid: newUser.uid,
        displayName: newUser.displayName,
        email: newUser.email,
        phone: newUser.phone,
        barangay: newUser.barangay,
        streetAddress: newUser.streetAddress,
        provider: 'email',
        role: 'customer',
      },
      state: db.userStates[uid],
    });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'Email or username and password are required.' });
      return;
    }

    const db = loadDatabase();
    const normalizedEmail = String(email).trim().toLowerCase();
    const found = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!found) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    const computed = hashPassword(String(password), found.salt);
    if (computed !== found.passwordHash) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    const token = crypto.randomBytes(24).toString('hex');
    db.sessions[token] = found.uid;
    if (!db.userStates[found.uid]) {
      db.userStates[found.uid] = { cart: [], savedBouquets: [], orders: [] };
    }
    saveDatabase(db);

    res.json({
      token,
      user: {
        uid: found.uid,
        displayName: found.displayName,
        email: found.email,
        phone: found.phone,
        barangay: found.barangay,
        streetAddress: found.streetAddress,
        provider: 'email',
        role: found.role || 'customer',
      },
      state: db.userStates[found.uid],
    });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const token = getSessionToken(req);
    if (!token) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const db = loadDatabase();
    const uid = db.sessions[token];
    const user = uid ? db.users.find((u) => u.uid === uid) : undefined;
    if (!user) {
      res.status(401).json({ error: 'Session expired' });
      return;
    }
    res.json({
      user: {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        phone: user.phone,
        barangay: user.barangay,
        streetAddress: user.streetAddress,
        provider: 'email',
        role: user.role || 'customer',
      },
      state: db.userStates[user.uid] || { cart: [], savedBouquets: [], orders: [] },
    });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const token = getSessionToken(req);
    if (token) {
      const db = loadDatabase();
      delete db.sessions[token];
      saveDatabase(db);
    }
    res.json({ ok: true });
  });

  app.get('/api/admin/overview', (req: Request, res: Response) => {
    const db = loadDatabase();
    const adminUser = requireAdminUser(req, res, db);
    if (!adminUser) return;

    const allOrders: Array<
      StoredOrderItem & {
        ownerUid: string;
        customerName: string;
        customerEmail: string;
      }
    > = [];

    const customers = db.users.map((u) => {
      const state = db.userStates[u.uid] || { cart: [], savedBouquets: [], orders: [] };
      const userOrders = Array.isArray(state.orders)
        ? (state.orders as StoredOrderItem[])
        : [];
      const userBouquets = Array.isArray(state.savedBouquets) ? state.savedBouquets : [];

      for (const ord of userOrders) {
        allOrders.push({
          ...ord,
          ownerUid: u.uid,
          customerName: u.displayName,
          customerEmail: u.email,
        });
      }

      const totalSpent = userOrders.reduce(
        (sum, ord) => sum + Number(ord.totalAmount || 0),
        0,
      );

      return {
        uid: u.uid,
        displayName: u.displayName,
        email: u.email,
        phone: u.phone,
        barangay: u.barangay,
        streetAddress: u.streetAddress,
        role: u.role || 'customer',
        orderCount: userOrders.length,
        savedBouquetCount: userBouquets.length,
        totalSpent,
        createdAt: u.createdAt,
      };
    });

    allOrders.sort((a, b) => {
      const ta = Date.parse(a.createdAt || '') || 0;
      const tb = Date.parse(b.createdAt || '') || 0;
      return tb - ta;
    });

    const totalRevenue = allOrders.reduce(
      (sum, ord) => sum + Number(ord.totalAmount || 0),
      0,
    );
    const activeOrdersCount = allOrders.filter((o) => o.status !== 'delivered').length;
    const deliveredOrdersCount = allOrders.filter((o) => o.status === 'delivered').length;
    const nonAdminCustomers = customers.filter((c) => c.role !== 'admin');
    const totalSavedBouquetsCount = customers.reduce(
      (sum, c) => sum + c.savedBouquetCount,
      0,
    );

    res.json({
      overview: {
        totalRevenue,
        activeOrdersCount,
        deliveredOrdersCount,
        totalCustomersCount: nonAdminCustomers.length,
        totalSavedBouquetsCount,
        orders: allOrders,
        customers: nonAdminCustomers,
      },
    });
  });

  app.patch('/api/admin/orders/:orderId/status', (req: Request, res: Response) => {
    const db = loadDatabase();
    const adminUser = requireAdminUser(req, res, db);
    if (!adminUser) return;

    const { orderId } = req.params;
    const nextStatus = req.body?.status;
    if (
      nextStatus !== 'preparing' &&
      nextStatus !== 'out_for_delivery' &&
      nextStatus !== 'delivered'
    ) {
      res.status(400).json({ error: 'Invalid delivery status.' });
      return;
    }

    let foundOwnerUid: string | null = null;
    for (const [ownerUid, state] of Object.entries(db.userStates)) {
      if (!Array.isArray(state.orders)) continue;
      const idx = (state.orders as StoredOrderItem[]).findIndex((o) => o.id === orderId);
      if (idx >= 0) {
        (state.orders as StoredOrderItem[])[idx] = {
          ...(state.orders as StoredOrderItem[])[idx],
          status: nextStatus,
        };
        foundOwnerUid = ownerUid;
        break;
      }
    }

    if (!foundOwnerUid) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    saveDatabase(db);
    res.json({ ok: true, orderId, status: nextStatus, ownerUid: foundOwnerUid });
  });

  app.put('/api/user/state', (req: Request, res: Response) => {
    const token = getSessionToken(req);
    if (!token) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const db = loadDatabase();
    const uid = db.sessions[token];
    if (!uid) {
      res.status(401).json({ error: 'Invalid session' });
      return;
    }

    const { cart, savedBouquets, orders, profileUpdates } = req.body || {};
    const current = db.userStates[uid] || { cart: [], savedBouquets: [], orders: [] };
    db.userStates[uid] = {
      cart: Array.isArray(cart) ? cart : current.cart,
      savedBouquets: Array.isArray(savedBouquets) ? savedBouquets : current.savedBouquets,
      orders: Array.isArray(orders) ? orders : current.orders,
    };

    if (profileUpdates && typeof profileUpdates === 'object') {
      const userIdx = db.users.findIndex((u) => u.uid === uid);
      if (userIdx >= 0) {
        if (profileUpdates.displayName) db.users[userIdx].displayName = String(profileUpdates.displayName).slice(0, 80);
        if (profileUpdates.phone) db.users[userIdx].phone = String(profileUpdates.phone).slice(0, 24);
        if (profileUpdates.barangay) db.users[userIdx].barangay = String(profileUpdates.barangay).slice(0, 64);
        if (profileUpdates.streetAddress) db.users[userIdx].streetAddress = String(profileUpdates.streetAddress).slice(0, 200);
      }
    }

    saveDatabase(db);
    res.json({ ok: true, state: db.userStates[uid] });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`FloraView Dagupan server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
