import React, { useState } from 'react';
import {
  Box,
  Camera,
  Home,
  LayoutGrid,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Store,
  User,
  X,
} from 'lucide-react';
import { ScreenId } from '../types/floraview';

interface MobileShellProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  cartCount: number;
  selectedBarangay: string;
  isAdmin?: boolean;
  children: React.ReactNode;
}

const SCREEN_DIRECTORY: Array<{ id: ScreenId; num: string; label: string; group: string }> = [
  { id: 'splash', num: '01', label: 'Splash Screen', group: 'Onboarding' },
  { id: 'register', num: '02', label: 'Log In / Register', group: 'Onboarding' },
  { id: 'home', num: '03', label: 'Home Screen', group: 'Explore' },
  { id: 'shops', num: '04', label: 'Shops & Flowers', group: 'Explore' },
  { id: 'details', num: '05', label: 'Flower Details', group: 'Explore' },
  { id: 'studio', num: '06', label: 'Custom Bouquet 3D', group: 'Create' },
  { id: 'ar', num: '07', label: 'AR Visualization', group: 'Create' },
  { id: 'cart', num: '08', label: 'Cart & Checkout', group: 'Account' },
  { id: 'profile', num: '09', label: 'Customer Profile', group: 'Account' },
  { id: 'login', num: '10', label: 'Log In Page', group: 'Account' },
];

const FULLSCREEN_SCREENS: ScreenId[] = ['splash', 'register', 'login', 'studio', 'ar'];

