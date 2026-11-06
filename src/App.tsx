import { useCallback, useEffect, useRef, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { MobileShell } from './components/MobileShell';
import {
  calculateBouquetPrice,
  CATALOG_BOUQUETS,
  DEFAULT_BOUQUET_CONFIG,
  getTotalStemCount,
} from './data/dagupanCatalog';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from './lib/firebase';
import { AdminScreen } from './screens/AdminScreen';
import { ARVisualizationScreen } from './screens/ARVisualizationScreen';
import { CartScreen } from './screens/CartScreen';
import { CustomBouquetScreen } from './screens/CustomBouquetScreen';
import { FlowerDetailsScreen } from './screens/FlowerDetailsScreen';
import { HomeScreen } from './screens/HomeScreen';
import { LoginScreen } from './screens/LoginScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { ShopsScreen } from './screens/ShopsScreen';
import { SplashScreen } from './screens/SplashScreen';
import {
  AdminOverviewPayload,
  BouquetConfig,
  CartItem,
  CatalogBouquet,
  DagupanOrder,
  SavedBouquetRecord,
  ScreenId,
  UserAccount,
} from './types/floraview';

const VALID_SCREENS: ScreenId[] = [
  'splash',
  'register',
  'home',
  'shops',
  'details',
  'studio',
  'ar',
  'cart',
  'profile',
  'login',
  'admin',
];

const GUEST_USER: UserAccount = {
  uid: 'guest-dagupan',
  displayName: 'Dagupan Guest',
  email: 'guest@floraview.ph',
  phone: '+63 917 842 3910',
  barangay: 'Lucao',
  streetAddress: 'De Venecia Rd, Brgy. Lucao, Dagupan City',
  provider: 'guest',
};

const INITIAL_GUEST_CART: CartItem[] = [
  {
    id: 'init-sampaguita-blush',
    name: CATALOG_BOUQUETS[0].name,
    subtitle: 'Classic · 15 Stems',
    shopName: CATALOG_BOUQUETS[0].shopName,
    unitPrice: CATALOG_BOUQUETS[0].price,
    quantity: 1,
    image: CATALOG_BOUQUETS[0].image,
    isCustom3D: false,
    sizeTier: 'classic',
  },
];

const TOKEN_STORAGE_KEY = 'floraview_session_token';
const GUEST_STATE_KEY = 'floraview_guest_state_v1';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('screen') as ScreenId | null;
    return s && VALID_SCREENS.includes(s) ? s : 'splash';
  });

  const [user, setUser] = useState<UserAccount>(GUEST_USER);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(() =>
    window.localStorage.getItem(TOKEN_STORAGE_KEY),
  );

  const [selectedBarangay, setSelectedBarangay] = useState<string>('Lucao');
  const [selectedShopFilter, setSelectedShopFilter] = useState<string>('all');
  const [selectedBouquet, setSelectedBouquet] = useState<CatalogBouquet>(
    CATALOG_BOUQUETS[0],
  );
  const [customConfig, setCustomConfig] = useState<BouquetConfig>(
    DEFAULT_BOUQUET_CONFIG,
  );

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = window.localStorage.getItem(GUEST_STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.cart)) return parsed.cart;
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_GUEST_CART;
  });

  const [savedBouquets, setSavedBouquets] = useState<SavedBouquetRecord[]>(() => {
    try {
      const raw = window.localStorage.getItem(GUEST_STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.savedBouquets)) return parsed.savedBouquets;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'bq-default-1',
        title: DEFAULT_BOUQUET_CONFIG.title,
        config: DEFAULT_BOUQUET_CONFIG,
        totalPrice: calculateBouquetPrice(DEFAULT_BOUQUET_CONFIG),
        stemCount: getTotalStemCount(DEFAULT_BOUQUET_CONFIG.stems),
        createdAt: new Date().toISOString(),
      },
    ];
  });

  const [orders, setOrders] = useState<DagupanOrder[]>(() => {
    try {
      const raw = window.localStorage.getItem(GUEST_STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.orders)) return parsed.orders;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const navigate = useCallback((screen: ScreenId) => {
    setCurrentScreen(screen);
    try {
      const url = new URL(window.location.href);
      if (screen === 'splash') {
        url.searchParams.delete('screen');
      } else {
        url.searchParams.set('screen', screen);
      }
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore history errors
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  // Boot Firestore connection verification
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  const skipSessionFetchRef = useRef(false);
  const [adminOverview, setAdminOverview] = useState<AdminOverviewPayload | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  const fetchAdminOverview = useCallback(
    async (tokenOverride?: string) => {
      const token = tokenOverride || sessionToken;
      if (!token) return;
      setAdminLoading(true);
      setAdminError(null);
      try {
        const res = await fetch('/api/admin/overview', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load administrator overview.');
        }
        setAdminOverview(data.overview || null);
      } catch (err) {
        setAdminError(
          err instanceof Error
            ? err.message
            : 'Unable to reach Dagupan Atelier admin desk.',
        );
      } finally {
        setAdminLoading(false);
      }
    },
    [sessionToken],
  );

  useEffect(() => {
    if (user.role === 'admin' && sessionToken) {
      fetchAdminOverview(sessionToken);
    } else {
      setAdminOverview(null);
      setAdminError(null);
    }
  }, [user.role, sessionToken, fetchAdminOverview]);

  // Restore Express email session if token exists on page load
  useEffect(() => {
    if (!sessionToken) return;
    if (skipSessionFetchRef.current) {
      skipSessionFetchRef.current = false;
      return;
    }
    let active = true;
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${sessionToken}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Expired'))))
      .then((data) => {
        if (!active) return;
        if (data.user) {
          setUser(data.user);
          if (data.user.barangay) setSelectedBarangay(data.user.barangay);
        }
        if (data.state) {
          if (Array.isArray(data.state.cart) && data.state.cart.length > 0) {
            setCart(data.state.cart);
          }
          if (Array.isArray(data.state.savedBouquets))
            setSavedBouquets(data.state.savedBouquets);
          if (Array.isArray(data.state.orders)) setOrders(data.state.orders);
        }
      })
      .catch(() => {
        if (!active) return;
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        setSessionToken(null);
      });
    return () => {
      active = false;
    };
  }, [sessionToken]);

  // Listen to Firebase Auth state & sync Firestore profile + subcollections
  useEffect(() => {
    let unsubBouquets: (() => void) | undefined;
    let unsubOrders: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (unsubBouquets) unsubBouquets();
      if (unsubOrders) unsubOrders();

      if (!fbUser) return;

      const userRef = doc(db, 'users', fbUser.uid);
      try {
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          const profilePayload = {
            uid: fbUser.uid,
            displayName: fbUser.displayName || 'Dagupan Member',
            email: fbUser.email || 'member@floraview.ph',
            phone: '+63 917 842 3910',
            barangay: selectedBarangay,
            streetAddress: `Brgy. ${selectedBarangay}, Dagupan City`,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, profilePayload);
          setUser({
            uid: fbUser.uid,
            displayName: profilePayload.displayName,
            email: profilePayload.email,
            phone: profilePayload.phone,
            barangay: profilePayload.barangay,
            streetAddress: profilePayload.streetAddress,
            provider: 'google',
          });
        } else {
          const d = snap.data();
          const bgy = String(d.barangay || 'Lucao');
          setSelectedBarangay(bgy);
          setUser({
            uid: fbUser.uid,
            displayName: String(d.displayName || fbUser.displayName || 'Dagupan Member'),
            email: String(d.email || fbUser.email || ''),
            phone: String(d.phone || '+63 917 842 3910'),
            barangay: bgy,
            streetAddress: String(d.streetAddress || `Brgy. ${bgy}, Dagupan City`),
            provider: 'google',
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
      }

      const bouquetsQ = query(
        collection(db, 'users', fbUser.uid, 'bouquets'),
        where('ownerId', '==', fbUser.uid),
      );
      unsubBouquets = onSnapshot(
        bouquetsQ,
        (snapshot) => {
          const list: SavedBouquetRecord[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              title: String(data.title || 'Custom 3D Bouquet'),
              totalPrice: Number(data.totalPrice || 1500),
              stemCount: Number(data.stemCount || 12),
              createdAt:
                data.createdAt?.toDate?.()?.toISOString?.() ||
                new Date().toISOString(),
              config: {
                title: String(data.title || 'Custom 3D Bouquet'),
                stems: data.stems || DEFAULT_BOUQUET_CONFIG.stems,
                petalPalette: data.petalPalette || 'blush',
                wrapStyle: data.wrapStyle || 'kraft_linen',
                ribbonStyle: data.ribbonStyle || 'champagne',
              },
            };
          });
          setSavedBouquets(list);
        },
        (err) => {
          handleFirestoreError(
            err,
            OperationType.LIST,
            `users/${fbUser.uid}/bouquets`,
          );
        },
      );

      const ordersQ = query(
        collection(db, 'users', fbUser.uid, 'orders'),
        where('ownerId', '==', fbUser.uid),
      );
      unsubOrders = onSnapshot(
        ordersQ,
        (snapshot) => {
          const list: DagupanOrder[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              recipientName: String(data.recipientName || ''),
              recipientPhone: String(data.recipientPhone || ''),
              barangay: String(data.barangay || 'Lucao'),
              streetLandmark: String(data.streetLandmark || ''),
              deliverySlot: String(data.deliverySlot || 'Express 90-Min'),
              paymentMethod: String(data.paymentMethod || 'GCash'),
              status: data.status || 'preparing',
              subtotal: Number(data.subtotal || 0),
              deliveryFee: Number(data.deliveryFee || 0),
              totalAmount: Number(data.totalAmount || 0),
              summaryText: String(data.summaryText || ''),
              createdAt:
                data.createdAt?.toDate?.()?.toISOString?.() ||
                new Date().toISOString(),
            };
          });
          setOrders(list);
        },
        (err) => {
          handleFirestoreError(
            err,
            OperationType.LIST,
            `users/${fbUser.uid}/orders`,
          );
        },
      );
    });

    return () => {
      unsubAuth();
      if (unsubBouquets) unsubBouquets();
      if (unsubOrders) unsubOrders();
    };
  }, []);

  // Persist guest or email-authenticated state to localStorage & Express backend
  const syncBackendState = useCallback(
    async (
      nextCart: CartItem[],
      nextBouquets: SavedBouquetRecord[],
      nextOrders: DagupanOrder[],
      profileUpdates?: Partial<UserAccount>,
    ) => {
      try {
        window.localStorage.setItem(
          GUEST_STATE_KEY,
          JSON.stringify({
            cart: nextCart,
            savedBouquets: nextBouquets,
            orders: nextOrders,
          }),
        );
      } catch {
        // ignore storage quota errors
      }

      if (sessionToken) {
        await fetch('/api/user/state', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            cart: nextCart,
            savedBouquets: nextBouquets,
            orders: nextOrders,
            profileUpdates,
          }),
        }).catch(() => {});
      }
    },
    [sessionToken],
  );

  // Auth Handlers
  const handleGoogleSignIn = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const handleEmailRegister = async (payload: {
    displayName: string;
    email: string;
    password: string;
    phone: string;
    barangay: string;
    streetAddress: string;
  }): Promise<UserAccount> => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    skipSessionFetchRef.current = true;
    window.localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    setSessionToken(data.token);
    setUser(data.user);
    setSelectedBarangay(data.user.barangay || 'Lucao');
    const nextBouquets = data.state?.savedBouquets || [];
    const nextOrders = data.state?.orders || [];
    setSavedBouquets(nextBouquets);
    setOrders(nextOrders);
    if (cart.length > 0) {
      fetch('/api/user/state', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.token}`,
        },
        body: JSON.stringify({
          cart,
          savedBouquets: nextBouquets,
          orders: nextOrders,
        }),
      }).catch(() => {});
    }
    return data.user as UserAccount;
  };

  const handleEmailLogin = async (
    email: string,
    password: string,
  ): Promise<UserAccount> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid credentials');
    }
    skipSessionFetchRef.current = true;
    window.localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    setSessionToken(data.token);
    setUser(data.user);
    setSelectedBarangay(data.user.barangay || 'Lucao');
    const nextBouquets = data.state?.savedBouquets || [];
    const nextOrders = data.state?.orders || [];
    const serverCart = Array.isArray(data.state?.cart) ? data.state.cart : [];
    const mergedCart = serverCart.length > 0 ? serverCart : cart;
    setCart(mergedCart);
    setSavedBouquets(nextBouquets);
    setOrders(nextOrders);
    if (serverCart.length === 0 && mergedCart.length > 0) {
      fetch('/api/user/state', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.token}`,
        },
        body: JSON.stringify({
          cart: mergedCart,
          savedBouquets: nextBouquets,
          orders: nextOrders,
        }),
      }).catch(() => {});
    }
    if (data.user?.role === 'admin') {
      await fetchAdminOverview(data.token);
    }
    return data.user as UserAccount;
  };

  const handleAdminUpdateOrderStatus = async (
    orderId: string,
    status: DagupanOrder['status'],
  ) => {
    if (!sessionToken) {
      throw new Error('Administrator session required.');
    }
    const res = await fetch(
      `/api/admin/orders/${encodeURIComponent(orderId)}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ status }),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update order status.');
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
    );
    await fetchAdminOverview(sessionToken);
  };

  const handleSignOut = async () => {
    if (firebaseUser) {
      await firebaseSignOut(auth);
    }
    if (sessionToken) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}` },
      }).catch(() => {});
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      setSessionToken(null);
    }
    setAdminOverview(null);
    setUser(GUEST_USER);
    navigate('login');
  };

  // Cart & Bouquet Actions
  const handleQuickAddCatalog = (bq: CatalogBouquet) => {
    const nextCart = [...cart];
    const existingIdx = nextCart.findIndex(
      (i) => !i.isCustom3D && i.name === bq.name && i.sizeTier === 'classic',
    );
    if (existingIdx >= 0) {
      nextCart[existingIdx] = {
        ...nextCart[existingIdx],
        quantity: nextCart[existingIdx].quantity + 1,
      };
    } else {
      nextCart.push({
        id: `cart-${bq.id}-${Date.now()}`,
        name: bq.name,
        subtitle: `Classic · ${bq.stemCount} Stems`,
        shopName: bq.shopName,
        unitPrice: bq.price,
        quantity: 1,
        image: bq.image,
        isCustom3D: false,
        sizeTier: 'classic',
      });
    }
    setCart(nextCart);
    syncBackendState(nextCart, savedBouquets, orders);
  };

  const handleAddDetailedToCart = ({
    bouquet,
    sizeTier,
    unitPrice,
    giftNote,
  }: {
    bouquet: CatalogBouquet;
    sizeTier: 'petite' | 'classic' | 'grand';
    unitPrice: number;
    giftNote: string;
  }) => {
    const nextCart = [
      ...cart,
      {
        id: `cart-${bouquet.id}-${sizeTier}-${Date.now()}`,
        name: bouquet.name,
        subtitle: `${sizeTier.toUpperCase()} · ${bouquet.shopName}`,
        shopName: bouquet.shopName,
        unitPrice,
        quantity: 1,
        image: bouquet.image,
        isCustom3D: false,
        sizeTier,
        giftNote: giftNote || undefined,
      },
    ];
    setCart(nextCart);
    syncBackendState(nextCart, savedBouquets, orders);
  };

  const handleAddCustomToCart = (config: BouquetConfig, price: number) => {
    const stemCount = getTotalStemCount(config.stems);
    const nextCart = [
      ...cart,
      {
        id: `cart-custom-${Date.now()}`,
        name: config.title || 'Custom 3D Dagupan Bouquet',
        subtitle: `Custom 3D · ${stemCount} Stems`,
        shopName: 'FloraView 3D Atelier',
        unitPrice: price,
        quantity: 1,
        customConfig: config,
        isCustom3D: true,
      },
    ];
    setCart(nextCart);
    syncBackendState(nextCart, savedBouquets, orders);
  };

  const handleUpdateCartQty = (itemId: string, delta: number) => {
    const nextCart = cart
      .map((item) =>
        item.id === itemId
          ? { ...item, quantity: item.quantity + delta }
          : item,
      )
      .filter((item) => item.quantity > 0);
    setCart(nextCart);
    syncBackendState(nextCart, savedBouquets, orders);
  };

  const handleRemoveCartItem = (itemId: string) => {
    const nextCart = cart.filter((i) => i.id !== itemId);
    setCart(nextCart);
    syncBackendState(nextCart, savedBouquets, orders);
  };

  const handleSaveCustomBouquet = async (
    config: BouquetConfig,
    totalPrice: number,
    stemCount: number,
  ) => {
    const id = `bq_${Date.now()}`;
    const record: SavedBouquetRecord = {
      id,
      title: config.title || 'Custom 3D Bouquet',
      config,
      totalPrice,
      stemCount,
      createdAt: new Date().toISOString(),
    };

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid, 'bouquets', id), {
          id,
          ownerId: firebaseUser.uid,
          title: record.title,
          petalPalette: config.petalPalette,
          wrapStyle: config.wrapStyle,
          ribbonStyle: config.ribbonStyle,
          totalPrice,
          stemCount,
          stems: config.stems,
          createdAt: serverTimestamp(),
        });
        return;
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.CREATE,
          `users/${firebaseUser.uid}/bouquets/${id}`,
        );
      }
    }

    const nextBouquets = [record, ...savedBouquets];
    setSavedBouquets(nextBouquets);
    await syncBackendState(cart, nextBouquets, orders);
  };

  const handleDeleteSavedBouquet = async (id: string) => {
    if (firebaseUser) {
      try {
        await deleteDoc(doc(db, 'users', firebaseUser.uid, 'bouquets', id));
        return;
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.DELETE,
          `users/${firebaseUser.uid}/bouquets/${id}`,
        );
      }
    }
    const nextBouquets = savedBouquets.filter((b) => b.id !== id);
    setSavedBouquets(nextBouquets);
    await syncBackendState(cart, nextBouquets, orders);
  };

  const handlePlaceOrder = async (orderPayload: {
    recipientName: string;
    recipientPhone: string;
    barangay: string;
    streetLandmark: string;
    deliverySlot: string;
    paymentMethod: string;
    subtotal: number;
    deliveryFee: number;
    totalAmount: number;
    summaryText: string;
  }): Promise<DagupanOrder> => {
    const orderId = `FV_${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: DagupanOrder = {
      id: orderId,
      ...orderPayload,
      status: 'preparing',
      createdAt: new Date().toISOString(),
    };

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid, 'orders', orderId), {
          id: orderId,
          ownerId: firebaseUser.uid,
          recipientName: orderPayload.recipientName,
          recipientPhone: orderPayload.recipientPhone,
          barangay: orderPayload.barangay,
          streetLandmark: orderPayload.streetLandmark,
          deliverySlot: orderPayload.deliverySlot,
          paymentMethod: orderPayload.paymentMethod,
          status: 'preparing',
          subtotal: orderPayload.subtotal,
          deliveryFee: orderPayload.deliveryFee,
          totalAmount: orderPayload.totalAmount,
          summaryText: orderPayload.summaryText,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.CREATE,
          `users/${firebaseUser.uid}/orders/${orderId}`,
        );
      }
    }

    const nextOrders = [newOrder, ...orders];
    setOrders(nextOrders);
    setCart([]);
    await syncBackendState([], savedBouquets, nextOrders);
    return newOrder;
  };

  const handleUpdateProfile = async (updates: {
    displayName: string;
    phone: string;
    barangay: string;
    streetAddress: string;
  }) => {
    const nextUser: UserAccount = {
      ...user,
      ...updates,
    };
    setUser(nextUser);
    setSelectedBarangay(updates.barangay);

    if (firebaseUser) {
      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          displayName: updates.displayName,
          phone: updates.phone,
          barangay: updates.barangay,
          streetAddress: updates.streetAddress,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.UPDATE,
          `users/${firebaseUser.uid}`,
        );
      }
    }

    await syncBackendState(cart, savedBouquets, orders, updates);
  };

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <MobileShell
      currentScreen={currentScreen}
      onNavigate={navigate}
      cartCount={totalCartItems}
      selectedBarangay={selectedBarangay}
      isAdmin={user.role === 'admin'}
    >
      {currentScreen === 'splash' && <SplashScreen onNavigate={navigate} />}

      {currentScreen === 'register' && (
        <RegisterScreen
          onNavigate={navigate}
          onGoogleSignIn={handleGoogleSignIn}
          onEmailRegister={handleEmailRegister}
          currentUser={user}
        />
      )}

      {currentScreen === 'login' && (
        <LoginScreen
          onNavigate={navigate}
          onEmailLogin={handleEmailLogin}
          onGoogleSignIn={handleGoogleSignIn}
        />
      )}

      {currentScreen === 'home' && (
        <HomeScreen
          user={user}
          selectedBarangay={selectedBarangay}
          onSelectBarangay={setSelectedBarangay}
          onNavigate={navigate}
          onSelectBouquet={(bq) => {
            setSelectedBouquet(bq);
            navigate('details');
          }}
          onOpenIn3D={(cfg) => {
            setCustomConfig(cfg);
            navigate('studio');
          }}
          onQuickAddCart={handleQuickAddCatalog}
          onSelectShopFilter={(shopId) => setSelectedShopFilter(shopId)}
        />
      )}

      {currentScreen === 'shops' && (
        <ShopsScreen
          selectedShopId={selectedShopFilter}
          onSelectShopId={setSelectedShopFilter}
          onSelectBouquet={(bq) => {
            setSelectedBouquet(bq);
            navigate('details');
          }}
          onOpenIn3D={(cfg) => {
            setCustomConfig(cfg);
            navigate('studio');
          }}
          onOpenInAR={(cfg) => {
            setCustomConfig(cfg);
            navigate('ar');
          }}
          onQuickAddCart={handleQuickAddCatalog}
          onNavigate={navigate}
        />
      )}

      {currentScreen === 'details' && (
        <FlowerDetailsScreen
          bouquet={selectedBouquet}
          onNavigate={navigate}
          onAddToCart={handleAddDetailedToCart}
          onOpenIn3D={(cfg) => {
            setCustomConfig(cfg);
            navigate('studio');
          }}
          onOpenInAR={(cfg) => {
            setCustomConfig(cfg);
            navigate('ar');
          }}
        />
      )}

      {currentScreen === 'studio' && (
        <CustomBouquetScreen
          config={customConfig}
          onChangeConfig={setCustomConfig}
          onNavigate={navigate}
          onAddCustomToCart={handleAddCustomToCart}
          onSaveBouquet={handleSaveCustomBouquet}
        />
      )}

      {currentScreen === 'ar' && (
        <ARVisualizationScreen
          config={customConfig}
          onSelectConfig={setCustomConfig}
          onNavigate={navigate}
          onAddCustomToCart={handleAddCustomToCart}
        />
      )}

      {currentScreen === 'cart' && (
        <CartScreen
          items={cart}
          user={user}
          selectedBarangay={selectedBarangay}
          onSelectBarangay={setSelectedBarangay}
          onUpdateQuantity={handleUpdateCartQty}
          onRemoveItem={handleRemoveCartItem}
          onPlaceOrder={handlePlaceOrder}
          onNavigate={navigate}
        />
      )}

      {currentScreen === 'profile' && (
        <ProfileScreen
          user={user}
          savedBouquets={savedBouquets}
          orders={orders}
          onNavigate={navigate}
          onUpdateProfile={handleUpdateProfile}
          onLoadBouquetIn3D={(cfg) => {
            setCustomConfig(cfg);
            navigate('studio');
          }}
          onLoadBouquetInAR={(cfg) => {
            setCustomConfig(cfg);
            navigate('ar');
          }}
          onDeleteSavedBouquet={handleDeleteSavedBouquet}
          onSignOut={handleSignOut}
        />
      )}

      {currentScreen === 'admin' && (
        <AdminScreen
          user={user}
          overview={adminOverview}
          loading={adminLoading}
          error={adminError}
          onRefresh={() => fetchAdminOverview()}
          onUpdateOrderStatus={handleAdminUpdateOrderStatus}
          onNavigate={navigate}
          onOpenBouquetInStudio={(cfg) => {
            setCustomConfig(cfg);
            navigate('studio');
          }}
          onSignOut={handleSignOut}
        />
      )}
    </MobileShell>
  );
}

