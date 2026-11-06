export type ScreenId =
  | 'splash'
  | 'register'
  | 'home'
  | 'shops'
  | 'details'
  | 'studio'
  | 'ar'
  | 'cart'
  | 'profile'
  | 'login'
  | 'admin';

export type FlowerSpeciesId =
  | 'rose'
  | 'sunflower'
  | 'stargazer'
  | 'orchid'
  | 'sampaguita'
  | 'eucalyptus';

export type PetalPaletteId =
  | 'crimson'
  | 'blush'
  | 'solar'
  | 'ivory'
  | 'lavender'
  | 'sunset';

export type WrapStyleId =
  | 'kraft_linen'
  | 'ivory_silk'
  | 'sage_botanical'
  | 'charcoal_velvet'
  | 'blush_organza';

export type RibbonStyleId =
  | 'champagne'
  | 'burgundy'
  | 'emerald'
  | 'gold';

export interface BouquetConfig {
  title: string;
  stems: Record<FlowerSpeciesId, number>;
  petalPalette: PetalPaletteId;
  wrapStyle: WrapStyleId;
  ribbonStyle: RibbonStyleId;
}

export interface FlowerSpeciesInfo {
  id: FlowerSpeciesId;
  name: string;
  localName: string;
  origin: string;
  unitPrice: number;
  meaning: string;
  defaultColor: string;
}

export interface PetalPaletteInfo {
  id: PetalPaletteId;
  name: string;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
}

export interface WrapStyleInfo {
  id: WrapStyleId;
  name: string;
  materialNote: string;
  primaryHex: string;
  secondaryHex: string;
  price: number;
}

export interface RibbonStyleInfo {
  id: RibbonStyleId;
  name: string;
  hex: string;
  finish: string;
}

export interface FloristShop {
  id: string;
  name: string;
  barangay: string;
  street: string;
  rating: number;
  reviewCount: number;
  deliveryEtaMin: number;
  specialty: string;
  distanceKm: number;
  image: string;
}

export interface CatalogBouquet {
  id: string;
  name: string;
  shopId: string;
  shopName: string;
  barangay: string;
  category: 'signature' | 'single_stems' | 'tropical_native' | 'dried_preserved';
  occasion: 'romance' | 'sampaguita' | 'sympathy' | 'fiesta';
  price: number;
  rating: number;
  stemCount: number;
  vaseLifeDays: number;
  fragrance: string;
  description: string;
  careTip: string;
  image: string;
  defaultConfig: BouquetConfig;
}

export interface CartItem {
  id: string;
  name: string;
  subtitle: string;
  shopName: string;
  unitPrice: number;
  quantity: number;
  image?: string;
  customConfig?: BouquetConfig;
  isCustom3D: boolean;
  sizeTier?: 'petite' | 'classic' | 'grand';
  giftNote?: string;
}

export interface DagupanOrder {
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

export interface SavedBouquetRecord {
  id: string;
  title: string;
  config: BouquetConfig;
  totalPrice: number;
  stemCount: number;
  createdAt: string;
}

export interface UserAccount {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  barangay: string;
  streetAddress: string;
  provider: 'google' | 'email' | 'guest';
  role?: 'customer' | 'admin';
}

export interface DagupanBarangay {
  name: string;
  zone: string;
  deliveryFee: number;
  etaMinutes: number;
  landmark: string;
}

export interface AdminOrderRecord extends DagupanOrder {
  ownerUid: string;
  customerName: string;
  customerEmail: string;
}

export interface AdminCustomerSummary {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  barangay: string;
  streetAddress: string;
  role: 'customer' | 'admin';
  orderCount: number;
  savedBouquetCount: number;
  totalSpent: number;
  createdAt: string;
}

export interface AdminOverviewPayload {
  totalRevenue: number;
  activeOrdersCount: number;
  deliveredOrdersCount: number;
  totalCustomersCount: number;
  totalSavedBouquetsCount: number;
  orders: AdminOrderRecord[];
  customers: AdminCustomerSummary[];
}