export const MobileShell: React.FC<MobileShellProps> = ({
  currentScreen,
  onNavigate,
  cartCount,
  selectedBarangay,
  isAdmin = false,
  children,
}) => {
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const isFullscreen = FULLSCREEN_SCREENS.includes(currentScreen);

  const navItems: Array<{ id: ScreenId; label: string; icon: React.ReactNode }> = isAdmin
    ? [
        { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" strokeWidth={1.8} /> },
        { id: 'shops', label: 'Shops', icon: <Store className="w-5 h-5" strokeWidth={1.8} /> },
        { id: 'studio', label: '3D Studio', icon: <Box className="w-5 h-5" strokeWidth={1.8} /> },
        { id: 'admin', label: 'Admin', icon: <ShieldCheck className="w-5 h-5" strokeWidth={1.8} /> },
        { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" strokeWidth={1.8} /> },
      ]
    : [
        { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" strokeWidth={1.8} /> },
        { id: 'shops', label: 'Shops', icon: <Store className="w-5 h-5" strokeWidth={1.8} /> },
        { id: 'studio', label: '3D Studio', icon: <Box className="w-5 h-5" strokeWidth={1.8} /> },
        { id: 'ar', label: 'AR View', icon: <Camera className="w-5 h-5" strokeWidth={1.8} /> },
        { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" strokeWidth={1.8} /> },
      ];

  const directoryItems = isAdmin
    ? [
        ...SCREEN_DIRECTORY,
        { id: 'admin' as ScreenId, num: '11', label: 'Admin Atelier Desk', group: 'Admin' },
      ]
    : SCREEN_DIRECTORY;

  return (
    <div className="min-h-dvh flex flex-col bg-[#FAF9F7] text-[#16211B]">
      {/* Standard Top Navigation Bar (Hidden on immersive Splash/Auth/3D/AR screens which render their own compact bar) */}
      {!isFullscreen && (
        <header className="sticky top-0 z-30 h-[52px] lg:h-16 bg-[#FAF9F7]/95 border-b border-[#E4E2DC] px-4 lg:px-8">
          <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-4 lg:gap-8">
            {/* Zone 1: Single-element Brand Wordmark */}
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="font-serif text-xl lg:text-2xl font-bold tracking-tight text-[#16211B] whitespace-nowrap shrink-0 min-h-[44px] flex items-center cursor-pointer"
            >
              FloraView
            </button>

            {/* Zone 2: Desktop Single-Line Nav Links */}
            <nav
              aria-label="Primary navigation"
              className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#536159]"
            >
              {navItems.map((item) => {
                const active =
                  currentScreen === item.id ||
                  (item.id === 'shops' && currentScreen === 'details');
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    className={`whitespace-nowrap shrink-0 min-h-[44px] px-1 border-b-2 transition-colors cursor-pointer ${
                      active
                        ? 'border-[#1B4332] text-[#16211B] font-semibold'
                        : 'border-transparent hover:text-[#16211B]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setDirectoryOpen(true)}
                className="whitespace-nowrap shrink-0 min-h-[44px] px-1 border-b-2 border-transparent hover:text-[#16211B] text-[#536159] transition-colors cursor-pointer"
              >
                Screens
              </button>
            </nav>

            {/* Mobile Middle Barangay Indicator + Screen Index Trigger */}
            <div className="flex lg:hidden items-center gap-1 min-w-0">
              <button
                type="button"
                onClick={() => onNavigate('cart')}
                className="flex items-center gap-1 text-xs font-medium text-[#536159] truncate max-w-[140px] min-h-[44px] px-1.5 cursor-pointer"
                title="Change Dagupan delivery barangay in Cart"
              >
                <MapPin className="w-3.5 h-3.5 text-[#B8294B] shrink-0" />
                <span className="truncate">{selectedBarangay}</span>
              </button>
              <button
                type="button"
                onClick={() => setDirectoryOpen(true)}
                aria-label="Open all 10 screens menu"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#536159] hover:text-[#16211B] cursor-pointer"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Zone 3: Primary Action (Cart CTA) */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('cart')}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1B4332] text-white text-xs lg:text-sm font-medium flex items-center gap-2 hover:bg-[#143326] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span>Cart</span>
                <span className="font-mono tabular-nums text-xs opacity-90">
                  ({cartCount})
                </span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Canvas */}
      <main
        className={`flex-1 w-full ${
          !isFullscreen ? 'pb-[72px] lg:pb-12' : ''
        }`}
      >
        {children}
      </main>

      {/* Mobile Fixed Bottom Tab Bar (56px height -> combined with 52px header = 108px <= 15% viewport height) */}
      {!isFullscreen && (
        <nav
          aria-label="Mobile bottom navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-[58px] bg-[#FFFFFF]/95 border-t border-[#E4E2DC]"
        >
          <div className="grid grid-cols-5 h-full max-w-lg mx-auto">
            {navItems.map((item) => {
              const active =
                currentScreen === item.id ||
                (item.id === 'shops' && currentScreen === 'details');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`flex flex-col items-center justify-center min-h-[44px] transition-colors cursor-pointer ${
                    active ? 'text-[#1B4332] font-semibold' : 'text-[#536159]'
                  }`}
                >
                  {item.icon}
                  <span className="text-[11px] leading-none mt-1 whitespace-nowrap">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* All 10 Screens Quick-Jump Modal Drawer */}
      {directoryOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="FloraView 10 App Screens Directory"
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setDirectoryOpen(false)}
        >
          <div
            className="w-full sm:max-w-md bg-[#FAF9F7] rounded-t-3xl sm:rounded-2xl border border-[#E4E2DC] p-5 max-h-[85dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-[#D5D2CA] rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DC]">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#16211B]">
                  FloraView App Screens
                </h2>
                <p className="text-xs text-[#536159]">
                  Dagupan City 3D Bouquet & AR Experience
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDirectoryOpen(false)}
                aria-label="Close screen directory"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#536159] hover:text-[#16211B] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 divide-y divide-[#E4E2DC]">
              {directoryItems.map((item) => {
                const isCurrent = currentScreen === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onNavigate(item.id);
                      setDirectoryOpen(false);
                    }}
                    className={`w-full min-h-[48px] py-2.5 px-2 flex items-center justify-between text-left transition-colors cursor-pointer ${
                      isCurrent
                        ? 'text-[#1B4332] font-semibold'
                        : 'text-[#16211B] hover:bg-[#F1F0EC]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono tabular-nums text-xs text-[#536159]">
                        {item.num}
                      </span>
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <span className="text-xs text-[#536159]">
                      {isCurrent ? 'Active' : item.group}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
