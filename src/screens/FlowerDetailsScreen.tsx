import React, { useState } from 'react';
import {
  ArrowLeft,
  Box,
  Camera,
  Check,
  Clock,
  Droplets,
  MapPin,
  ShoppingBag,
  Sparkles,
  Star,
} from 'lucide-react';
import { FLOWER_SPECIES } from '../data/dagupanCatalog';
import { BouquetConfig, CatalogBouquet, ScreenId } from '../types/floraview';
import { ResilientImage } from '../components/ResilientImage';
import { ThreeBouquetCanvas } from '../components/ThreeBouquetCanvas';

interface FlowerDetailsScreenProps {
  bouquet: CatalogBouquet;
  onNavigate: (screen: ScreenId) => void;
  onAddToCart: (payload: {
    bouquet: CatalogBouquet;
    sizeTier: 'petite' | 'classic' | 'grand';
    unitPrice: number;
    giftNote: string;
  }) => void;
  onOpenIn3D: (config: BouquetConfig) => void;
  onOpenInAR: (config: BouquetConfig) => void;
}

const SIZE_TIERS: Array<{
  id: 'petite' | 'classic' | 'grand';
  label: string;
  multiplier: number;
  stemNote: string;
}> = [
  { id: 'petite', label: 'Petite', multiplier: 0.78, stemNote: 'Compact hand-tie' },
  { id: 'classic', label: 'Classic', multiplier: 1.0, stemNote: 'Signature fullness' },
  { id: 'grand', label: 'Grand', multiplier: 1.42, stemNote: 'Lush presentation' },
];

