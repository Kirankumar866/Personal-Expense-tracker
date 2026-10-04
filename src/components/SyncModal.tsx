import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  RotateCcw, 
  Trash2, 
  Share2, 
  Smartphone 
} from 'lucide-react';
import { exportAppDataJson, importAppDataJson } from '../utils/storage';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
  onResetDemo: () => void;
  onClearAll: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
  onResetDemo,
  onClearAll,
}) => {
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  if (!isOpen) return null;

  const handleCopyJson = () => {
    const json = exportAppDataJson();
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const json = exportAppDataJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumen-budget-pilot-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const res = importAppDataJson(importText);
    if (res.success) {
      setStatusMsg({ text: 'Data imported successfully!' });
      onDataChanged();
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 1200);
    } else {
      setStatusMsg({ text: res.error || 'Import failed', error: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E5EA] space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#F2F2F7]">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#0071E3]" />
            <h3 className="text-base font-semibold text-[#1D1D1F]">
              Buddy Sync & Device Portability
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] rounded-full hover:bg-[#F2F2F7] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#86868B] leading-relaxed">
          Since this is a pilot project between you and your friend, you can instantly export or import
          all transaction records, budgets, and settlement balances across both of your devices.
        </p>

        {/* Action 1: Export */}
        <div className="p-3.5 bg-[#F9F9FB] rounded-2xl border border-[#E5E5EA] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1D1D1F]">
              Export Data for Friend
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyJson}
                className="px-2.5 py-1 bg-white border border-[#D1D1D6] hover:bg-[#F2F2F7] text-xs font-medium rounded-lg transition-colors flex items-center gap-1 text-[#1D1D1F]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#34C759]" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={handleDownloadFile}
                className="px-2.5 py-1 bg-[#1D1D1F] hover:bg-black text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Download JSON
              </button>
            </div>
          </div>
          <p className="text-[11px] text-[#86868B]">
            Generates a lightweight sync package you can text or AirDrop to your friend.
          </p>
        </div>

        {/* Action 2: Import */}
        <div className="p-3.5 bg-[#F9F9FB] rounded-2xl border border-[#E5E5EA] space-y-2">
          <span className="text-xs font-semibold text-[#1D1D1F] block">
            Import Friend's Data / Backup
          </span>
          <textarea
            rows={3}
            placeholder="Paste exported JSON data here..."
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className="w-full p-2.5 bg-white border border-[#D1D1D6] rounded-xl text-xs font-mono text-[#1D1D1F] outline-none"
          />
          <button
            onClick={handleImport}
            disabled={!importText.trim()}
            className="w-full py-1.5 bg-[#0071E3] hover:bg-[#0077ED] disabled:bg-[#F2F2F7] disabled:text-[#86868B] text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <Upload className="w-3.5 h-3.5" />
            Load & Sync Data
          </button>
        </div>

        {/* Action 3: Reset / Clear demo state */}
        <div className="flex items-center justify-between pt-2 border-t border-[#F2F2F7]">
          <button
            onClick={() => {
              onResetDemo();
              setStatusMsg({ text: 'Sample student pilot data reloaded!' });
              setTimeout(() => setStatusMsg(null), 2000);
            }}
            className="text-xs text-[#0071E3] hover:underline flex items-center gap-1 font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reload Demo Data (+20% Uber sample)
          </button>

          <button
            onClick={() => {
              if (confirm('Clear all logged transactions?')) {
                onClearAll();
                setStatusMsg({ text: 'All data cleared' });
                setTimeout(() => setStatusMsg(null), 2000);
              }
            }}
            className="text-xs text-[#FF3B30] hover:underline flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All Data
          </button>
        </div>

        {statusMsg && (
          <div
            className={`p-2.5 rounded-xl text-xs text-center font-medium ${
              statusMsg.error
                ? 'bg-[#FF3B30]/10 text-[#FF3B30]'
                : 'bg-[#34C759]/10 text-[#34C759]'
            }`}
          >
            {statusMsg.text}
          </div>
        )}
      </div>
    </div>
  );
};
