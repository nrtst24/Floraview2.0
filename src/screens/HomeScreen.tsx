import React, { useState } from 'react';
import {
  ArrowRight,
  Box,
  Camera,
  MapPin,
  Plus,
  Search,
  Star,
} from 'lucide-react';
import {
  CATALOG_BOUQUETS,
  DAGUPAN_BARANGAYS,
  DAGUPAN_SHOPS,
  IMAGES,
} from '../data/dagupanCatalog';
import {
  BouquetConfig,
  CatalogBouquet,
  ScreenId,
  UserAccount,
} from '../types/floraview';
import { ResilientImage } from '../components/ResilientImage';

interface HomeScreenProps {
  user: UserAccount;
  selectedBarangay: string;
  onSelectBarangay: (barangay: string) => void;
  onNavigate: (screen: ScreenId) => void;
  onSelectBouquet: (bouquet: CatalogBouquet) => void;
  onOpenIn3D: (config: BouquetConfig) => void;
  onQuickAddCart: (bouquet: CatalogBouquet) => void;
  onSelectShopFilter: (shopId: string) => void;
}

const OCCASION_FILTERS = [
  { id: 'all', label: 'All Bouquets' },
  { id: 'romance', label: 'Romance & Roses' },
  { id: 'sampaguita', label: 'Sampaguita & Heritage' },
  { id: 'fiesta', label: 'Fiesta & Sunburst' },
  { id: 'sympathy', label: 'Orchids & Sympathy' },
] as const;

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  selectedBarangay,
  onSelectBarangay,
  onNavigate,
  onSelectBouquet,
  onOpenIn3D,
  onQuickAddCart,
  onSelectShopFilter,
}) => {
  const [occasion, setOccasion] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [addedId, setAddedId] = useState<string | null>(null);

  const barangayInfo =
    DAGUPAN_BARANGAYS.find((b) => b.name === selectedBarangay) ||
    DAGUPAN_BARANGAYS[1];

  const filteredBouquets = CATALOG_BOUQUETS.filter((b) => {
    const matchesOccasion = occasion === 'all' || b.occasion === occasion;
    const q = searchText.trim().toLowerCase();
    const matchesSearch =
      !q ||
      b.name.toLowerCase().includes(q) ||
      b.shopName.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q);
    return matchesOccasion && matchesSearch;
  });

  const handleQuickAdd = (b: CatalogBouquet) => {
    onQuickAddCart(b);
    setAddedId(b.id);
    window.setTimeout(() => {
      setAddedId((curr) => (curr === b.id ? null : curr));
    }, 1400);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-10 space-y-10">
      {/* Section 1: Dagupan City Delivery Context & Quick Search */}
      <section aria-label="Dagupan City Delivery and Search" className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#E4E2DC]">
          <div>
            <p className="text-xs text-[#536159]">
              {user.provider === 'guest'
                ? 'Welcome to FloraView Dagupan'
                : `Mabuhay, ${user.displayName}`}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <MapPin className="w-4 h-4 text-[#B8294B] shrink-0" />
              <label htmlFor="home-barangay-select" className="sr-only">
                Delivery Barangay in Dagupan City
              </label>
              <select
                id="home-barangay-select"
                value={selectedBarangay}
                onChange={(e) => onSelectBarangay(e.target.value)}
                className="font-semibold text-sm text-[#16211B] bg-transparent border-b border-[#D5D2CA] py-1 pr-2 focus:outline-none focus:border-[#1B4332] cursor-pointer"
              >
                {DAGUPAN_BARANGAYS.map((b) => (
                  <option key={b.name} value={b.name}>
                    Brgy. {b.name}, Dagupan City
                  </option>
                ))}
              </select>
              <span className="text-xs text-[#536159] font-mono tabular-nums">
                · {barangayInfo.etaMinutes} min · ₱{barangayInfo.deliveryFee} rider fee
              </span>
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#536159] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search roses, sampaguita, Lucao..."
              className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl bg-white border border-[#E4E2DC] text-sm text-[#16211B] placeholder:text-[#536159] focus:outline-none focus:border-[#1B4332]"
            />
          </div>
        </div>

        {/* Storefront Editorial Campaign Hero (Split 2-column stretch on desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden bg-[#F1F0EC] border border-[#E4E2DC] items-stretch">
          <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6">
            <div>
              <p className="text-xs font-medium text-[#B8294B] mb-2">
                Dagupan City 3D Botanical Atelier
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#16211B] leading-[1.08] tracking-tight">
                Custom 3D Bouquets & Live AR Preview
              </h1>
              <p className="mt-3 text-sm sm:text-base text-[#536159] leading-relaxed max-w-lg">
                Sculpt your own arrangement stem-by-stem with Benguet roses, golden sunflowers, and fragrant Pangasinan sampaguita—then inspect it in 360° 3D or on your table in AR.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('studio')}
                className="min-h-[48px] px-6 py-3 rounded-xl bg-[#1B4332] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#143326] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Box className="w-4 h-4 shrink-0" />
                <span>Design Custom 3D Bouquet</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('ar')}
                className="min-h-[48px] px-5 py-3 rounded-xl bg-white text-[#16211B] border border-[#D5D2CA] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#FAF9F7] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4 shrink-0" />
                <span>Launch AR View</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 aspect-[16/10] lg:aspect-auto min-h-[220px] relative">
            <ResilientImage
              src={IMAGES.heroAtelier}
              alt="Dagupan Heritage Courtyard Medley bouquet on carved travertine"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Section 2: Featured Dagupan Bouquets with Occasion Filter */}
      <section aria-labelledby="featured-bouquets-heading" className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2
              id="featured-bouquets-heading"
              className="font-serif text-2xl sm:text-3xl font-bold text-[#16211B]"
            >
              Curated Dagupan Arrangements
            </h2>
            <p className="text-sm text-[#536159] mt-0.5">
              Tap any bouquet to inspect details, customize in 3D, or order same-day delivery.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('shops')}
            className="min-h-[44px] px-2 text-sm font-semibold text-[#1B4332] flex items-center gap-1 hover:underline underline-offset-4 self-start sm:self-auto cursor-pointer"
          >
            <span>Browse All Shops & Blooms</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Occasion Filter Tabs */}
        <div
          role="tablist"
          aria-label="Filter bouquets by occasion"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
        >
          {OCCASION_FILTERS.map((tab) => {
            const active = occasion === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setOccasion(tab.id)}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#1B4332] text-white'
                    : 'bg-[#F1F0EC] text-[#536159] hover:text-[#16211B]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 3-Column Product Grid */}
        {filteredBouquets.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#F1F0EC] border border-[#E4E2DC] text-center">
            <p className="font-serif text-xl font-semibold text-[#16211B]">
              No matching bouquets found
            </p>
            <p className="text-sm text-[#536159] mt-1">
              Try clearing your search or create a custom arrangement in our 3D Studio.
            </p>
            <button
              type="button"
              onClick={() => {
                setOccasion('all');
                setSearchText('');
              }}
              className="mt-4 min-h-[44px] px-5 py-2 rounded-xl bg-[#1B4332] text-white text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBouquets.map((bq) => (
              <article
                key={bq.id}
                className="group rounded-2xl bg-white border border-[#E4E2DC] overflow-hidden flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div>
                  <button
                    type="button"
                    onClick={() => onSelectBouquet(bq)}
                    className="block w-full aspect-[4/3] overflow-hidden bg-[#F1F0EC] cursor-pointer text-left"
                  >
                    <ResilientImage
                      src={bq.image}
                      alt={bq.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </button>

                  <div className="p-4 sm:p-5">
                    <div className="flex items-center gap-1.5 text-xs text-[#536159]">
                      <span className="truncate">{bq.shopName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums shrink-0">
                        {bq.stemCount} Stems
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-0.5 font-mono tabular-nums shrink-0 text-[#16211B]">
                        <Star className="w-3.5 h-3.5 fill-[#D98A16] text-[#D98A16]" />
                        {bq.rating.toFixed(1)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectBouquet(bq)}
                      className="mt-1.5 text-left block w-full cursor-pointer"
                    >
                      <h3 className="font-serif text-xl font-bold text-[#16211B] group-hover:text-[#1B4332] transition-colors leading-snug">
                        {bq.name}
                      </h3>
                    </button>

                    <p className="mt-1.5 text-xs text-[#536159] line-clamp-2 leading-relaxed">
                      {bq.description}
                    </p>
                  </div>
                </div>

                <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-3 border-t border-[#F1F0EC] flex items-center justify-between gap-2">
                  <span className="font-mono tabular-nums text-base font-semibold text-[#16211B]">
                    ₱{bq.price.toLocaleString()}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenIn3D(bq.defaultConfig)}
                      aria-label={`Customize ${bq.name} in 3D`}
                      className="min-h-[44px] px-3 rounded-xl bg-[#F1F0EC] text-[#16211B] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#E4E2DC] cursor-pointer"
                    >
                      <Box className="w-3.5 h-3.5" />
                      <span>3D</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickAdd(bq)}
                      className="min-h-[44px] px-4 rounded-xl bg-[#1B4332] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#143326] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{addedId === bq.id ? 'Added' : 'Add'}</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Section 3: Partner Dagupan City Florist Ateliers */}
      <section aria-labelledby="dagupan-shops-heading" className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2
              id="dagupan-shops-heading"
              className="font-serif text-2xl sm:text-3xl font-bold text-[#16211B]"
            >
              Partner Florist Ateliers in Dagupan
            </h2>
            <p className="text-sm text-[#536159] mt-0.5">
              Locally crafted across Lucao, Poblacion Oeste, Bonuan Gueset, and Tapuac.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {DAGUPAN_SHOPS.map((shop) => (
            <button
              key={shop.id}
              type="button"
              onClick={() => {
                onSelectShopFilter(shop.id);
                onNavigate('shops');
              }}
              className="text-left rounded-2xl bg-white border border-[#E4E2DC] overflow-hidden hover:-translate-y-0.5 transition-transform flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="aspect-[4/3] w-full bg-[#F1F0EC] overflow-hidden">
                  <ResilientImage
                    src={shop.image}
                    alt={shop.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-xs text-[#536159]">
                    <span>Brgy. {shop.barangay}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {shop.deliveryEtaMin} min
                    </span>
                  </div>
                  <h3 className="mt-1 font-serif text-lg font-bold text-[#16211B]">
                    {shop.name}
                  </h3>
                  <p className="mt-1 text-xs text-[#536159] line-clamp-2">
                    {shop.specialty}
                  </p>
                </div>
              </div>

              <div className="px-4 pb-4 pt-2 border-t border-[#F1F0EC] flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 font-mono tabular-nums font-medium text-[#16211B]">
                  <Star className="w-3.5 h-3.5 fill-[#D98A16] text-[#D98A16]" />
                  {shop.rating.toFixed(1)} ({shop.reviewCount})
                </span>
                <span className="font-semibold text-[#1B4332]">Visit Shop</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
