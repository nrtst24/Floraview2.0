import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  RotateCcw,
  ShoppingBag,
} from 'lucide-react';
import {
  calculateBouquetPrice,
  FLOWER_SPECIES,
  getTotalStemCount,
  PETAL_PALETTES,
  RIBBON_STYLES,
  WRAP_STYLES,
} from '../data/dagupanCatalog';
import {
  BouquetConfig,
  FlowerSpeciesId,
  PetalPaletteId,
  RibbonStyleId,
  ScreenId,
  WrapStyleId,
} from '../types/floraview';
import {
  CameraPreset,
  ThreeBouquetCanvas,
  ThreeBouquetCanvasHandle,
} from '../components/ThreeBouquetCanvas';

interface CustomBouquetScreenProps {
  config: BouquetConfig;
  onChangeConfig: (next: BouquetConfig) => void;
  onNavigate: (screen: ScreenId) => void;
  onAddCustomToCart: (config: BouquetConfig, price: number) => void;
  onSaveBouquet: (config: BouquetConfig, price: number, stemCount: number) => Promise<void>;
}

export const CustomBouquetScreen: React.FC<CustomBouquetScreenProps> = ({
  config,
  onChangeConfig,
  onNavigate,
  onAddCustomToCart,
  onSaveBouquet,
}) => {
  const canvasRef = useRef<ThreeBouquetCanvasHandle | null>(null);
  const [dockOpen, setDockOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'stems' | 'colors' | 'wrap' | 'view'>('stems');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('threequarter');
  const [explodedProgress, setExplodedProgress] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [inspectedSpecies, setInspectedSpecies] = useState<FlowerSpeciesId | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  const totalStems = getTotalStemCount(config.stems);
  const totalPrice = calculateBouquetPrice(config);

  const updateStem = (speciesId: FlowerSpeciesId, delta: number) => {
    const current = config.stems[speciesId] || 0;
    const nextVal = Math.max(0, Math.min(12, current + delta));
    if (delta < 0 && totalStems <= 1) return;
    onChangeConfig({
      ...config,
      stems: {
        ...config.stems,
        [speciesId]: nextVal,
      },
    });
  };

  const inspectedInfo = inspectedSpecies
    ? FLOWER_SPECIES.find((s) => s.id === inspectedSpecies) || null
    : null;

  const handleSave = async () => {
    await onSaveBouquet(config, totalPrice, totalStems);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 1800);
  };

  const handleAddToCart = () => {
    onAddCustomToCart(config, totalPrice);
    setAddedNotice(true);
    window.setTimeout(() => setAddedNotice(false), 1600);
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#F6F4EF] flex flex-col">
      {/* Compact Top Studio Header (Solid/RGBA without backdrop-blur over WebGL) */}
      <header className="relative z-20 h-14 px-3 sm:px-6 bg-[#FAF9F7]/95 border-b border-[#E4E2DC] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="min-h-[44px] min-w-[44px] px-2 flex items-center gap-1 text-xs sm:text-sm font-medium text-[#16211B] hover:text-[#1B4332] cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="min-w-0">
            <input
              type="text"
              aria-label="Custom bouquet name"
              value={config.title}
              maxLength={60}
              onChange={(e) => onChangeConfig({ ...config, title: e.target.value })}
              className="font-serif text-base sm:text-lg font-bold text-[#16211B] bg-transparent border-b border-transparent focus:border-[#1B4332] focus:outline-none truncate max-w-[170px] sm:max-w-xs"
            />
            <p className="text-[11px] font-mono tabular-nums text-[#536159]">
              {totalStems} Stems · ₱{totalPrice.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Camera Angle Presets + AR Launch */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden md:flex items-center bg-[#F1F0EC] p-1 rounded-xl border border-[#E4E2DC]">
            {(
              [
                { id: 'threequarter', label: '3/4' },
                { id: 'front', label: 'Front' },
                { id: 'top', label: 'Top' },
                { id: 'stem', label: 'Stem' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setCameraPreset(p.id)}
                className={`min-h-[34px] px-2.5 rounded-lg text-xs font-medium cursor-pointer ${
                  cameraPreset === p.id
                    ? 'bg-white text-[#16211B] font-semibold'
                    : 'text-[#536159]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onNavigate('ar')}
            className="min-h-[40px] px-3 rounded-xl bg-[#F1F0EC] border border-[#D5D2CA] text-[#16211B] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#E4E2DC] cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>AR View</span>
          </button>

          <button
            type="button"
            aria-label="Cart"
            onClick={() => onNavigate('cart')}
            className="min-h-[40px] px-3 rounded-xl bg-[#1B4332] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#143326] cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Cart</span>
          </button>
        </div>
      </header>

      {/* Unobstructed Central 3D WebGL Viewport */}
      <div className="relative flex-1 w-full min-h-0">
        <ThreeBouquetCanvas
          ref={canvasRef}
          config={config}
          mode="studio"
          explodedProgress={explodedProgress}
          cameraPreset={cameraPreset}
          autoRotate={autoRotate}
          onSelectSpecies={setInspectedSpecies}
          className="w-full h-full"
        />

        {/* Raycasted Flower Species Callout Chip (Top-Left, non-obstructive) */}
        {inspectedInfo && (
          <div className="absolute top-3 left-3 z-10 max-w-xs p-3 rounded-xl bg-[#16211B]/92 text-white border border-white/15 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[#E8D5B5]">
                {inspectedInfo.name} ({inspectedInfo.localName})
              </p>
              <p className="text-[11px] text-white/80 mt-0.5">
                {inspectedInfo.origin} · ₱{inspectedInfo.unitPrice}/stem
              </p>
            </div>
            <button
              type="button"
              onClick={() => setInspectedSpecies(null)}
              className="text-xs text-white/70 hover:text-white px-1 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
      <div className="relative z-20 w-full max-w-4xl mx-auto px-2 sm:px-4 pb-2 sm:pb-4 shrink-0">
        {/* Collapse / Expand Toggle Handle */}
        <div className="flex justify-center mb-1.5">
          <button
            type="button"
            onClick={() => setDockOpen((prev) => !prev)}
            className="min-h-[36px] px-4 py-1 rounded-full bg-[#16211B] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            {dockOpen ? (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Hide Studio Controls</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Customize Bouquet ({totalStems} Stems · ₱{totalPrice.toLocaleString()})</span>
              </>
            )}
          </button>
        </div>

        {dockOpen && (
          <div className="rounded-2xl bg-[#FAF9F7]/96 border border-[#D5D2CA] p-3 sm:p-4 space-y-3">
            {/* 4 Studio Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#F1F0EC]">
              {(
                [
                  { id: 'stems', label: 'Stems' },
                  { id: 'colors', label: 'Petals' },
                  { id: 'wrap', label: 'Wrap & Bow' },
                  { id: 'view', label: '3D Inspect' },
                ] as const
              ).map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`min-h-[40px] px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'bg-white text-[#16211B] shadow-xs'
                        : 'text-[#536159] hover:text-[#16211B]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Stem Builder (+ / - Steppers) */}
            {activeTab === 'stems' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[185px] overflow-y-auto pr-1">
                {FLOWER_SPECIES.map((sp) => {
                  const qty = config.stems[sp.id] || 0;
                  return (
                    <div
                      key={sp.id}
                      className="p-2.5 rounded-xl bg-white border border-[#E4E2DC] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                            style={{ backgroundColor: sp.defaultColor }}
                          />
                          <p className="text-xs font-semibold text-[#16211B] truncate">
                            {sp.name}
                          </p>
                        </div>
                        <p className="text-[11px] font-mono tabular-nums text-[#536159] mt-0.5">
                          ₱{sp.unitPrice} · {sp.localName}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          aria-label={`Remove one ${sp.name}`}
                          onClick={() => updateStem(sp.id, -1)}
                          disabled={qty <= 0 || totalStems <= 1}
                          className="min-w-[40px] min-h-[40px] rounded-lg bg-[#F1F0EC] text-[#16211B] flex items-center justify-center disabled:opacity-40 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-mono tabular-nums text-xs font-bold text-[#16211B]">
                          {qty}
                        </span>
                        <button
                          type="button"
                          aria-label={`Add one ${sp.name}`}
                          onClick={() => updateStem(sp.id, 1)}
                          disabled={qty >= 12}
                          className="min-w-[40px] min-h-[40px] rounded-lg bg-[#1B4332] text-white flex items-center justify-center disabled:opacity-40 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 2: Petal Color Palettes */}
            {activeTab === 'colors' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PETAL_PALETTES.map((pal) => {
                  const active = config.petalPalette === pal.id;
                  return (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() =>
                        onChangeConfig({
                          ...config,
                          petalPalette: pal.id as PetalPaletteId,
                        })
                      }
                      className={`min-h-[48px] p-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#1B4332] text-white border-[#1B4332]'
                          : 'bg-white text-[#16211B] border-[#E4E2DC]'
                      }`}
                    >
                      <span
                        className="w-6 h-6 rounded-full shrink-0 border border-white/40"
                        style={{
                          background: `linear-gradient(135deg, ${pal.primaryHex}, ${pal.secondaryHex})`,
                        }}
                      />
                      <span className="text-xs font-semibold truncate">{pal.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tab 3: Wrapping Paper & Satin Ribbon */}
            {activeTab === 'wrap' && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {WRAP_STYLES.map((wrap) => {
                    const active = config.wrapStyle === wrap.id;
                    return (
                      <button
                        key={wrap.id}
                        type="button"
                        onClick={() =>
                          onChangeConfig({
                            ...config,
                            wrapStyle: wrap.id as WrapStyleId,
                          })
                        }
                        className={`min-h-[44px] px-3 py-2 rounded-xl border flex items-center gap-2 shrink-0 cursor-pointer ${
                          active
                            ? 'bg-[#1B4332] text-white border-[#1B4332]'
                            : 'bg-white text-[#16211B] border-[#E4E2DC]'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/15 shrink-0"
                          style={{ backgroundColor: wrap.primaryHex }}
                        />
                        <span className="text-xs font-semibold whitespace-nowrap">
                          {wrap.name} (+₱{wrap.price})
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {RIBBON_STYLES.map((rib) => {
                    const active = config.ribbonStyle === rib.id;
                    return (
                      <button
                        key={rib.id}
                        type="button"
                        onClick={() =>
                          onChangeConfig({
                            ...config,
                            ribbonStyle: rib.id as RibbonStyleId,
                          })
                        }
                        className={`min-h-[44px] px-3 py-2 rounded-xl border flex items-center gap-2 text-left cursor-pointer ${
                          active
                            ? 'bg-[#16211B] text-white border-[#16211B]'
                            : 'bg-white text-[#16211B] border-[#E4E2DC]'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: rib.hex }}
                        />
                        <span className="text-xs font-medium truncate">{rib.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 4: 3D Exploded Stem View & Camera Controls */}
            {activeTab === 'view' && (
              <div className="space-y-3 bg-white p-3 rounded-xl border border-[#E4E2DC]">
                <div className="flex items-center justify-between gap-4">
                  <label
                    htmlFor="exploded-slider"
                    className="text-xs font-semibold text-[#16211B]"
                  >
                    Exploded Stem Separation
                  </label>
                  <span className="font-mono tabular-nums text-xs text-[#536159]">
                    {Math.round(explodedProgress * 100)}%
                  </span>
                </div>
                <input
                  id="exploded-slider"
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={explodedProgress}
                  onChange={(e) => setExplodedProgress(parseFloat(e.target.value))}
                  className="w-full accent-[#1B4332] cursor-pointer"
                />

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    {(
                      [
                        { id: 'threequarter', label: '3/4 View' },
                        { id: 'front', label: 'Front' },
                        { id: 'top', label: 'Top' },
                        { id: 'stem', label: 'Stems' },
                      ] as const
                    ).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setCameraPreset(p.id)}
                        className={`min-h-[38px] px-3 rounded-lg text-xs font-medium cursor-pointer ${
                          cameraPreset === p.id
                            ? 'bg-[#1B4332] text-white'
                            : 'bg-[#F1F0EC] text-[#16211B]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAutoRotate((r) => !r)}
                      className={`min-h-[38px] px-3 rounded-lg text-xs font-medium border cursor-pointer ${
                        autoRotate
                          ? 'bg-[#1B4332] text-white border-[#1B4332]'
                          : 'bg-white text-[#16211B] border-[#D5D2CA]'
                      }`}
                    >
                      {autoRotate ? 'Spin: On' : 'Spin: Off'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setExplodedProgress(0);
                        setCameraPreset('threequarter');
                        canvasRef.current?.resetCamera();
                      }}
                      className="min-h-[38px] px-3 rounded-lg bg-[#F1F0EC] text-[#16211B] text-xs font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Summary & Action Bar */}
            <div className="pt-2 border-t border-[#E4E2DC] flex items-center justify-between gap-2">
              <div>
                <span className="text-[11px] text-[#536159] block">
                  Custom 3D Total ({totalStems} stems)
                </span>
                <span className="font-mono tabular-nums text-base sm:text-lg font-bold text-[#16211B]">
                  ₱{totalPrice.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="min-h-[44px] px-3.5 rounded-xl bg-[#F1F0EC] text-[#16211B] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#E4E2DC] cursor-pointer"
                >
                  {savedNotice ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#1B4332]" />
                      <span>Saved</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="min-h-[44px] px-5 rounded-xl bg-[#1B4332] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 hover:bg-[#143326] active:scale-[0.98] transition-all cursor-pointer"
                >
                  {addedNotice ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Cart</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
