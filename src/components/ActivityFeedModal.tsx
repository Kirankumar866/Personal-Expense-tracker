/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity } from '../types/expense';
import { 
  Activity as ActivityIcon, 
  X, 
  Sparkles, 
  DollarSign, 
  CheckCircle2, 
  Camera, 
  LogIn, 
  Sliders, 
  Clock, 
  Radio
} from 'lucide-react';

interface ActivityFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: Activity[];
  isCloudConnected: boolean;
  userEmail?: string | null;
}

export const ActivityFeedModal: React.FC<ActivityFeedModalProps> = ({
  isOpen,
  onClose,
  activities,
  isCloudConnected,
  userEmail,
}) => {
  if (!isOpen) return null;

  const getActionIcon = (action: Activity['action']) => {
    switch (action) {
      case 'scanned_receipt':
        return <Camera className="w-3.5 h-3.5 text-[#0071E3]" />;
      case 'settled':
        return <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759]" />;
      case 'signed_in':
        return <LogIn className="w-3.5 h-3.5 text-[#5856D6]" />;
      case 'updated_budget':
        return <Sliders className="w-3.5 h-3.5 text-[#FF9500]" />;
      case 'logged_expense':
      default:
        return <DollarSign className="w-3.5 h-3.5 text-[#0071E3]" />;
    }
  };

  const formatTimestamp = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl border-t sm:border border-[#E5E5EA] shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#F2F2F7] flex items-center justify-between bg-gradient-to-r from-[#F9F9FB] to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
              <ActivityIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[#1D1D1F]">
                  Real-Time Activity Feed
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#34C759]/10 text-[#34C759] text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-ping" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-[#86868B]">
                {userEmail ? `Synced to ${userEmail}` : 'Tracks all actions across connected devices in real time'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stream Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {activities.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#F2F2F7] text-[#86868B] flex items-center justify-center mx-auto">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <p className="text-sm font-semibold text-[#1D1D1F]">
                No cloud activities recorded yet
              </p>
              <p className="text-xs text-[#86868B] max-w-xs mx-auto">
                Log an expense, scan a receipt with voice, or settle a balance to see real-time updates appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F2F2F7]">
              {activities.map((act) => (
                <div key={act.id} className="py-3 flex items-start gap-3 group">
                  <div className="w-8 h-8 rounded-xl bg-[#F2F2F7] group-hover:bg-white border border-[#E5E5EA] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    {getActionIcon(act.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#1D1D1F] leading-snug">
                      {act.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#86868B]">
                      <span>{act.userName}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(act.timestamp)}
                      </span>
                    </div>
                  </div>
                  {act.amount !== undefined && (
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold font-mono text-[#1D1D1F]">
                        ${act.amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#F2F2F7] bg-[#F9F9FB] flex items-center justify-between text-xs text-[#86868B]">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-[#34C759]' : 'bg-[#FF9500]'}`} />
            {isCloudConnected ? 'Firestore Real-Time Stream Connected' : 'Connecting to Firestore...'}
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white border border-[#D1D1D6] rounded-lg text-xs font-medium text-[#1D1D1F] hover:bg-[#F2F2F7] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
