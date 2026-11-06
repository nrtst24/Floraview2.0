import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  Check,
  Download,
  Move,
  RotateCw,
  ShoppingBag,
  Sliders,
  Video,
  VideoOff,
} from 'lucide-react';
import {
  calculateBouquetPrice,
  CATALOG_BOUQUETS,
  IMAGES,
} from '../data/dagupanCatalog';
import { BouquetConfig, ScreenId } from '../types/floraview';
import {
  ThreeBouquetCanvas,
  ThreeBouquetCanvasHandle,
} from '../components/ThreeBouquetCanvas';

interface ARVisualizationScreenProps {
  config: BouquetConfig;
  onSelectConfig: (config: BouquetConfig) => void;
  onNavigate: (screen: ScreenId) => void;
  onAddCustomToCart: (config: BouquetConfig, price: number) => void;
}

export const ARVisualizationScreen: React.FC<ARVisualizationScreenProps> = ({
  config,
  onSelectConfig,
  onNavigate,
  onAddCustomToCart,
}) => {
  const canvasRef = useRef<ThreeBouquetCanvasHandle | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [arScale, setArScale] = useState(1.0);
  const [arRotationDeg, setArRotationDeg] = useState(15);
  const [arOffset, setArOffset] = useState<{ x: number; z: number }>({ x: 0, z: 0 });
  const [arVaseMode, setArVaseMode] = useState(true);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [addedNotice, setAddedNotice] = useState(false);

  const price = calculateBouquetPrice(config);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const toggleLiveCamera = async () => {
    if (cameraActive) {
      stopCamera();
      return;
    }
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Live camera unavailable on this browser; using Dagupan Capiz Room AR.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError('Camera permission declined; showing Dagupan Capiz Room AR backdrop.');
      setCameraActive(false);
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleCaptureAR = () => {
    const webglDataUrl = canvasRef.current?.captureSnapshot();
    if (!webglDataUrl) return;

    // Composite backdrop + transparent WebGL 3D bouquet into a clean downloadable PNG
    const outCanvas = document.createElement('canvas');
    outCanvas.width = 960;
    outCanvas.height = 1280;
    const ctx = outCanvas.getContext('2d');
    if (!ctx) return;

    const overlayImg = new Image();
    overlayImg.onload = () => {
      if (cameraActive && videoRef.current && videoRef.current.readyState >= 2) {
        ctx.drawImage(videoRef.current, 0, 0, outCanvas.width, outCanvas.height);
        ctx.drawImage(overlayImg, 0, 0, outCanvas.width, outCanvas.height);
        setSnapshotUrl(outCanvas.toDataURL('image/png'));
      } else {
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        bgImg.onload = () => {
          ctx.drawImage(bgImg, 0, 0, outCanvas.width, outCanvas.height);
          ctx.drawImage(overlayImg, 0, 0, outCanvas.width, outCanvas.height);
          setSnapshotUrl(outCanvas.toDataURL('image/png'));
        };
        bgImg.onerror = () => {
          setSnapshotUrl(webglDataUrl);
        };
        bgImg.src = IMAGES.arCapizRoom;
      }
    };
    overlayImg.src = webglDataUrl;
  };

  const handleOrderAR = () => {
    onAddCustomToCart(config, price);
    setAddedNotice(true);
    window.setTimeout(() => setAddedNotice(false), 1600);
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#141E18] flex flex-col">
      {/* Top AR Control Header */}
      <header className="relative z-20 h-14 px-3 sm:px-6 bg-[#16211B]/95 border-b border-white/15 text-white flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            aria-label="Back to 3D Studio"
            onClick={() => onNavigate('studio')}
            className="min-h-[40px] min-w-[36px] px-1.5 flex items-center gap-1 text-xs sm:text-sm font-medium text-white/90 hover:text-white cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">3D Studio</span>
          </button>

          <div className="min-w-0">
            <label htmlFor="ar-bouquet-select" className="sr-only">
              Select Bouquet for AR Preview
            </label>
            <select
              id="ar-bouquet-select"
              value={config.title}
              onChange={(e) => {
                const found = CATALOG_BOUQUETS.find((b) => b.name === e.target.value);
                if (found) onSelectConfig(found.defaultConfig);
              }}
              className="bg-transparent text-xs sm:text-sm font-semibold text-white border-b border-white/25 py-0.5 max-w-[175px] sm:max-w-xs truncate focus:outline-none cursor-pointer"
            >
              <option value={config.title} className="text-[#16211B]">
                {config.title}
              </option>
              {CATALOG_BOUQUETS.map((b) => (
                <option key={b.id} value={b.name} className="text-[#16211B]">
                  {b.name} (₱{b.price.toLocaleString()})
                </option>
              ))}
            </select>
            <p className="text-[11px] font-mono tabular-nums text-[#E8D5B5] whitespace-nowrap">
              AR · ₱{price.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={toggleLiveCamera}
            className={`min-h-[40px] px-2.5 sm:px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 border cursor-pointer ${
              cameraActive
                ? 'bg-[#B8294B] text-white border-[#B8294B]'
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
            }`}
          >
            {cameraActive ? (
              <>
                <VideoOff className="w-3.5 h-3.5" />
                <span>Stop Cam</span>
              </>
            ) : (
              <>
                <Video className="w-3.5 h-3.5" />
                <span className="sm:hidden">Camera</span>
                <span className="hidden sm:inline">Live Camera</span>
              </>
            )}
          </button>

          <button
            type="button"
            aria-label="Cart"
            onClick={() => onNavigate('cart')}
            className="min-h-[40px] px-2.5 sm:px-3 rounded-xl bg-white text-[#16211B] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Cart</span>
          </button>
        </div>
      </header>

      {/* Main AR Composite Stage */}
      <div className="relative flex-1 w-full min-h-0 overflow-hidden">
        {/* Layer 1: Live Camera Feed OR Dagupan Capiz-Shell Coastal Room Backdrop */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${
            cameraActive ? 'block' : 'hidden'
          }`}
        />

        {!cameraActive && (
          <img
            src={IMAGES.arCapizRoom}
            alt="Dagupan City coastal living room tabletop for AR placement"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        )}

        {/* Layer 2: Transparent Three.js WebGL AR Bouquet & Surface Reticle */}
        <div className="relative z-10 w-full h-full">
          <ThreeBouquetCanvas
            ref={canvasRef}
            config={config}
            mode="ar"
            arScale={arScale}
            arRotationDeg={arRotationDeg}
            arOffset={arOffset}
            arVaseMode={arVaseMode}
            className="w-full h-full"
          />
        </div>

        {/* Non-Intrusive Camera Fallback Note */}
        {cameraError && (
          <div className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-sm z-20 px-3.5 py-2 rounded-xl bg-[#16211B]/92 text-white text-xs border border-white/15">
            {cameraError}
          </div>
        )}
      </div>

      {/* Bottom AR Spatial Controls Dock */}
      <div className="relative z-20 w-full max-w-4xl mx-auto px-2 sm:px-4 pb-2 sm:pb-4 shrink-0">
        <div className="rounded-2xl bg-[#16211B]/95 text-white border border-white/15 p-3.5 sm:p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            {/* Scale Control */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1 text-white/85">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Scale</span>
                </span>
                <span className="font-mono tabular-nums text-[#E8D5B5]">
                  {arScale.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                aria-label="AR bouquet scale"
                min={0.65}
                max={1.55}
                step={0.05}
                value={arScale}
                onChange={(e) => setArScale(parseFloat(e.target.value))}
                className="w-full accent-[#E8D5B5] cursor-pointer"
              />
            </div>

            {/* Rotate Control */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1 text-white/85">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotate</span>
                </span>
                <span className="font-mono tabular-nums text-[#E8D5B5]">
                  {arRotationDeg}°
                </span>
              </div>
              <input
                type="range"
                aria-label="AR bouquet rotation"
                min={0}
                max={360}
                step={5}
                value={arRotationDeg}
                onChange={(e) => setArRotationDeg(parseInt(e.target.value, 10))}
                className="w-full accent-[#E8D5B5] cursor-pointer"
              />
            </div>

            {/* Table Position & Vase Mode */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Move bouquet left on table"
                  onClick={() =>
                    setArOffset((p) => ({ ...p, x: Math.max(-0.8, p.x - 0.15) }))
                  }
                  className="min-w-[40px] min-h-[40px] rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono cursor-pointer"
                >
                  ←
                </button>
                <button
                  type="button"
                  aria-label="Center bouquet on table"
                  onClick={() => setArOffset({ x: 0, z: 0 })}
                  className="min-w-[40px] min-h-[40px] px-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Move className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Move bouquet right on table"
                  onClick={() =>
                    setArOffset((p) => ({ ...p, x: Math.min(0.8, p.x + 0.15) }))
                  }
                  className="min-w-[40px] min-h-[40px] rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono cursor-pointer"
                >
                  →
                </button>
              </div>

              <button
                type="button"
                onClick={() => setArVaseMode((v) => !v)}
                className={`min-h-[40px] px-3 rounded-lg text-xs font-semibold border cursor-pointer ${
                  arVaseMode
                    ? 'bg-[#E8D5B5] text-[#16211B] border-[#E8D5B5]'
                    : 'bg-white/10 text-white border-white/20'
                }`}
              >
                {arVaseMode ? 'Vase: On' : 'Vase: Off'}
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-white/15 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleCaptureAR}
              className="min-h-[44px] px-4 rounded-xl bg-white/12 border border-white/20 text-white text-xs font-semibold flex items-center gap-2 hover:bg-white/20 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Capture AR Photo</span>
            </button>

            <button
              type="button"
              onClick={handleOrderAR}
              className="min-h-[44px] px-5 rounded-xl bg-[#E8D5B5] text-[#16211B] text-xs sm:text-sm font-semibold flex items-center gap-2 hover:bg-[#F3E5CC] cursor-pointer"
            >
              {addedNotice ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Cart</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Order Arrangement · ₱{price.toLocaleString()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* AR Snapshot Preview Modal */}
      {snapshotUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="AR Bouquet Snapshot Preview"
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          onClick={() => setSnapshotUrl(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[#FAF9F7] text-[#16211B] p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold">AR Placement Snapshot</h2>
              <button
                type="button"
                onClick={() => setSnapshotUrl(null)}
                className="min-w-[40px] min-h-[40px] text-sm font-semibold text-[#536159] cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-[#16211B]">
              <img
                src={snapshotUrl}
                alt="Captured AR flower bouquet placement"
                className="w-full h-full object-cover"
              />
            </div>
            <a
              href={snapshotUrl}
              download="floraview-dagupan-ar.png"
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1B4332] text-white text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Save AR Snapshot PNG</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