export const FlowerDetailsScreen: React.FC<FlowerDetailsScreenProps> = ({
  bouquet,
  onNavigate,
  onAddToCart,
  onOpenIn3D,
  onOpenInAR,
}) => {
  const [mediaTab, setMediaTab] = useState<'photo' | '3d'>('photo');
  const [sizeTier, setSizeTier] = useState<'petite' | 'classic' | 'grand'>('classic');
  const [giftNote, setGiftNote] = useState('');
  const [addedFeedback, setAddedFeedback] = useState(false);

  const activeTier = SIZE_TIERS.find((t) => t.id === sizeTier) || SIZE_TIERS[1];
  const computedPrice = Math.round((bouquet.price * activeTier.multiplier) / 10) * 10;
  const computedStems = Math.max(5, Math.round(bouquet.stemCount * activeTier.multiplier));

  const stemBreakdown = FLOWER_SPECIES.map((sp) => ({
    ...sp,
    count: bouquet.defaultConfig.stems[sp.id] || 0,
  })).filter((s) => s.count > 0);

  const handleAdd = () => {
    onAddToCart({
      bouquet,
      sizeTier,
      unitPrice: computedPrice,
      giftNote: giftNote.trim(),
    });
    setAddedFeedback(true);
    window.setTimeout(() => setAddedFeedback(false), 1800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={() => onNavigate('shops')}
          className="min-h-[44px] px-2 -ml-2 flex items-center gap-1.5 text-sm font-medium text-[#536159] hover:text-[#16211B] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Shops & Blooms</span>
        </button>

        <div className="inline-flex p-1 rounded-xl bg-[#F1F0EC] border border-[#E4E2DC]">
          <button
            type="button"
            onClick={() => setMediaTab('photo')}
            className={`min-h-[38px] px-3.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              mediaTab === 'photo'
                ? 'bg-white text-[#16211B] shadow-xs'
                : 'text-[#536159] hover:text-[#16211B]'
            }`}
          >
            Studio Photo
          </button>
          <button
            type="button"
            onClick={() => setMediaTab('3d')}
            className={`min-h-[38px] px-3.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              mediaTab === '3d'
                ? 'bg-white text-[#16211B] shadow-xs'
                : 'text-[#536159] hover:text-[#16211B]'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Interactive 3D</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Contiguous PDP Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Gallery / Live 3D Turntable */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#F1F0EC] border border-[#E4E2DC] relative">
            {mediaTab === 'photo' ? (
              <ResilientImage
                src={bouquet.image}
                alt={bouquet.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full relative">
                <ThreeBouquetCanvas
                  config={bouquet.defaultConfig}
                  mode="preview"
                  autoRotate={true}
                  className="w-full h-full"
                />
                <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-[#16211B]/85 text-white text-xs">
                  Drag to rotate 360° · Pinch or scroll to zoom
                </div>
              </div>
            )}
          </div>

          {/* Care & Botanical Provenance Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-white border border-[#E4E2DC]">
              <div className="flex items-center gap-1.5 text-xs text-[#536159]">
                <Clock className="w-3.5 h-3.5 text-[#1B4332]" />
                <span>Freshness Window</span>
              </div>
              <p className="mt-1 font-mono tabular-nums text-sm font-semibold text-[#16211B]">
                {bouquet.vaseLifeDays}–{bouquet.vaseLifeDays + 2} Days Vase Life
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E4E2DC]">
              <div className="flex items-center gap-1.5 text-xs text-[#536159]">
                <Sparkles className="w-3.5 h-3.5 text-[#B8294B]" />
                <span>Fragrance Profile</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-[#16211B] truncate">
                {bouquet.fragrance}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E4E2DC]">
              <div className="flex items-center gap-1.5 text-xs text-[#536159]">
                <Droplets className="w-3.5 h-3.5 text-[#1B4332]" />
                <span>Florist Care</span>
              </div>
              <p className="mt-1 text-xs text-[#16211B] line-clamp-2">
                {bouquet.careTip}
              </p>
            </div>
          </div>
        </div>

        {/* Right Contiguous Purchase Module */}
        <div className="lg:col-span-5 rounded-2xl bg-white border border-[#E4E2DC] p-5 sm:p-7 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#536159]">
              <MapPin className="w-3.5 h-3.5 text-[#B8294B] shrink-0" />
              <span>{bouquet.shopName}</span>
              <span aria-hidden="true">·</span>
              <span>Brgy. {bouquet.barangay}, Dagupan</span>
            </div>

            <h1 className="mt-2 font-serif text-3xl font-bold text-[#16211B] leading-tight">
              {bouquet.name}
            </h1>

            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-[#536159]">
                <span className="inline-flex items-center gap-1 text-[#16211B] font-semibold">
                  <Star className="w-3.5 h-3.5 fill-[#D98A16] text-[#D98A16]" />
                  {bouquet.rating.toFixed(1)}
                </span>
                <span aria-hidden="true">·</span>
                <span>{computedStems} Stems</span>
                <span aria-hidden="true">·</span>
                <span>Same-Day Dagupan</span>
              </div>

              <span className="font-mono tabular-nums text-2xl font-bold text-[#16211B]">
                ₱{computedPrice.toLocaleString()}
              </span>
            </div>
          </div>

          <p className="text-sm text-[#536159] leading-relaxed">
            {bouquet.description}
          </p>

          {/* Arrangement Size Tier Selector */}
          <div>
            <span className="block text-xs font-semibold text-[#16211B] mb-2">
              Arrangement Size
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              {SIZE_TIERS.map((tier) => {
                const active = sizeTier === tier.id;
                const tierPrice =
                  Math.round((bouquet.price * tier.multiplier) / 10) * 10;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSizeTier(tier.id)}
                    className={`min-h-[56px] p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#1B4332] text-white border-[#1B4332]'
                        : 'bg-[#FAF9F7] text-[#16211B] border-[#E4E2DC] hover:border-[#1B4332]'
                    }`}
                  >
                    <div className="text-xs font-semibold">{tier.label}</div>
                    <div
                      className={`font-mono tabular-nums text-xs mt-0.5 ${
                        active ? 'text-white/90' : 'text-[#536159]'
                      }`}
                    >
                      ₱{tierPrice.toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stem Composition List */}
          <div className="pt-4 border-t border-[#F1F0EC]">
            <h2 className="text-xs font-semibold text-[#16211B] mb-2.5">
              Botanical Stem Recipe
            </h2>
            <div className="space-y-1.5">
              {stemBreakdown.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between text-xs py-1"
                >
                  <span className="text-[#16211B] font-medium">
                    {st.name}{' '}
                    <span className="text-[#536159]">({st.localName})</span>
                  </span>
                  <span className="font-mono tabular-nums text-[#536159]">
                    {Math.max(1, Math.round(st.count * activeTier.multiplier))} stems
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Gift Message */}
          <div>
            <label
              htmlFor="pdp-gift-note"
              className="block text-xs font-semibold text-[#16211B] mb-1.5"
            >
              Handwritten Card Note (Optional)
            </label>
            <input
              id="pdp-gift-note"
              type="text"
              maxLength={140}
              value={giftNote}
              onChange={(e) => setGiftNote(e.target.value)}
              placeholder="e.g., Happy Anniversary! Delivered with love in Dagupan."
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF9F7] border border-[#E4E2DC] text-sm text-[#16211B] focus:outline-none focus:border-[#1B4332]"
            />
          </div>

          {/* Primary Purchase & 3D/AR Actions */}
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={handleAdd}
              className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-[#1B4332] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#143326] active:scale-[0.98] transition-all cursor-pointer"
            >
              {addedFeedback ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Cart · ₱{computedPrice.toLocaleString()}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart · ₱{computedPrice.toLocaleString()}</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onOpenIn3D(bouquet.defaultConfig)}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F1F0EC] text-[#16211B] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#E4E2DC] cursor-pointer"
              >
                <Box className="w-4 h-4" />
                <span>Customize in 3D</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenInAR(bouquet.defaultConfig)}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F1F0EC] text-[#16211B] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#E4E2DC] cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Preview in AR</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
