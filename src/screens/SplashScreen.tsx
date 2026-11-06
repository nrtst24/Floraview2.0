import React from 'react';
import { ArrowRight, Box, Camera, Flower2, MapPin } from 'lucide-react';
import { IMAGES } from '../data/dagupanCatalog';
import { ScreenId } from '../types/floraview';
import { ResilientImage } from '../components/ResilientImage';

interface SplashScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onNavigate }) => {
  return (
    <div className="relative min-h-dvh w-full flex flex-col justify-between bg-[#111C16] text-white overflow-hidden">
      {/* Full-Bleed Background Botanical Photography */}
      <div className="absolute inset-0 z-0">
        <ResilientImage
          src={IMAGES.heroAtelier}
          alt="FloraView Dagupan artisanal flower bouquet on travertine pedestal"
          className="w-full h-full object-cover object-center scale-[1.02]"
          fallbackTitle="FloraView Dagupan"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#0D1712] via-[#0D1712]/60 to-[#0D1712]/50"
          aria-hidden="true"
        />
      </div>

      {/* Top Provenance Header */}
      <header className="relative z-10 px-6 pt-6 lg:px-12 lg:pt-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#0D1712]/70 border border-white/25 flex items-center justify-center">
            <Flower2 className="w-5 h-5 text-[#F6E7CB]" strokeWidth={1.75} />
          </div>
          <span className="font-serif text-xl font-bold tracking-tight text-white">
            FloraView
          </span>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="min-h-[44px] px-4 rounded-xl bg-[#0D1712]/70 border border-white/25 text-xs font-semibold text-white hover:bg-[#0D1712]/90 cursor-pointer"
        >
          Skip to Storefront
        </button>
      </header>

      {/* Center Editorial Typography */}
      <div className="relative z-10 px-6 lg:px-12 my-auto py-8 max-w-7xl w-full mx-auto">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 text-xs font-medium text-[#E8D5B5] mb-3">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>Dagupan City, Pangasinan</span>
            <span aria-hidden="true">·</span>
            <span>Same-Day Botanical Atelier</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.06]">
            Sculpted 3D Bouquets, Previewed in Your Space
          </h1>

          <p className="mt-4 text-sm sm:text-base text-white/90 leading-relaxed max-w-lg">
            Compose custom arrangements with fresh Benguet roses, Pangasinan sampaguita, and golden sunflowers. Inspect every stem in interactive 3D or place your bouquet in AR before same-day rider delivery across Dagupan.
          </p>
        </div>
      </div>

      {/* Bottom Thumb-Zone Action Deck */}
      <footer className="relative z-10 px-6 pb-8 pt-4 lg:px-12 lg:pb-12 max-w-7xl w-full mx-auto">
        <div className="grid grid-cols-2 sm:flex sm:flex-row items-stretch sm:items-center gap-3 max-w-xl">
          <button
            type="button"
            onClick={() => onNavigate('register')}
            className="col-span-2 min-h-[48px] sm:flex-1 px-6 py-3 rounded-xl bg-white text-[#16211B] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#F1F0EC] active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="col-span-2 sm:col-span-1 min-h-[48px] px-6 py-3 rounded-xl bg-[#1B4332] text-white border border-white/20 text-sm font-semibold flex items-center justify-center hover:bg-[#143326] active:scale-[0.98] transition-all cursor-pointer"
          >
            Log In
          </button>

          <button
            type="button"
            onClick={() => onNavigate('studio')}
            className="min-h-[48px] px-4 py-3 rounded-xl bg-[#0D1712]/75 text-white border border-white/25 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#0D1712] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Box className="w-4 h-4 shrink-0" />
            <span>3D Studio</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('ar')}
            className="min-h-[48px] px-4 py-3 rounded-xl bg-[#0D1712]/75 text-white border border-white/25 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#0D1712] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4 shrink-0" />
            <span>AR View</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
