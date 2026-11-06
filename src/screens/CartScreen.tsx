import React, { useEffect, useState } from 'react';
import {
  Box,
  CheckCircle2,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
} from 'lucide-react';
import { DAGUPAN_BARANGAYS, FLOWER_SPECIES } from '../data/dagupanCatalog';
import {
  CartItem,
  DagupanOrder,
  ScreenId,
  UserAccount,
} from '../types/floraview';
import { ResilientImage } from '../components/ResilientImage';

interface CartScreenProps {
  items: CartItem[];
  user: UserAccount;
  selectedBarangay: string;
  onSelectBarangay: (barangay: string) => void;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onPlaceOrder: (orderPayload: {
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
  }) => Promise<DagupanOrder>;
  onNavigate: (screen: ScreenId) => void;
}

const DELIVERY_SLOTS = [
  'Express 90-Min Rider',
  'Morning (9:00 AM – 12:00 PM)',
  'Afternoon (1:00 PM – 5:00 PM)',
  'Evening (5:00 PM – 8:00 PM)',
];

const PAYMENT_METHODS = ['GCash', 'Maya', 'Cash on Delivery (COD)', 'Card'];

export const CartScreen: React.FC<CartScreenProps> = ({
  items,
  user,
  selectedBarangay,
  onSelectBarangay,
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
  onNavigate,
}) => {
  const [recipientName, setRecipientName] = useState(
    user.provider !== 'guest' ? user.displayName : '',
  );
  const [recipientPhone, setRecipientPhone] = useState(
    user.phone || '+63 917 ',
  );
  const [streetLandmark, setStreetLandmark] = useState(
    user.streetAddress || '',
  );
  const [deliverySlot, setDeliverySlot] = useState(DELIVERY_SLOTS[0]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<DagupanOrder | null>(null);

  useEffect(() => {
    if (user.provider !== 'guest') {
      setRecipientName((prev) => prev || user.displayName);
      setRecipientPhone((prev) => (prev === '+63 917 ' || !prev ? user.phone : prev));
      setStreetLandmark((prev) => prev || user.streetAddress);
    }
  }, [user.uid, user.provider, user.displayName, user.phone, user.streetAddress]);

  const barangayInfo =
    DAGUPAN_BARANGAYS.find((b) => b.name === selectedBarangay) ||
    DAGUPAN_BARANGAYS[1];

  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const freeDeliveryThreshold = 2000;
  const deliveryFee =
    items.length === 0 || subtotal >= freeDeliveryThreshold
      ? 0
      : barangayInfo.deliveryFee;
  const totalAmount = subtotal + deliveryFee;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (items.length === 0) return;
    if (!recipientName.trim() || !recipientPhone.trim() || !streetLandmark.trim()) {
      setError('Please enter recipient name, mobile number, and Dagupan street/landmark.');
      return;
    }

    const summaryText = items
      .map((it) => `${it.quantity}x ${it.name}`)
      .join(', ')
      .slice(0, 280);

    setSubmitting(true);
    try {
      const order = await onPlaceOrder({
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        barangay: selectedBarangay,
        streetLandmark: streetLandmark.trim(),
        deliverySlot,
        paymentMethod,
        subtotal,
        deliveryFee,
        totalAmount,
        summaryText,
      });
      setConfirmedOrder(order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="rounded-2xl bg-white border border-[#E4E2DC] p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#1B4332] text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-mono text-[#1B4332] font-semibold">
                Order #{confirmedOrder.id} Confirmed
              </p>
              <h1 className="font-serif text-3xl font-bold text-[#16211B] mt-0.5">
                Preparing Your Dagupan Bouquet
              </h1>
              <p className="text-sm text-[#536159] mt-1">
                Our florists are hand-tying your stems for delivery to Brgy.{' '}
                {confirmedOrder.barangay}.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF9F7] border border-[#E4E2DC] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#536159]">Recipient</span>
              <span className="font-semibold text-[#16211B]">
                {confirmedOrder.recipientName} ({confirmedOrder.recipientPhone})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#536159]">Dagupan Address</span>
              <span className="font-semibold text-[#16211B] text-right max-w-[65%]">
                {confirmedOrder.streetLandmark}, Brgy. {confirmedOrder.barangay}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#536159]">Rider Window</span>
              <span className="font-semibold text-[#16211B]">
                {confirmedOrder.deliverySlot}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#536159]">Payment</span>
              <span className="font-semibold text-[#16211B]">
                {confirmedOrder.paymentMethod}
              </span>
            </div>
            <div className="pt-2 border-t border-[#E4E2DC] flex justify-between text-sm">
              <span className="font-semibold text-[#16211B]">Total Paid</span>
              <span className="font-mono tabular-nums font-bold text-[#1B4332]">
                ₱{confirmedOrder.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                setConfirmedOrder(null);
                onNavigate('profile');
              }}
              className="min-h-[48px] flex-1 px-5 py-3 rounded-xl bg-[#1B4332] text-white text-sm font-semibold cursor-pointer"
            >
              Track in Profile Orders
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmedOrder(null);
                onNavigate('home');
              }}
              className="min-h-[48px] px-5 py-3 rounded-xl bg-[#F1F0EC] text-[#16211B] text-sm font-semibold cursor-pointer"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-12 space-y-6">
      <div className="pb-4 border-b border-[#E4E2DC] flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#B8294B]">
            Dagupan City Same-Day Dispatch
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#16211B] mt-0.5">
            Your Bouquet Cart
          </h1>
        </div>
        <span className="font-mono tabular-nums text-xs text-[#536159]">
          {items.reduce((acc, i) => acc + i.quantity, 0)} Items
        </span>
      </div>

      {items.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white border border-[#E4E2DC] text-center max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F1F0EC] text-[#1B4332] flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#16211B]">
            Your floral bag is empty
          </h2>
          <p className="text-sm text-[#536159]">
            Browse freshly cut arrangements from Dagupan City florists or compose your own 3D bouquet.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('shops')}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-[#1B4332] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Store className="w-4 h-4" />
              <span>Browse Dagupan Shops</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('studio')}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-[#F1F0EC] text-[#16211B] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Box className="w-4 h-4" />
              <span>Open 3D Bouquet Studio</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Itemized Cart List */}
          <div className="lg:col-span-7 space-y-4">
            {items.map((item) => {
              const customStemSummary = item.customConfig
                ? FLOWER_SPECIES.map((sp) => ({
                    name: sp.name,
                    qty: item.customConfig?.stems[sp.id] || 0,
                  }))
                    .filter((x) => x.qty > 0)
                    .map((x) => `${x.qty}x ${x.name}`)
                    .join(' · ')
                : null;

              return (
                <article
                  key={item.id}
                  className="rounded-2xl bg-white border border-[#E4E2DC] p-4 sm:p-5 flex gap-4 items-start"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#F1F0EC] shrink-0 flex items-center justify-center">
                    {item.image ? (
                      <ResilientImage
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Box className="w-7 h-7 text-[#1B4332]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-[#536159]">
                          {item.shopName}
                          {item.sizeTier ? ` · ${item.sizeTier.toUpperCase()}` : ''}
                        </p>
                        <h2 className="font-serif text-lg sm:text-xl font-bold text-[#16211B] leading-snug">
                          {item.name}
                        </h2>
                      </div>

                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => onRemoveItem(item.id)}
                        className="min-w-[40px] min-h-[40px] rounded-lg text-[#536159] hover:text-[#B8294B] flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {customStemSummary && (
                      <p className="mt-1 text-xs text-[#536159] leading-relaxed">
                        {customStemSummary}
                      </p>
                    )}

                    {item.giftNote && (
                      <p className="mt-1 text-xs italic text-[#1B4332]">
                        Card: &ldquo;{item.giftNote}&rdquo;
                      </p>
                    )}

                    <div className="mt-3 pt-2.5 border-t border-[#F1F0EC] flex items-center justify-between gap-2">
                      <span className="font-mono tabular-nums text-sm font-bold text-[#16211B]">
                        ₱{(item.unitPrice * item.quantity).toLocaleString()}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-label={`Decrease quantity for ${item.name}`}
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="min-w-[40px] min-h-[40px] rounded-lg bg-[#F1F0EC] text-[#16211B] flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center font-mono tabular-nums text-xs font-bold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase quantity for ${item.name}`}
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="min-w-[40px] min-h-[40px] rounded-lg bg-[#1B4332] text-white flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Right Dagupan City Checkout Form */}
          <form
            onSubmit={handleCheckout}
            className="lg:col-span-5 rounded-2xl bg-white border border-[#E4E2DC] p-5 sm:p-6 space-y-4"
          >
            <h2 className="font-serif text-2xl font-bold text-[#16211B]">
              Dagupan City Delivery Details
            </h2>

            {error && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-[#FDF2F4] border border-[#F3C6D0] text-xs font-medium text-[#8E1F3A]"
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="checkout-barangay"
                className="block text-xs font-semibold text-[#16211B] mb-1.5"
              >
                Dagupan Barangay
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#B8294B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="checkout-barangay"
                  value={selectedBarangay}
                  onChange={(e) => onSelectBarangay(e.target.value)}
                  className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl bg-[#FAF9F7] border border-[#D5D2CA] text-sm text-[#16211B] focus:outline-none focus:border-[#1B4332]"
                >
                  {DAGUPAN_BARANGAYS.map((b) => (
                    <option key={b.name} value={b.name}>
                      Brgy. {b.name} ({b.zone} · ₱{b.deliveryFee})
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-[11px] text-[#536159]">
                {barangayInfo.landmark} · Est. {barangayInfo.etaMinutes} min rider dispatch
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="checkout-name"
                  className="block text-xs font-semibold text-[#16211B] mb-1.5"
                >
                  Recipient Name
                </label>
                <input
                  id="checkout-name"
                  type="text"
                  required
                  placeholder="Full name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF9F7] border border-[#D5D2CA] text-sm text-[#16211B] focus:outline-none focus:border-[#1B4332]"
                />
              </div>

              <div>
                <label
                  htmlFor="checkout-phone"
                  className="block text-xs font-semibold text-[#16211B] mb-1.5"
                >
                  Mobile Number
                </label>
                <input
                  id="checkout-phone"
                  type="tel"
                  required
                  placeholder="+63 917 842 3910"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF9F7] border border-[#D5D2CA] text-sm text-[#16211B] focus:outline-none focus:border-[#1B4332]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="checkout-street"
                className="block text-xs font-semibold text-[#16211B] mb-1.5"
              >
                House / Building & Landmark
              </label>
              <input
                id="checkout-street"
                type="text"
                required
                placeholder="e.g., 142 A.B. Fernandez Ave, near Nepo Mall"
                value={streetLandmark}
                onChange={(e) => setStreetLandmark(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF9F7] border border-[#D5D2CA] text-sm text-[#16211B] focus:outline-none focus:border-[#1B4332]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="checkout-slot"
                  className="block text-xs font-semibold text-[#16211B] mb-1.5"
                >
                  Delivery Window
                </label>
                <select
                  id="checkout-slot"
                  value={deliverySlot}
                  onChange={(e) => setDeliverySlot(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#FAF9F7] border border-[#D5D2CA] text-xs font-medium text-[#16211B] focus:outline-none focus:border-[#1B4332]"
                >
                  {DELIVERY_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="checkout-payment"
                  className="block text-xs font-semibold text-[#16211B] mb-1.5"
                >
                  Payment Method
                </label>
                <select
                  id="checkout-payment"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#FAF9F7] border border-[#D5D2CA] text-xs font-medium text-[#16211B] focus:outline-none focus:border-[#1B4332]"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm} value={pm}>
                      {pm}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Order Totals */}
            <div className="pt-4 border-t border-[#E4E2DC] space-y-2 text-xs">
              <div className="flex justify-between text-[#536159]">
                <span>Bouquet Subtotal</span>
                <span className="font-mono tabular-nums text-[#16211B]">
                  ₱{subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[#536159]">
                <span>
                  Rider Fee (Brgy. {selectedBarangay})
                </span>
                <span className="font-mono tabular-nums text-[#16211B]">
                  {deliveryFee === 0 ? 'FREE' : `₱${deliveryFee}`}
                </span>
              </div>
              {subtotal < freeDeliveryThreshold && (
                <p className="text-[11px] text-[#1B4332]">
                  Add ₱{(freeDeliveryThreshold - subtotal).toLocaleString()} more for free Dagupan rider delivery.
                </p>
              )}
              <div className="pt-2 border-t border-[#E4E2DC] flex justify-between text-base font-bold text-[#16211B]">
                <span>Total</span>
                <span className="font-mono tabular-nums">
                  ₱{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#143326] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
            >
              {submitting
                ? 'Confirming Dagupan Order...'
                : `Place Order · ₱${totalAmount.toLocaleString()}`}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
