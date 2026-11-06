import React, { useState } from 'react';
import { Box, Camera, MapPin, Plus, Search, Star } from 'lucide-react';
import { CATALOG_BOUQUETS, DAGUPAN_SHOPS } from '../data/dagupanCatalog';
import { BouquetConfig, CatalogBouquet, ScreenId } from '../types/floraview';
import { ResilientImage } from '../components/ResilientImage';

interface ShopsScreenProps {
  selectedShopId: string;
  onSelectShopId: (shopId: string) => void;
  onSelectBouquet: (bouquet: CatalogBouquet) => void;
  onOpenIn3D: (config: BouquetConfig) => void;
  onOpenInAR: (config: BouquetConfig) => void;
  onQuickAddCart: (bouquet: CatalogBouquet) => void;
  onNavigate: (screen: ScreenId) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All Blooms' },
  { id: 'signature', label: 'Signature' },
  { id: 'tropical_native', label: 'Tropical & Sampaguita' },
  { id: 'single_stems', label: 'Single Stems' },
  { id: 'dried_preserved', label: 'Preserved' },
] as const;

export const ShopsScreen: React.FC<ShopsScreenProps> = ({
  selectedShopId,
  onSelectShopId,
  onSelectBouquet,
  onOpenIn3D,
  onOpenInAR,
  onQuickAddCart,
}) => {
  const [viewMode, setViewMode] = useState<'flowers' | 'shops'>('flowers');
  const [category, setCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'rating'>('featured');
  const [query, setQuery] = useState('');
  const [addedId, setAddedId] = useState<string | null>(null);

  const activeShop = DAGUPAN_SHOPS.find((s) => s.id === selectedShopId) || null;

  const filteredFlowers = CATALOG_BOUQUETS.filter((item) => {
    const matchShop = selectedShopId === 'all' || item.shopId === selectedShopId;
    const matchCat = category === 'all' || item.category === category;
    const q = query.trim().toLowerCase();
    const matchQuery =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.shopName.toLowerCase().includes(q) ||
      item.barangay.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q);
    return matchShop && matchCat && matchQuery;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

  const handleQuickAdd = (bq: CatalogBouquet) => {
    onQuickAddCart(bq);
    setAddedId(bq.id);
    window.setTimeout(() => {
      setAddedId((curr) => (curr === bq.id ? null : curr));
    }, 1400);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-10 space-y-6">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#E4E2DC]">
        <div>
          <p className="text-xs font-medium text-[#B8294B]">
            Dagupan City Florist Marketplace
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#16211B] mt-0.5">
            {activeShop ? activeShop.name : 'Shops & Botanical Catalog'}
          </h1>
          <p className="text-sm text-[#536159] mt-1">
            {activeShop
              ? `${activeShop.street} · ${activeShop.specialty}`
              : 'Browse fresh bouquets and local Dagupan City flower ateliers.'}
          </p>
        </div>

        {/* Segmented Mode Control: Browse Flowers vs Browse Florist Shops */}
        <div className="inline-flex p-1 rounded-xl bg-[#F1F0EC] border border-[#E4E2DC] self-start">
          <button
            type="button"
            onClick={() => setViewMode('flowers')}
            className={`min-h-[40px] px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'flowers'
                ? 'bg-white text-[#16211B] shadow-xs'
                : 'text-[#536159] hover:text-[#16211B]'
            }`}
          >
            Browse Flowers ({filteredFlowers.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('shops')}
            className={`min-h-[40px] px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'shops'
                ? 'bg-white text-[#16211B] shadow-xs'
                : 'text-[#536159] hover:text-[#16211B]'
            }`}
          >
            Dagupan Shops ({DAGUPAN_SHOPS.length})
          </button>
        </div>
      </div>

      {viewMode === 'shops' ? (
        /* Dagupan Florist Ateliers Directory */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DAGUPAN_SHOPS.map((shop) => {
            const shopBouquetsCount = CATALOG_BOUQUETS.filter(
              (b) => b.shopId === shop.id,
            ).length;
            return (
              <article
                key={shop.id}
                className="rounded-2xl bg-white border border-[#E4E2DC] overflow-hidden grid grid-cols-1 sm:grid-cols-12 items-stretch"
              >
                <div className="sm:col-span-5 aspect-[4/3] sm:aspect-auto bg-[#F1F0EC]">
                  <ResilientImage
                    src={shop.image}
                    alt={shop.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="sm:col-span-7 p-5 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-[#536159]">
                      <MapPin className="w-3.5 h-3.5 text-[#B8294B] shrink-0" />
                      <span>Brgy. {shop.barangay}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {shop.distanceKm} km
                      </span>
                    </div>
                    <h2 className="mt-1 font-serif text-2xl font-bold text-[#16211B]">
                      {shop.name}
                    </h2>
                    <p className="mt-1 text-xs text-[#536159] leading-relaxed">
                      {shop.street}
                    </p>
                    <p className="mt-2 text-xs font-medium text-[#16211B]">
                      Specialty: {shop.specialty}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#F1F0EC] flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-mono tabular-nums text-[#16211B]">
                      <Star className="w-3.5 h-3.5 fill-[#D98A16] text-[#D98A16]" />
                      {shop.rating.toFixed(1)} · {shopBouquetsCount} Bouquets
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectShopId(shop.id);
                        setViewMode('flowers');
                      }}
                      className="min-h-[44px] px-4 rounded-xl bg-[#1B4332] text-white text-xs font-semibold hover:bg-[#143326] cursor-pointer"
                    >
                      View Blooms
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Flowers & Bouquets Browser */
        <div className="space-y-5">
          {/* Search, Shop Filter & Sort Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-[#536159] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search flower species, bouquet name, or barangay..."
                className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl bg-white border border-[#E4E2DC] text-sm text-[#16211B] focus:outline-none focus:border-[#1B4332]"
              />
            </div>

            <div className="md:col-span-4">
              <label htmlFor="shop-filter-select" className="sr-only">
                Filter by Dagupan Florist Shop
              </label>
              <select
                id="shop-filter-select"
                value={selectedShopId}
                onChange={(e) => onSelectShopId(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#E4E2DC] text-sm text-[#16211B] focus:outline-none focus:border-[#1B4332]"
              >
                <option value="all">All Dagupan Florist Ateliers</option>
                {DAGUPAN_SHOPS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.barangay})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label htmlFor="sort-flowers-select" className="sr-only">
                Sort flowers
              </label>
              <select
                id="sort-flowers-select"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as 'featured' | 'price_asc' | 'price_desc' | 'rating',
                  )
                }
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#E4E2DC] text-sm text-[#16211B] focus:outline-none focus:border-[#1B4332]"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map((cat) => {
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#1B4332] text-white'
                      : 'bg-[#F1F0EC] text-[#536159] hover:text-[#16211B]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Product Cards Grid */}
          {filteredFlowers.length === 0 ? (
            <div className="p-10 rounded-2xl bg-[#F1F0EC] border border-[#E4E2DC] text-center">
              <p className="font-serif text-xl font-bold text-[#16211B]">
                No bouquets match your current filters
              </p>
              <button
                type="button"
                onClick={() => {
                  onSelectShopId('all');
                  setCategory('all');
                  setQuery('');
                }}
                className="mt-4 min-h-[44px] px-5 py-2 rounded-xl bg-[#1B4332] text-white text-xs font-semibold cursor-pointer"
              >
                Show All Dagupan Blooms
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFlowers.map((bq) => (
                <article
                  key={bq.id}
                  className="group rounded-2xl bg-white border border-[#E4E2DC] overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => onSelectBouquet(bq)}
                      className="block w-full aspect-[4/3] bg-[#F1F0EC] overflow-hidden cursor-pointer"
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
                        <span>Brgy. {bq.barangay}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectBouquet(bq)}
                        className="mt-1 text-left block w-full cursor-pointer"
                      >
                        <h3 className="font-serif text-xl font-bold text-[#16211B] group-hover:text-[#1B4332] transition-colors">
                          {bq.name}
                        </h3>
                      </button>

                      <p className="mt-1.5 text-xs text-[#536159] line-clamp-2 leading-relaxed">
                        {bq.description}
                      </p>

                      <div className="mt-3 flex items-center gap-2 text-xs font-mono tabular-nums text-[#536159]">
                        <span>{bq.stemCount} Stems</span>
                        <span aria-hidden="true">·</span>
                        <span>{bq.vaseLifeDays}d Vase Life</span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-0.5 text-[#16211B]">
                          <Star className="w-3.5 h-3.5 fill-[#D98A16] text-[#D98A16]" />
                          {bq.rating.toFixed(1)}
                        </span>
                      </div>
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
                        title="Customize in 3D Studio"
                        className="min-h-[44px] min-w-[44px] px-2.5 rounded-xl bg-[#F1F0EC] text-[#16211B] text-xs font-semibold flex items-center justify-center gap-1 hover:bg-[#E4E2DC] cursor-pointer"
                      >
                        <Box className="w-3.5 h-3.5" />
                        <span>3D</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenInAR(bq.defaultConfig)}
                        title="Preview in AR"
                        className="min-h-[44px] min-w-[44px] px-2.5 rounded-xl bg-[#F1F0EC] text-[#16211B] text-xs font-semibold flex items-center justify-center hover:bg-[#E4E2DC] cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickAdd(bq)}
                        className="min-h-[44px] px-4 rounded-xl bg-[#1B4332] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#143326] cursor-pointer"
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
        </div>
      )}
    </div>
  );
};
