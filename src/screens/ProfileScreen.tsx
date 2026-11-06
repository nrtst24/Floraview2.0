import React from 'react';
import {
  Box,
  Camera,
  LogIn,
  LogOut,
  Package,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  UserPlus,
} from 'lucide-react';
import {
  BouquetConfig,
  DagupanOrder,
  SavedBouquetRecord,
  ScreenId,
  UserAccount,
} from '../types/floraview';

interface ProfileScreenProps {
  user: UserAccount;
  savedBouquets: SavedBouquetRecord[];
  orders: DagupanOrder[];
  onNavigate: (screen: ScreenId) => void;
  onUpdateProfile?: (updates: {
    displayName: string;
    phone: string;
    barangay: string;
    streetAddress: string;
  }) => Promise<void>;
  onLoadBouquetIn3D: (config: BouquetConfig) => void;
  onLoadBouquetInAR: (config: BouquetConfig) => void;
  onDeleteSavedBouquet: (id: string) => Promise<void>;
  onSignOut: () => Promise<void>;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  savedBouquets,
  orders,
  onNavigate,
  onLoadBouquetIn3D,
  onLoadBouquetInAR,
  onDeleteSavedBouquet,
  onSignOut,
}) => {

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-12 space-y-8">
      {/* Top Customer Account Card */}
      <section className="rounded-2xl bg-white border border-[#E4E2DC] p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1B4332] text-white flex items-center justify-center shrink-0">
            <User className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-[#536159]">
              <span>
                {user.provider === 'google'
                  ? 'Google Verified Account'
                  : user.provider === 'email'
                    ? 'FloraView Member'
                    : 'Guest Session'}
              </span>
              <span aria-hidden="true">·</span>
              <span>Brgy. {user.barangay}, Dagupan City</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#16211B] mt-0.5">
              {user.displayName}
            </h1>
            <p className="text-xs font-mono text-[#536159]">{user.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {user.provider === 'guest' ? (
            <>
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1B4332] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In Page</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#F1F0EC] text-[#16211B] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register Account</span>
              </button>
            </>
          ) : (
            <>
              {user.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => onNavigate('admin')}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#16211B] text-[#E8D5B5] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Atelier</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#F1F0EC] text-[#16211B] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Switch Account</span>
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D5D2CA] text-[#16211B] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#F1F0EC] cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </>
          )}
        </div>
      </section>

      {/* Saved Custom 3D Bouquets & Dagupan Order History */}
      <div className="space-y-8">
        {/* Saved Custom 3D Bouquets */}
        <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#B8294B]" />
                <h2 className="font-serif text-2xl font-bold text-[#16211B]">
                  Saved 3D Bouquet Designs ({savedBouquets.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('studio')}
                className="min-h-[40px] px-3.5 rounded-xl bg-[#1B4332] text-white text-xs font-semibold cursor-pointer"
              >
                + New 3D Design
              </button>
            </div>

            {savedBouquets.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-[#E4E2DC] text-sm text-[#536159]">
                No custom 3D bouquets saved yet. Open the 3D Bouquet Studio and tap Save.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedBouquets.map((sb) => (
                  <article
                    key={sb.id}
                    className="rounded-2xl bg-white border border-[#E4E2DC] p-4 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-serif text-lg font-bold text-[#16211B]">
                          {sb.title}
                        </h3>
                        <button
                          type="button"
                          aria-label={`Delete ${sb.title}`}
                          onClick={() => onDeleteSavedBouquet(sb.id)}
                          className="min-w-[36px] min-h-[36px] text-[#536159] hover:text-[#B8294B] flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs font-mono tabular-nums text-[#536159] mt-1">
                        {sb.stemCount} Stems · ₱{sb.totalPrice.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[#F1F0EC]">
                      <button
                        type="button"
                        onClick={() => onLoadBouquetIn3D(sb.config)}
                        className="flex-1 min-h-[40px] px-3 rounded-xl bg-[#1B4332] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Box className="w-3.5 h-3.5" />
                        <span>Open 3D</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onLoadBouquetInAR(sb.config)}
                        className="flex-1 min-h-[40px] px-3 rounded-xl bg-[#F1F0EC] text-[#16211B] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>AR View</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Dagupan Order History */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#1B4332]" />
              <h2 className="font-serif text-2xl font-bold text-[#16211B]">
                Dagupan Order History ({orders.length})
              </h2>
            </div>

            {orders.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-[#E4E2DC] text-sm text-[#536159]">
                You haven&apos;t placed any Dagupan City orders yet.
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((ord) => (
                  <article
                    key={ord.id}
                    className="rounded-2xl bg-white border border-[#E4E2DC] p-4 sm:p-5 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono tabular-nums text-xs font-bold text-[#16211B]">
                          Order #{ord.id}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-xs font-semibold text-[#1B4332]">
                          {ord.status === 'delivered'
                            ? 'Delivered'
                            : ord.status === 'out_for_delivery'
                              ? 'Out for Delivery'
                              : 'Preparing'}
                        </span>
                      </div>
                      <span className="font-mono tabular-nums text-sm font-bold text-[#16211B]">
                        ₱{ord.totalAmount.toLocaleString()}
                      </span>
                    </div>

                    <p className="text-sm text-[#16211B] font-medium">
                      {ord.summaryText}
                    </p>

                    <div className="text-xs text-[#536159] flex flex-wrap items-center gap-2">
                      <span>
                        To: {ord.recipientName} · Brgy. {ord.barangay}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{ord.paymentMethod}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
      </div>
    </div>
  );
};
