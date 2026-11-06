import React, { useMemo, useState } from 'react';
import {
  Box,
  CheckCircle2,
  LogOut,
  MapPin,
  Package,
  RefreshCw,
  ShieldCheck,
  Store,
  Truck,
  Users,
} from 'lucide-react';
import { CATALOG_BOUQUETS, DAGUPAN_SHOPS } from '../data/dagupanCatalog';
import {
  AdminOverviewPayload,
  BouquetConfig,
  DagupanOrder,
  ScreenId,
  UserAccount,
} from '../types/floraview';

interface AdminScreenProps {
  user: UserAccount;
  overview: AdminOverviewPayload | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  onUpdateOrderStatus: (
    orderId: string,
    status: DagupanOrder['status'],
  ) => Promise<void>;
  onNavigate: (screen: ScreenId) => void;
  onOpenBouquetInStudio: (config: BouquetConfig) => void;
  onSignOut: () => Promise<void>;
}

type AdminSection = 'orders' | 'catalog' | 'customers';
type OrderStatusFilter = 'all' | 'preparing' | 'out_for_delivery' | 'delivered';

export const AdminScreen: React.FC<AdminScreenProps> = ({
  user,
  overview,
  loading,
  error,
  onRefresh,
  onUpdateOrderStatus,
  onNavigate,
  onOpenBouquetInStudio,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<AdminSection>('orders');
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isAdmin = user.role === 'admin';

  const filteredOrders = useMemo(() => {
    const list = overview?.orders || [];
    if (statusFilter === 'all') return list;
    return list.filter((ord) => ord.status === statusFilter);
  }, [overview?.orders, statusFilter]);

  const handleStatusChange = async (
    orderId: string,
    nextStatus: DagupanOrder['status'],
  ) => {
    setActionError(null);
    setUpdatingOrderId(orderId);
    try {
      await onUpdateOrderStatus(orderId, nextStatus);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to update order status.',
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <section className="rounded-2xl bg-white border border-[#E4E2DC] p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-xs font-medium text-[#B8294B]">
            <ShieldCheck className="w-4 h-4" />
            <span>Administrator Authorization Required</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#16211B]">
            Dagupan Atelier Admin Desk
          </h1>
          <p className="text-sm text-[#536159]">
            Sign in with your administrator credentials on the Log In page to manage Dagupan City bouquet dispatch orders and catalog operations.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#1B4332] text-white text-sm font-semibold cursor-pointer"
            >
              Go to Log In Page
            </button>
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#F1F0EC] text-[#16211B] text-sm font-semibold cursor-pointer"
            >
              Return Home
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 pb-12 space-y-6 sm:space-y-8">
      {/* Top Atelier Operations Header */}
      <section className="rounded-2xl bg-white border border-[#E4E2DC] p-4 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#16211B] text-[#E8D5B5] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-[#536159]">
              <span className="font-semibold text-[#1B4332]">Atelier Operations</span>
              <span aria-hidden="true">·</span>
              <span>Dagupan Dispatch</span>
            </div>
            <h1 className="font-serif text-xl sm:text-3xl font-bold text-[#16211B] mt-0.5 truncate">
              {user.displayName}
            </h1>
            <p className="text-xs font-mono text-[#536159] truncate">
              Signed in as {user.email} · {user.barangay}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={() => onRefresh()}
            className="min-h-[44px] px-2.5 sm:px-4 py-2 rounded-xl bg-[#F1F0EC] text-[#16211B] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#E7E5DF] cursor-pointer disabled:opacity-60 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="min-h-[44px] px-2.5 sm:px-4 py-2 rounded-xl bg-[#1B4332] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#143326] cursor-pointer whitespace-nowrap"
          >
            <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Storefront</span>
          </button>

          <button
            type="button"
            onClick={() => onSignOut()}
            className="min-h-[44px] px-2.5 sm:px-4 py-2 rounded-xl border border-[#D5D2CA] text-[#16211B] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#F1F0EC] cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </section>

      {(error || actionError) && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-[#FDF2F4] border border-[#F3C6D0] text-xs font-medium text-[#8E1F3A]"
        >
          {actionError || error}
        </div>
      )}

      {/* 4-Column Typographic KPI Ledger */}
      <section
        aria-label="Dagupan Atelier Key Metrics"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        <div className="rounded-2xl bg-white border border-[#E4E2DC] p-4 sm:p-5">
          <p className="text-xs font-medium text-[#536159]">Dagupan Revenue</p>
          <p className="mt-1.5 sm:mt-2 font-serif text-2xl sm:text-3xl font-bold text-[#16211B] tabular-nums">
            ₱{(overview?.totalRevenue ?? 0).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-[#536159]">
            Across {(overview?.orders || []).length} orders
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-[#E4E2DC] p-4 sm:p-5">
          <p className="text-xs font-medium text-[#536159]">Active Dispatch</p>
          <p className="mt-1.5 sm:mt-2 font-serif text-2xl sm:text-3xl font-bold text-[#B8294B] tabular-nums">
            {overview?.activeOrdersCount ?? 0}
          </p>
          <p className="mt-1 text-xs text-[#536159]">
            Preparing &amp; in transit
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-[#E4E2DC] p-4 sm:p-5">
          <p className="text-xs font-medium text-[#536159]">Delivered Bouquets</p>
          <p className="mt-1.5 sm:mt-2 font-serif text-2xl sm:text-3xl font-bold text-[#1B4332] tabular-nums">
            {overview?.deliveredOrdersCount ?? 0}
          </p>
          <p className="mt-1 text-xs text-[#536159]">
            Fulfilled across Pangasinan
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-[#E4E2DC] p-4 sm:p-5">
          <p className="text-xs font-medium text-[#536159]">Customers</p>
          <p className="mt-1.5 sm:mt-2 font-serif text-2xl sm:text-3xl font-bold text-[#16211B] tabular-nums">
            {overview?.totalCustomersCount ?? 0}
          </p>
          <p className="mt-1 text-xs text-[#536159]">
            {overview?.totalSavedBouquetsCount ?? 0} saved 3D recipes
          </p>
        </div>
      </section>

      {/* Editorial Underline Navigation Tabs */}
      <div className="border-b border-[#E4E2DC] flex items-center gap-4 sm:gap-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`min-h-[44px] pb-2 border-b-2 text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'orders'
              ? 'border-[#1B4332] text-[#16211B]'
              : 'border-transparent text-[#536159] hover:text-[#16211B]'
          }`}
        >
          Dispatch Queue ({overview?.orders.length ?? 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`min-h-[44px] pb-2 border-b-2 text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'catalog'
              ? 'border-[#1B4332] text-[#16211B]'
              : 'border-transparent text-[#536159] hover:text-[#16211B]'
          }`}
        >
          Ateliers &amp; Catalog ({CATALOG_BOUQUETS.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('customers')}
          className={`min-h-[44px] pb-2 border-b-2 text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'customers'
              ? 'border-[#1B4332] text-[#16211B]'
              : 'border-transparent text-[#536159] hover:text-[#16211B]'
          }`}
        >
          Customers ({overview?.customers.length ?? 0})
        </button>
      </div>

      {/* TAB 1: DAGUPAN ORDER DISPATCH QUEUE */}
      {activeTab === 'orders' && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#16211B]">
                Dagupan Rider Dispatch Queue
              </h2>
              <p className="text-xs text-[#536159]">
                Update fulfillment stages as bouquets move from floral preparation to chilled rider delivery.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'all', label: 'All Orders' },
                  { id: 'preparing', label: 'Preparing' },
                  { id: 'out_for_delivery', label: 'Out for Delivery' },
                  { id: 'delivered', label: 'Delivered' },
                ] as const
              ).map((flt) => (
                <button
                  key={flt.id}
                  type="button"
                  onClick={() => setStatusFilter(flt.id)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    statusFilter === flt.id
                      ? 'bg-[#1B4332] text-white'
                      : 'bg-white border border-[#E4E2DC] text-[#536159] hover:text-[#16211B]'
                  }`}
                >
                  {flt.label}
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl bg-white border border-[#E4E2DC] p-8 text-center text-sm text-[#536159]">
              No Dagupan orders match this filter yet.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((ord) => {
                const isUpdating = updatingOrderId === ord.id;
                const statusLabel =
                  ord.status === 'delivered'
                    ? 'Delivered'
                    : ord.status === 'out_for_delivery'
                      ? 'Out for Delivery'
                      : 'Preparing';
                const statusColor =
                  ord.status === 'delivered'
                    ? 'text-[#1B4332]'
                    : ord.status === 'out_for_delivery'
                      ? 'text-[#B8294B]'
                      : 'text-[#536159]';

                return (
                  <article
                    key={`${ord.ownerUid}-${ord.id}`}
                    className="rounded-2xl bg-white border border-[#E4E2DC] p-5 sm:p-6 space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-[#16211B]">
                            #{ord.id}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className={`font-semibold ${statusColor}`}>
                            {statusLabel}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#536159]">
                            {ord.deliverySlot}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#536159]">
                            {ord.paymentMethod}
                          </span>
                        </div>
                        <h3 className="font-serif text-lg font-bold text-[#16211B]">
                          {ord.summaryText}
                        </h3>
                      </div>

                      <div className="text-right">
                        <p className="font-mono text-lg font-bold text-[#16211B] tabular-nums">
                          ₱{Number(ord.totalAmount || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-[#536159]">
                          Account: {ord.customerName}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-[#F1F0EC] text-xs text-[#536159]">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-[#B8294B] shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-[#16211B]">
                            Brgy. {ord.barangay} · {ord.recipientName}
                          </p>
                          <p>{ord.streetLandmark}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-start md:justify-end gap-2">
                        {ord.status !== 'out_for_delivery' && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              handleStatusChange(ord.id, 'out_for_delivery')
                            }
                            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1B4332] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#143326] cursor-pointer disabled:opacity-60"
                          >
                            <Truck className="w-4 h-4" />
                            <span>Mark Out for Delivery</span>
                          </button>
                        )}

                        {ord.status !== 'delivered' && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleStatusChange(ord.id, 'delivered')}
                            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#F1F0EC] text-[#16211B] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#E4E2DC] cursor-pointer disabled:opacity-60"
                          >
                            <CheckCircle2 className="w-4 h-4 text-[#1B4332]" />
                            <span>Mark Delivered</span>
                          </button>
                        )}

                        {ord.status === 'delivered' && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleStatusChange(ord.id, 'preparing')}
                            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D5D2CA] text-[#536159] text-xs font-semibold hover:text-[#16211B] cursor-pointer disabled:opacity-60"
                          >
                            Reopen Dispatch
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: PARTNER FLORIST ATELIERS & CATALOG BOUQUETS */}
      {activeTab === 'catalog' && (
        <section className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-[#1B4332]" />
              <h2 className="font-serif text-2xl font-bold text-[#16211B]">
                Dagupan Partner Florist Ateliers ({DAGUPAN_SHOPS.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DAGUPAN_SHOPS.map((shop) => (
                <div
                  key={shop.id}
                  className="rounded-2xl bg-white border border-[#E4E2DC] p-5 flex items-start justify-between gap-4"
                >
                  <div>
                    <p className="text-xs font-medium text-[#B8294B]">
                      Brgy. {shop.barangay} · {shop.deliveryEtaMin} min dispatch
                    </p>
                    <h3 className="font-serif text-lg font-bold text-[#16211B] mt-0.5">
                      {shop.name}
                    </h3>
                    <p className="text-xs text-[#536159] mt-1">{shop.street}</p>
                    <p className="text-xs text-[#16211B] mt-2 font-medium">
                      Specialty: {shop.specialty}
                    </p>
                  </div>
                  <div className="text-right font-mono text-xs font-bold text-[#16211B] shrink-0">
                    ★ {shop.rating.toFixed(1)}
                    <p className="font-normal text-[#536159]">
                      ({shop.reviewCount})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#B8294B]" />
              <h2 className="font-serif text-2xl font-bold text-[#16211B]">
                Active Bouquet Catalog ({CATALOG_BOUQUETS.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CATALOG_BOUQUETS.map((bq) => (
                <article
                  key={bq.id}
                  className="rounded-2xl bg-white border border-[#E4E2DC] p-4 flex flex-col justify-between gap-4"
                >
                  <div>
                    <p className="text-xs text-[#536159]">{bq.shopName}</p>
                    <h3 className="font-serif text-lg font-bold text-[#16211B] mt-0.5">
                      {bq.name}
                    </h3>
                    <p className="mt-1 font-mono text-xs text-[#536159] tabular-nums">
                      {bq.stemCount} Stems · {bq.vaseLifeDays}d vase life
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#F1F0EC] flex items-center justify-between gap-2">
                    <span className="font-mono text-base font-bold text-[#16211B] tabular-nums">
                      ₱{bq.price.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenBouquetInStudio(bq.defaultConfig)}
                      className="min-h-[40px] px-3 rounded-xl bg-[#F1F0EC] text-[#16211B] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#E4E2DC] cursor-pointer"
                    >
                      <Box className="w-3.5 h-3.5" />
                      <span>3D Inspect</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: REGISTERED DAGUPAN CUSTOMERS */}
      {activeTab === 'customers' && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#1B4332]" />
            <h2 className="font-serif text-2xl font-bold text-[#16211B]">
              Dagupan City Customer Directory
            </h2>
          </div>

          {!overview || overview.customers.length === 0 ? (
            <div className="rounded-2xl bg-white border border-[#E4E2DC] p-8 text-center text-sm text-[#536159]">
              No registered customers found yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {overview.customers.map((cust) => (
                <article
                  key={cust.uid}
                  className="rounded-2xl bg-white border border-[#E4E2DC] p-5 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-[#16211B]">
                        {cust.displayName}
                      </h3>
                      <p className="text-xs font-mono text-[#536159]">
                        {cust.email} · {cust.phone}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-bold text-[#1B4332] tabular-nums">
                      ₱{cust.totalSpent.toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-[#536159]">
                    Brgy. {cust.barangay} — {cust.streetAddress}
                  </p>

                  <div className="pt-2 border-t border-[#F1F0EC] flex items-center gap-4 text-xs font-mono text-[#16211B]">
                    <span>{cust.orderCount} Orders</span>
                    <span aria-hidden="true">·</span>
                    <span>{cust.savedBouquetCount} Saved 3D Designs</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
