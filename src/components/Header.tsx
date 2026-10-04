/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile } from '../types/expense';
import { useFirebase } from '../context/FirebaseContext';
import { 
  Wallet, 
  ArrowLeftRight, 
  Sliders, 
  Sparkles, 
  Users, 
  Download, 
  Plus, 
  Calendar, 
  Camera, 
  User, 
  Smartphone, 
  Copy, 
  Check, 
  X, 
  Activity as ActivityIcon, 
  LogIn, 
  LogOut, 
  Cloud, 
  ChevronDown,
  Database,
  ExternalLink 
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'dashboard' | 'comparison' | 'monthly' | 'budget' | 'buddy' | 'expenses';
  onSelectTab: (tab: 'dashboard' | 'comparison' | 'monthly' | 'budget' | 'buddy' | 'expenses') => void;
  userFilter: 'all' | 'me' | 'friend';
  onChangeUserFilter: (filter: 'all' | 'me' | 'friend') => void;
  profile: UserProfile;
  onOpenQuickLog: () => void;
  onOpenSync: () => void;
  onOpenReceiptScanner: () => void;
  onOpenActivityFeed: () => void;
  activityCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  userFilter,
  onChangeUserFilter,
  profile,
  onOpenQuickLog,
  onOpenSync,
  onOpenReceiptScanner,
  onOpenActivityFeed,
  activityCount,
}) => {
  const { user, signInWithGoogle, logout, isCloudConnected } = useFirebase();

  const [showPhoneModal, setShowPhoneModal] = useState<boolean>(false);
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  const sharedAppUrl = 'https://ais-pre-ecigdmmhqnl5s3oyegtgnm-491279308824.us-west2.run.app';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sharedAppUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (e) {
      console.warn('Google sign-in canceled or failed:', e);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 border-b border-[#E5E5EA] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1D1D1F] to-[#434346] flex items-center justify-center text-white shadow-sm">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <button 
              onClick={() => onSelectTab('dashboard')} 
              className="text-lg font-bold tracking-tight text-[#1D1D1F] hover:opacity-80 transition-opacity"
            >
              Lumen
            </button>
            {user && (
              <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#34C759]/10 text-[#34C759] text-[10px] font-bold tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
                Live Sync
              </span>
            )}
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                currentTab === 'dashboard'
                  ? 'bg-[#1D1D1F] text-white shadow-sm'
                  : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/5'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onSelectTab('comparison')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === 'comparison'
                  ? 'bg-[#1D1D1F] text-white shadow-sm'
                  : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/5'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Comparisons
            </button>
            <button
              onClick={() => onSelectTab('monthly')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === 'monthly'
                  ? 'bg-[#1D1D1F] text-white shadow-sm'
                  : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/5'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Monthly Logs
            </button>
            <button
              onClick={() => onSelectTab('budget')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === 'budget'
                  ? 'bg-[#1D1D1F] text-white shadow-sm'
                  : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/5'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Budget & Alerts
            </button>
            <button
              onClick={() => onSelectTab('buddy')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === 'buddy'
                  ? 'bg-[#1D1D1F] text-white shadow-sm'
                  : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Buddy & Settlements
            </button>
          </nav>

          {/* Zone 3: Actions, Person Dropdown & Google Auth */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Person Filter Dropdown */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#F2F2F7] hover:bg-[#E5E5EA] border border-[#E5E5EA] rounded-xl text-xs transition-colors">
              <User className="w-3.5 h-3.5 text-[#0071E3] shrink-0" />
              <select
                value={userFilter}
                onChange={(e) => onChangeUserFilter(e.target.value as 'all' | 'me' | 'friend')}
                aria-label="Filter expenses by member"
                className="bg-transparent font-semibold text-[#1D1D1F] outline-none cursor-pointer pr-1 text-xs"
              >
                <option value="all">All Members</option>
                <option value="me">{profile.meName}</option>
                <option value="friend">{profile.friendName}</option>
              </select>
            </div>

            {/* Real-Time Activity Feed Button */}
            <button
              onClick={onOpenActivityFeed}
              title="Real-Time Activity Feed"
              className="p-1.5 sm:p-2 text-[#86868B] hover:text-[#0071E3] hover:bg-[#0071E3]/10 rounded-lg transition-colors relative"
            >
              <ActivityIcon className="w-4 h-4" />
              {activityCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#0071E3]" />
              )}
            </button>

            {/* Phone Link Button */}
            <button
              onClick={() => setShowPhoneModal(true)}
              title="Test on Phone via QR or Link"
              className="p-1.5 sm:p-2 text-[#86868B] hover:text-[#0071E3] hover:bg-[#0071E3]/10 rounded-lg transition-colors hidden sm:flex items-center gap-1"
            >
              <Smartphone className="w-4 h-4" />
            </button>

            {/* Scan Receipt CTA */}
            <button
              onClick={onOpenReceiptScanner}
              title="Scan Receipt with AI"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-[#0071E3] bg-[#0071E3]/10 hover:bg-[#0071E3]/15 rounded-lg border border-[#0071E3]/20 transition-all active:scale-95 whitespace-nowrap"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Scan Receipt</span>
              <span className="sm:hidden text-xs">Scan</span>
            </button>

            {/* Quick Log CTA */}
            <button
              onClick={onOpenQuickLog}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white bg-[#0071E3] hover:bg-[#0077ED] rounded-lg shadow-sm transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Log Expense</span>
              <span className="sm:hidden text-xs">Log</span>
            </button>

            {/* Google Authentication Control */}
            {user ? (
              /* Signed In Profile Button */
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] border border-[#E5E5EA] transition-all"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Google Account'}
                      className="w-6 h-6 rounded-full object-cover border border-[#E5E5EA]"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#0071E3] text-white flex items-center justify-center text-xs font-bold">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                  )}
                  <ChevronDown className="w-3 h-3 text-[#86868B] hidden sm:block" />
                </button>

                {/* User Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#E5E5EA] shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="p-2 border-b border-[#F2F2F7]">
                      <span className="text-xs font-semibold text-[#1D1D1F] block truncate">
                        {user.displayName || 'Signed In'}
                      </span>
                      <span className="text-[11px] text-[#86868B] block truncate">
                        {user.email}
                      </span>
                      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-[#34C759] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                        <span>Connected to Firestore</span>
                      </div>
                    </div>

                    <div className="p-1 space-y-0.5 text-xs">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onOpenActivityFeed();
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#F2F2F7] text-[#1D1D1F] flex items-center gap-2"
                      >
                        <ActivityIcon className="w-3.5 h-3.5 text-[#0071E3]" />
                        <span>Live Activity Feed</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onOpenSync();
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#F2F2F7] text-[#1D1D1F] flex items-center gap-2"
                      >
                        <Cloud className="w-3.5 h-3.5 text-[#86868B]" />
                        <span>Backup & Sync Data</span>
                      </button>

                      <a
                        href="https://console.firebase.google.com/project/gen-lang-client-0143703776/firestore/databases/ai-studio-lumenapplestylee-82bb440f-e77b-4240-9172-6c9ea8fac4cb/data"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowUserDropdown(false)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#F2F2F7] text-[#0071E3] flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <Database className="w-3.5 h-3.5 text-[#0071E3]" />
                          <span className="font-medium">Firebase Database</span>
                        </div>
                        <ExternalLink className="w-3 h-3 text-[#86868B]" />
                      </a>

                      <button
                        onClick={async () => {
                          setShowUserDropdown(false);
                          await logout();
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#FF3B30]/10 text-[#FF3B30] flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Google Sign In Button */
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D1D1D6] bg-white hover:bg-[#F2F2F7] text-xs font-semibold text-[#1D1D1F] shadow-2xs transition-all active:scale-95 shrink-0"
              >
                {/* Google "G" icon */}
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.97 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile subnavigation bar */}
        <div className="flex md:hidden items-center justify-between px-3 py-2 border-t border-[#E5E5EA] overflow-x-auto bg-[#F9F9FB] gap-2">
          <div className="flex items-center gap-1 shrink-0 overflow-x-auto">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                currentTab === 'dashboard' ? 'bg-[#1D1D1F] text-white' : 'text-[#86868B]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onSelectTab('comparison')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                currentTab === 'comparison' ? 'bg-[#1D1D1F] text-white' : 'text-[#86868B]'
              }`}
            >
              Compare
            </button>
            <button
              onClick={() => onSelectTab('monthly')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                currentTab === 'monthly' ? 'bg-[#1D1D1F] text-white' : 'text-[#86868B]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => onSelectTab('buddy')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                currentTab === 'buddy' ? 'bg-[#1D1D1F] text-white' : 'text-[#86868B]'
              }`}
            >
              Roommate
            </button>
          </div>

          {/* Mobile Person Selector Dropdown */}
          <div className="flex items-center gap-1 px-2 py-1 bg-white border border-[#E5E5EA] rounded-lg shrink-0 shadow-2xs">
            <User className="w-3 h-3 text-[#0071E3] shrink-0" />
            <select
              value={userFilter}
              onChange={(e) => onChangeUserFilter(e.target.value as 'all' | 'me' | 'friend')}
              className="bg-transparent font-medium text-[#1D1D1F] outline-none text-[11px] cursor-pointer"
            >
              <option value="all">All Members</option>
              <option value="me">{profile.meName}</option>
              <option value="friend">{profile.friendName}</option>
            </select>
          </div>
        </div>
      </header>

      {/* Phone Test / QR Code Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E5E5EA] shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1D1D1F]">
                    Test on Your Phone
                  </h3>
                  <p className="text-[11px] text-[#86868B]">
                    Scan QR or open HTTPS link on mobile
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPhoneModal(false)}
                className="w-7 h-7 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QR Code Container */}
            <div className="p-4 bg-[#F9F9FB] rounded-2xl border border-[#E5E5EA] flex flex-col items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  sharedAppUrl
                )}`}
                alt="Scan to open Lumen on phone"
                className="w-48 h-48 rounded-xl shadow-xs border border-[#E5E5EA] bg-white p-2"
              />
              <p className="text-[11px] text-[#86868B] mt-2.5 text-center">
                Point your iPhone or Android camera at the QR code to open directly.
              </p>
            </div>

            {/* Direct Link Box */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[#86868B] block">
                Direct URL:
              </span>
              <div className="flex items-center gap-2 p-2 bg-[#F2F2F7] rounded-xl border border-[#E5E5EA]">
                <input
                  type="text"
                  readOnly
                  value={sharedAppUrl}
                  className="bg-transparent text-xs text-[#1D1D1F] outline-none flex-1 truncate font-mono select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-2.5 py-1 bg-white hover:bg-[#E5E5EA] border border-[#D1D1D6] rounded-lg text-xs font-semibold text-[#1D1D1F] transition-colors flex items-center gap-1 shadow-2xs shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-[#34C759]" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-1">
              <p className="text-[10px] text-[#86868B] text-center leading-relaxed">
                💡 On smartphones over HTTPS, the browser natively prompts for microphone access without iframe permission restrictions.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
