/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Expense, ExpenseCategory, UserProfile } from '../types/expense';
import { CATEGORIES, getCategoryMeta, ACTIVE_CATEGORIES } from '../constants/categories';
import { toLocalDateString } from '../utils/dateUtils';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  X, 
  Check, 
  Trash2, 
  AlertCircle, 
  ArrowRight, 
  FileText, 
  Store, 
  Calendar, 
  DollarSign, 
  Split, 
  Info,
  Car,
  Utensils,
  ShoppingBag,
  Coffee,
  Home,
  Tv,
  MoreHorizontal,
  RefreshCw,
  Mic,
  MicOff,
  Volume2,
  Radio,
  Play,
  Square,
  Smartphone
} from 'lucide-react';

interface ParsedItem {
  id: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  categoryReasoning: string;
  paidBy: 'me' | 'friend';
  split: 'none' | 'equal';
  voiceContextApplied?: string;
  selected: boolean;
}

interface ParsedReceiptData {
  merchant: string;
  date: string;
  total: number;
  tax: number;
  tip: number;
  summary?: string;
  voiceSummary?: string;
  items: ParsedItem[];
}

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpenses: (expenses: Omit<Expense, 'id' | 'createdAt'>[]) => void;
  profile: UserProfile;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  uber: Car,
  dining: Utensils,
  groceries: ShoppingBag,
  coffee: Coffee,
  shopping: ShoppingBag,
  housing: Home,
  subscriptions: Tv,
  entertainment: Sparkles,
  other: MoreHorizontal,
};

// Preset demo receipts for rapid testing
const DEMO_RECEIPTS = [
  {
    name: "Trader Joe's (Grocery & Pantry)",
    merchant: "Trader Joe's",
    date: toLocalDateString(new Date()),
    total: 38.65,
    tax: 1.85,
    tip: 0,
    summary: 'Weekly pantry stock with organic vegetables, whole milk, coffee beans, and batteries.',
    suggestedVoiceNote: 'Alex paid with his card. Split the milk and apples 50/50, but the coffee beans and batteries are 100% mine.',
    items: [
      {
        name: 'Organic Honeycrisp Apples',
        amount: 5.99,
        category: 'groceries' as ExpenseCategory,
        categoryReasoning: 'Fresh fruit and pantry food belongs in Groceries & Pantry.',
        paidBy: 'friend' as const,
        split: 'equal' as const,
        voiceContextApplied: 'Split 50/50 per voice instruction.',
      },
      {
        name: 'Organic Whole Milk (1 Gallon)',
        amount: 4.49,
        category: 'groceries' as ExpenseCategory,
        categoryReasoning: 'Essential dairy staple categorized into Groceries.',
        paidBy: 'friend' as const,
        split: 'equal' as const,
        voiceContextApplied: 'Split 50/50 per voice instruction.',
      },
      {
        name: 'Dark Roast Whole Bean Coffee',
        amount: 9.99,
        category: 'coffee' as ExpenseCategory,
        categoryReasoning: 'Specialty coffee beans classified into Coffee & Drinks.',
        paidBy: 'friend' as const,
        split: 'none' as const,
        voiceContextApplied: 'Set as 100% personal for user per voice instruction.',
      },
      {
        name: 'AA Alkaline Batteries (8-Pack)',
        amount: 8.99,
        category: 'shopping' as ExpenseCategory,
        categoryReasoning: 'Household electronics & hardware supplies belong in Shopping & Essentials.',
        paidBy: 'friend' as const,
        split: 'none' as const,
        voiceContextApplied: 'Set as 100% personal for user per voice instruction.',
      },
      {
        name: 'Prepared Chicken Caesar Salad',
        amount: 7.34,
        category: 'dining' as ExpenseCategory,
        categoryReasoning: 'Ready-to-eat prepared meal lunch classified into Food & Dining Out.',
        paidBy: 'friend' as const,
        split: 'equal' as const,
        voiceContextApplied: 'Shared 50/50 split.',
      },
    ],
  },
  {
    name: 'Uber Trip & Airport Transit',
    merchant: 'Uber Technologies, Inc.',
    date: toLocalDateString(new Date()),
    total: 34.20,
    tax: 2.70,
    tip: 5.00,
    summary: 'Rideshare airport pickup trip with city transit surcharge.',
    suggestedVoiceNote: 'I paid for the Uber ride home from the airport, split the whole ride 50/50 with Alex.',
    items: [
      {
        name: 'UberX City Trip to Downtown',
        amount: 26.50,
        category: 'uber' as ExpenseCategory,
        categoryReasoning: 'On-demand rideshare transit mapped to Uber & Rideshare.',
        paidBy: 'me' as const,
        split: 'equal' as const,
        voiceContextApplied: 'Split 50/50 with roommate.',
      },
      {
        name: 'Airport Surcharge & Toll Fee',
        amount: 2.70,
        category: 'uber' as ExpenseCategory,
        categoryReasoning: 'Transit highway toll belongs in Uber & Rideshare.',
        paidBy: 'me' as const,
        split: 'equal' as const,
        voiceContextApplied: 'Split 50/50 with roommate.',
      },
      {
        name: 'Driver Gratuity Tip',
        amount: 5.00,
        category: 'uber' as ExpenseCategory,
        categoryReasoning: 'Rideshare driver tip attached to Uber & Rideshare.',
        paidBy: 'me' as const,
        split: 'equal' as const,
        voiceContextApplied: 'Split 50/50 with roommate.',
      },
    ],
  },
];

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  onAddExpenses,
  profile,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [voiceInstructions, setVoiceInstructions] = useState<string>('');
  const [recordedAudioBase64, setRecordedAudioBase64] = useState<string | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string>('audio/webm');
  
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [audioLevel, setAudioLevel] = useState<number>(0); // 0 to 100 for live meter
  const [micNotice, setMicNotice] = useState<string | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedReceiptData | null>(null);
  const [importMode, setImportMode] = useState<'itemized' | 'combined'>('itemized');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const speechRecognitionRef = useRef<any>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [showPhoneQr, setShowPhoneQr] = useState<boolean>(false);

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setAnalysisError('Please choose a valid audio recording file (MP3, M4A, WAV, WebM).');
      return;
    }

    setMicNotice(null);
    setAudioMimeType(file.type);
    const objectUrl = URL.createObjectURL(file);
    setAudioBlobUrl(objectUrl);

    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      setRecordedAudioBase64(b64);
      if (!voiceInstructions) {
        setVoiceInstructions(`Spoken voice memo attached: ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    return () => {
      stopAllMedia();
    };
  }, []);

  const stopAllMedia = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (_) {}
      audioContextRef.current = null;
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (_) {}
      speechRecognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
      mediaRecorderRef.current = null;
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
  };

  if (!isOpen) return null;

  // Safe Voice Recording Handler with Live Volume Meter
  const startRecording = async () => {
    setMicNotice(null);
    audioChunksRef.current = [];
    setRecordedAudioBase64(null);
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
      setAudioBlobUrl(null);
    }

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Your browser does not support getUserMedia microphone capture.');
      }

      // Request stream from user
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      // 1. Setup AudioContext and AnalyserNode for Real-Time Volume Visualizer
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateMeter = () => {
            if (!audioStreamRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
            animationFrameRef.current = requestAnimationFrame(updateMeter);
          };
          updateMeter();
        }
      } catch (audioCtxErr) {
        console.warn('AudioContext meter notice:', audioCtxErr);
      }

      // 2. Initialize MediaRecorder safely
      let recorder: MediaRecorder;
      let chosenMime = 'audio/webm';

      try {
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            chosenMime = 'audio/webm;codecs=opus';
            recorder = new MediaRecorder(stream, { mimeType: chosenMime });
          } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            chosenMime = 'audio/webm';
            recorder = new MediaRecorder(stream, { mimeType: chosenMime });
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            chosenMime = 'audio/mp4';
            recorder = new MediaRecorder(stream, { mimeType: chosenMime });
          } else {
            recorder = new MediaRecorder(stream);
            chosenMime = recorder.mimeType || 'audio/webm';
          }
        } else {
          throw new Error('MediaRecorder not available');
        }
      } catch (recErr) {
        // Fallback without mime options
        recorder = new MediaRecorder(stream);
        chosenMime = recorder.mimeType || 'audio/webm';
      }

      setAudioMimeType(chosenMime);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: chosenMime });
        const objectUrl = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(objectUrl);

        const reader = new FileReader();
        reader.onloadend = () => {
          const b64 = reader.result as string;
          setRecordedAudioBase64(b64);
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(200);

      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // 3. Optional decoupled speech recognition (does not throw or break recording if unavailable)
      setTimeout(() => {
        try {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (ev: any) => {
              let t = '';
              for (let i = 0; i < ev.results.length; i++) {
                t += ev.results[i][0].transcript + ' ';
              }
              if (t.trim()) {
                setVoiceInstructions(t.trim());
              }
            };

            recognition.onerror = (ev: any) => {
              console.log('Browser SpeechRecognition note (non-critical):', ev?.error);
            };

            speechRecognitionRef.current = recognition;
            recognition.start();
          }
        } catch (_) {}
      }, 100);

    } catch (err: any) {
      console.warn('Microphone error:', err);
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.name === 'SecurityError') {
        setMicNotice('Microphone permission was restricted. Click the lock/settings icon in your browser URL bar to allow microphone access, or use the quick 1-tap presets below!');
      } else {
        setMicNotice(`Microphone note: ${err.message || 'Microphone unavailable'}. You can type or tap a preset below.`);
      }

      // Pre-fill a starter text if empty so user can proceed immediately
      if (!voiceInstructions) {
        setVoiceInstructions(`${profile.friendName} paid on his card. Groceries are 50/50, but coffee is 100% mine.`);
      }
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setAudioLevel(0);
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (_) {}
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (_) {}
      audioContextRef.current = null;
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setAnalysisError('Please choose a valid image file (JPEG, PNG, WebP).');
      return;
    }

    setAnalysisError(null);
    setParsedData(null);
    setImageMimeType(file.type);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const executeAnalysis = async (
    base64Image: string, 
    mime: string, 
    spokenText: string,
    audioB64: string | null
  ) => {
    if (isRecording) {
      stopRecording();
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/analyze-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Image,
          mimeType: mime,
          voiceInstructions: spokenText.trim(),
          audioBase64: audioB64 || undefined,
          audioMimeType: audioMimeType,
          meName: profile.meName,
          friendName: profile.friendName,
        }),
      });

      const resJson = await response.json();

      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || 'Failed to scan receipt. Please verify image clarity.');
      }

      const raw = resJson.data;

      const formattedItems: ParsedItem[] = (raw.items || []).map((item: any, idx: number) => ({
        id: `parsed-${Date.now()}-${idx}`,
        name: item.name || `Item ${idx + 1}`,
        amount: Math.abs(Number(item.amount) || 0),
        category: (ACTIVE_CATEGORIES.includes(item.category) ? item.category : 'other') as ExpenseCategory,
        categoryReasoning: item.categoryReasoning || 'Classified by Gemini AI based on receipt description.',
        paidBy: item.paidBy === 'friend' ? 'friend' : 'me',
        split: item.split === 'none' ? 'none' : 'equal',
        voiceContextApplied: item.voiceContextApplied,
        selected: true,
      }));

      setParsedData({
        merchant: raw.merchant || 'Store Receipt',
        date: raw.date || toLocalDateString(new Date()),
        total: Number(raw.total) || formattedItems.reduce((acc, i) => acc + i.amount, 0),
        tax: Number(raw.tax) || 0,
        tip: Number(raw.tip) || 0,
        summary: raw.summary,
        voiceSummary: raw.voiceSummary,
        items: formattedItems,
      });
    } catch (err: any) {
      console.error('Scan error:', err);
      setAnalysisError(err.message || 'An error occurred during AI analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadDemo = (demo: typeof DEMO_RECEIPTS[0]) => {
    setImagePreview(null);
    setAnalysisError(null);
    setIsAnalyzing(true);
    setVoiceInstructions(demo.suggestedVoiceNote);

    setTimeout(() => {
      setIsAnalyzing(false);
      setParsedData({
        merchant: demo.merchant,
        date: demo.date,
        total: demo.total,
        tax: demo.tax,
        tip: demo.tip,
        summary: demo.summary,
        voiceSummary: `Processed voice description: "${demo.suggestedVoiceNote}". Items assigned and split accordingly.`,
        items: demo.items.map((item, idx) => ({
          id: `demo-${Date.now()}-${idx}`,
          name: item.name,
          amount: item.amount,
          category: item.category,
          categoryReasoning: item.categoryReasoning,
          paidBy: item.paidBy,
          split: item.split,
          voiceContextApplied: item.voiceContextApplied,
          selected: true,
        })),
      });
    }, 600);
  };

  const handleUpdateItem = (id: string, updates: Partial<ParsedItem>) => {
    if (!parsedData) return;
    setParsedData({
      ...parsedData,
      items: parsedData.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    });
  };

  const handleBatchAssignment = (paidBy: 'me' | 'friend', split: 'none' | 'equal') => {
    if (!parsedData) return;
    setParsedData({
      ...parsedData,
      items: parsedData.items.map((i) => ({ ...i, paidBy, split })),
    });
  };

  const handleImport = () => {
    if (!parsedData) return;

    const selectedItems = parsedData.items.filter((i) => i.selected);
    if (selectedItems.length === 0) {
      setAnalysisError('Please select at least one item to import.');
      return;
    }

    const receiptDate = parsedData.date ? new Date(`${parsedData.date}T12:00:00`).toISOString() : new Date().toISOString();

    if (importMode === 'itemized') {
      const expensesToCreate = selectedItems.map((item) => ({
        title: `${item.name} (${parsedData.merchant})`,
        amount: item.amount,
        category: item.category,
        date: receiptDate,
        paidBy: item.paidBy,
        split: item.split,
        notes: `AI Receipt & Voice Scan: ${item.categoryReasoning}${item.voiceContextApplied ? ` · Voice Context: ${item.voiceContextApplied}` : ''}`,
      }));
      onAddExpenses(expensesToCreate);
    } else {
      const totalAmount = selectedItems.reduce((sum, i) => sum + i.amount, 0);
      const primaryCategory = selectedItems[0]?.category || 'other';
      const itemizedSummary = selectedItems
        .map((i) => `${i.name} ($${i.amount.toFixed(2)}) [${getCategoryMeta(i.category).name}]`)
        .join(', ');

      onAddExpenses([
        {
          title: `${parsedData.merchant} (Receipt)`,
          amount: totalAmount,
          category: primaryCategory,
          date: receiptDate,
          paidBy: selectedItems[0]?.paidBy || 'me',
          split: selectedItems.some((i) => i.split === 'equal') ? 'equal' : 'none',
          notes: `Itemized: ${itemizedSummary}${parsedData.voiceSummary ? ` · Voice Note: ${parsedData.voiceSummary}` : ''}`,
        },
      ]);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl border-t sm:border border-[#E5E5EA] shadow-2xl max-w-3xl w-full max-h-[94vh] sm:max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Mobile Pull Bar */}
        <div className="w-10 h-1 bg-[#D1D1D6] rounded-full mx-auto sm:hidden mt-2.5" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#F2F2F7] flex items-center justify-between bg-gradient-to-r from-[#F9F9FB] to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center shrink-0">
              <Camera className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm sm:text-base font-semibold text-[#1D1D1F]">
                  Scan Receipt with Voice Mode
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Mic className="w-2.5 h-2.5 text-[#0071E3]" />
                  Voice + Vision
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#86868B] line-clamp-1 sm:line-clamp-none">
                Upload receipt photo & describe who paid with your voice.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#86868B] hover:text-[#1D1D1F] flex items-center justify-center transition-colors shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5">
          {/* Upload & Voice Input Panel (Shown when not showing parsed results) */}
          {!parsedData && (
            <div className="space-y-4">
              {/* Picture Dropzone */}
              {!imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) handleImageFile(e.dataTransfer.files[0]);
                  }}
                  className="border-2 border-dashed border-[#D1D1D6] hover:border-[#0071E3] rounded-2xl p-7 text-center cursor-pointer transition-all hover:bg-[#0071E3]/5 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
                    }}
                  />

                  <div className="w-12 h-12 rounded-2xl bg-[#F2F2F7] group-hover:bg-[#0071E3]/10 text-[#86868B] group-hover:text-[#0071E3] flex items-center justify-center mx-auto mb-2.5 transition-colors">
                    <Upload className="w-6 h-6" />
                  </div>

                  <p className="text-sm font-semibold text-[#1D1D1F] mb-1">
                    Step 1: Upload or snap receipt picture
                  </p>
                  <p className="text-xs text-[#86868B]">
                    Supermarket receipts, restaurant bills, retail tags, or Uber screenshots
                  </p>
                </div>
              ) : (
                /* Uploaded Image Thumbnail Strip */
                <div className="p-3 bg-[#F9F9FB] rounded-2xl border border-[#E5E5EA] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={imagePreview}
                      alt="Receipt Preview"
                      className="w-14 h-14 object-cover rounded-xl border border-[#E5E5EA] shadow-2xs"
                    />
                    <div>
                      <span className="text-xs font-semibold text-[#1D1D1F] block">
                        Receipt Picture Ready
                      </span>
                      <span className="text-[11px] text-[#34C759] font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Image ready for multimodal Gemini scan
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      fileInputRef.current && (fileInputRef.current.value = '');
                    }}
                    className="px-2.5 py-1 text-xs text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg transition-colors"
                  >
                    Change Picture
                  </button>
                </div>
              )}

              {/* Step 2: Voice Description Mode Panel */}
              <div className="p-4 bg-gradient-to-br from-[#0071E3]/5 via-[#F9F9FB] to-white rounded-2xl border border-[#0071E3]/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#0071E3] text-white flex items-center justify-center shadow-xs">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">
                        Step 2: Describe by Voice
                      </h4>
                      <p className="text-[11px] text-[#86868B]">
                        Describe who paid, what belongs to whom, and which items are shared.
                      </p>
                    </div>
                  </div>

                  {/* Audio Controls */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <input
                      ref={audioFileInputRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={handleAudioUpload}
                    />

                    {/* Mic Toggle Button */}
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                        isRecording
                          ? 'bg-[#FF3B30] text-white animate-pulse shadow-md ring-2 ring-[#FF3B30]/30'
                          : 'bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-xs'
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <Square className="w-3 h-3 fill-white" />
                          Stop Recording ({recordingSeconds}s)
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" />
                          Start Speaking
                        </>
                      )}
                    </button>

                    {/* Upload Audio File Option */}
                    <button
                      type="button"
                      onClick={() => audioFileInputRef.current?.click()}
                      title="Upload voice memo or audio recording (.m4a, .mp3, .wav)"
                      className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-white hover:bg-[#F2F2F7] border border-[#D1D1D6] text-[#1D1D1F] transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#86868B]" />
                      Upload Audio
                    </button>

                    {/* Phone QR Button */}
                    <button
                      type="button"
                      onClick={() => setShowPhoneQr(!showPhoneQr)}
                      title="Open on phone for direct microphone access"
                      className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-white hover:bg-[#F2F2F7] border border-[#D1D1D6] text-[#1D1D1F] transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-[#0071E3]" />
                      Phone Mic
                    </button>
                  </div>
                </div>

                {/* Optional Phone QR Helper banner */}
                {showPhoneQr && (
                  <div className="p-3 bg-white border border-[#0071E3]/20 rounded-xl flex items-center gap-3 animate-in fade-in shadow-xs">
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https%3A%2F%2Fais-pre-ecigdmmhqnl5s3oyegtgnm-491279308824.us-west2.run.app"
                      alt="Scan to open on phone"
                      className="w-16 h-16 rounded-lg border border-[#E5E5EA] p-1 bg-white shrink-0"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-[#1D1D1F] block">Scan to test on your smartphone:</span>
                      <span className="text-[11px] text-[#86868B] block mt-0.5">
                        Native mobile browsers allow 100% unrestricted microphone speech recording.
                      </span>
                      <a
                        href="https://ais-pre-ecigdmmhqnl5s3oyegtgnm-491279308824.us-west2.run.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-[#0071E3] font-semibold hover:underline inline-flex items-center gap-1 mt-1"
                      >
                        Open Shared Link ↗
                      </a>
                    </div>
                  </div>
                )}

                {/* Real-Time Live Volume Meter when recording */}
                {isRecording && (
                  <div className="p-3 bg-white rounded-xl border border-[#0071E3]/30 shadow-xs space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#0071E3] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#FF3B30] animate-ping" />
                        Listening to your microphone...
                      </span>
                      <span className="font-mono text-[11px] text-[#86868B]">
                        {recordingSeconds} seconds recorded
                      </span>
                    </div>

                    {/* Audio Level Volume Bar */}
                    <div className="w-full bg-[#E5E5EA] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#0071E3] via-[#34C759] to-[#FF9500] h-full transition-all duration-75"
                        style={{ width: `${Math.max(8, audioLevel)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-[#86868B]">
                      Speak clearly into your microphone (e.g. "Alex paid for everything; split groceries 50/50, coffee is mine").
                    </p>
                  </div>
                )}

                {/* Microphone notice / permission status if restricted */}
                {micNotice && (
                  <div className="p-2.5 bg-[#FF9500]/10 border border-[#FF9500]/20 rounded-xl flex items-start gap-2 text-[11px] text-[#86868B]">
                    <AlertCircle className="w-3.5 h-3.5 text-[#FF9500] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span>{micNotice}</span>
                    </div>
                  </div>
                )}

                {/* Voice Visualizer / Transcript Input */}
                <div className="space-y-2">
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={voiceInstructions}
                      onChange={(e) => setVoiceInstructions(e.target.value)}
                      placeholder="Spoken or typed instructions, e.g. 'Alex paid for everything. Split the apples and milk 50/50, but the coffee beans and batteries are 100% mine.'"
                      className={`w-full p-3 bg-white border rounded-xl text-xs text-[#1D1D1F] outline-none transition-all resize-none ${
                        isRecording
                          ? 'border-[#0071E3] ring-2 ring-[#0071E3]/20'
                          : 'border-[#D1D1D6] focus:border-[#0071E3]'
                      }`}
                    />
                    {voiceInstructions && (
                      <button
                        type="button"
                        onClick={() => {
                          setVoiceInstructions('');
                          setRecordedAudioBase64(null);
                          if (audioBlobUrl) {
                            URL.revokeObjectURL(audioBlobUrl);
                            setAudioBlobUrl(null);
                          }
                        }}
                        className="absolute right-2.5 top-2.5 text-[#86868B] hover:text-[#1D1D1F] p-1"
                        title="Clear voice note"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Audio captured indicator & Playback preview */}
                  {recordedAudioBase64 && !isRecording && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-[#34C759]/10 border border-[#34C759]/20 rounded-xl text-xs text-[#1D1D1F]">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#34C759] font-medium">
                        <Radio className="w-3.5 h-3.5 shrink-0" />
                        <span>Voice recording ready ({recordingSeconds}s). Gemini will listen to your audio.</span>
                      </div>
                      {audioBlobUrl && (
                        <audio src={audioBlobUrl} controls className="h-6 w-44" />
                      )}
                    </div>
                  )}

                  {/* Sample Voice Prompts for 1-Click Testing */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-[#86868B] font-medium">Quick 1-tap voice presets:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setVoiceInstructions(
                          `${profile.friendName} paid on his card. Groceries are shared 50/50, but coffee and batteries are 100% mine.`
                        )
                      }
                      className="px-2 py-0.5 rounded-md bg-white border border-[#E5E5EA] hover:border-[#0071E3] text-[#1D1D1F] hover:text-[#0071E3] transition-colors"
                    >
                      "{profile.friendName} paid; groceries 50/50, coffee mine"
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setVoiceInstructions(
                          `I paid with Apple Pay. Split the entire bill 50/50 with ${profile.friendName}.`
                        )
                      }
                      className="px-2 py-0.5 rounded-md bg-white border border-[#E5E5EA] hover:border-[#0071E3] text-[#1D1D1F] hover:text-[#0071E3] transition-colors"
                    >
                      "I paid; split total 50/50"
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setVoiceInstructions(
                          `${profile.friendName} covered dinner, and the whole meal is 100% on him.`
                        )
                      }
                      className="px-2 py-0.5 rounded-md bg-white border border-[#E5E5EA] hover:border-[#0071E3] text-[#1D1D1F] hover:text-[#0071E3] transition-colors"
                    >
                      "100% {profile.friendName}"
                    </button>
                  </div>
                </div>

                {/* Primary Analyze Action Button */}
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => executeAnalysis(imagePreview, imageMimeType, voiceInstructions, recordedAudioBase64)}
                    className="w-full py-3 bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-98"
                  >
                    <Sparkles className="w-4 h-4" />
                    Analyze Picture with Voice Instructions
                  </button>
                )}
              </div>

              {/* Sample test receipts */}
              {!imagePreview && (
                <div className="pt-2">
                  <span className="text-xs font-semibold text-[#86868B] block mb-2">
                    Or test with a sample receipt:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DEMO_RECEIPTS.map((demo) => (
                      <button
                        key={demo.merchant}
                        type="button"
                        onClick={() => handleLoadDemo(demo)}
                        className="p-3 bg-[#F9F9FB] hover:bg-[#F2F2F7] border border-[#E5E5EA] rounded-xl text-left transition-colors flex items-center justify-between group"
                      >
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-[#1D1D1F] block group-hover:text-[#0071E3]">
                            {demo.name}
                          </span>
                          <span className="text-[11px] text-[#86868B] block">
                            ${demo.total.toFixed(2)} · {demo.items.length} items
                          </span>
                          <span className="text-[10px] text-[#0071E3] italic block">
                            Voice: "{demo.suggestedVoiceNote.slice(0, 50)}..."
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#86868B] group-hover:text-[#0071E3]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scanning / Analysis Loader */}
          {isAnalyzing && (
            <div className="py-12 text-center space-y-3">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center animate-pulse">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="absolute inset-0 border-2 border-[#0071E3] border-t-transparent rounded-2xl animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#1D1D1F]">
                  Gemini AI is processing picture & voice description...
                </h4>
                <p className="text-xs text-[#86868B] mt-0.5">
                  Extracting line items, applying roommate splits, and classifying each purchase into categories.
                </p>
              </div>
            </div>
          )}

          {/* Analysis Error Message */}
          {analysisError && (
            <div className="p-3.5 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-xl flex items-start gap-2.5 text-xs text-[#FF3B30]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Notice</span>
                <span>{analysisError}</span>
              </div>
            </div>
          )}

          {/* Parsed Results Editor */}
          {parsedData && !isAnalyzing && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Spoken Voice Instructions Applied Banner */}
              {parsedData.voiceSummary && (
                <div className="p-3.5 bg-gradient-to-r from-[#0071E3]/10 via-[#0071E3]/5 to-white rounded-2xl border border-[#0071E3]/20 flex items-start gap-2.5 text-xs text-[#1D1D1F]">
                  <div className="w-5 h-5 rounded-md bg-[#0071E3] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Mic className="w-3 h-3" />
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-[#0071E3] block">
                      Spoken Instructions Applied to Receipt:
                    </span>
                    <p className="text-xs text-[#1D1D1F] mt-0.5">
                      {parsedData.voiceSummary}
                    </p>
                  </div>
                </div>
              )}

              {/* Receipt Summary Card */}
              <div className="p-4 bg-[#F9F9FB] rounded-2xl border border-[#E5E5EA] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-[#0071E3]" />
                      <input
                        type="text"
                        value={parsedData.merchant}
                        onChange={(e) => setParsedData({ ...parsedData, merchant: e.target.value })}
                        placeholder="Merchant Name"
                        className="font-bold text-base text-[#1D1D1F] bg-transparent border-b border-transparent hover:border-[#D1D1D6] focus:border-[#0071E3] outline-none"
                      />
                    </div>
                    {parsedData.summary && (
                      <p className="text-xs text-[#86868B]">{parsedData.summary}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[11px] text-[#86868B] block">Detected Total</span>
                      <span className="text-lg font-bold font-mono text-[#1D1D1F]">
                        ${parsedData.total.toFixed(2)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setParsedData(null)}
                      className="px-2.5 py-1 text-xs text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#E5E5EA] rounded-lg transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Scan Another
                    </button>
                  </div>
                </div>

                {/* Date & Batch Controls */}
                <div className="pt-3 border-t border-[#E5E5EA] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#86868B]" />
                    <span className="text-[#86868B]">Transaction Date:</span>
                    <input
                      type="date"
                      value={parsedData.date}
                      onChange={(e) => setParsedData({ ...parsedData, date: e.target.value })}
                      className="px-2 py-0.5 bg-white border border-[#D1D1D6] rounded-md text-xs font-medium text-[#1D1D1F] outline-none"
                    />
                  </div>

                  {/* Quick batch assign */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#86868B]">Batch override:</span>
                    <button
                      type="button"
                      onClick={() => handleBatchAssignment('me', 'equal')}
                      className="px-2 py-0.5 bg-white border border-[#E5E5EA] hover:bg-[#F2F2F7] rounded text-[11px] font-medium text-[#1D1D1F]"
                    >
                      Split 50/50
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchAssignment('me', 'none')}
                      className="px-2 py-0.5 bg-white border border-[#E5E5EA] hover:bg-[#F2F2F7] rounded text-[11px] font-medium text-[#1D1D1F]"
                    >
                      100% {profile.meName}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchAssignment('friend', 'none')}
                      className="px-2 py-0.5 bg-white border border-[#E5E5EA] hover:bg-[#F2F2F7] rounded text-[11px] font-medium text-[#1D1D1F]"
                    >
                      100% {profile.friendName}
                    </button>
                  </div>
                </div>
              </div>

              {/* Itemized Table Breakdown with AI Reasoning & Voice Allocation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#86868B] flex items-center gap-1.5">
                    <span>Itemized Breakdown ({parsedData.items.filter((i) => i.selected).length} Selected)</span>
                  </h4>
                  <span className="text-xs font-mono font-medium text-[#1D1D1F]">
                    Selected Sum: $
                    {parsedData.items
                      .filter((i) => i.selected)
                      .reduce((sum, i) => sum + i.amount, 0)
                      .toFixed(2)}
                  </span>
                </div>

                <div className="divide-y divide-[#F2F2F7] border border-[#E5E5EA] rounded-2xl overflow-hidden bg-white">
                  {parsedData.items.map((item) => {
                    const meta = getCategoryMeta(item.category);
                    const Icon = CATEGORY_ICONS[item.category] || MoreHorizontal;

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 transition-colors space-y-2.5 ${
                          item.selected ? 'bg-white' : 'bg-[#F9F9FB] opacity-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                          {/* Checkbox and Item Name */}
                          <div className="flex items-start gap-2 sm:gap-2.5 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={(e) => handleUpdateItem(item.id, { selected: e.target.checked })}
                              className="mt-1 w-4 h-4 rounded text-[#0071E3] focus:ring-0 cursor-pointer shrink-0"
                            />

                            <div className="flex-1 min-w-0 space-y-1">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                                className="w-full text-xs font-semibold text-[#1D1D1F] bg-transparent border-b border-transparent hover:border-[#D1D1D6] focus:border-[#0071E3] outline-none"
                              />

                              {/* AI Explanation / Reasoning describing why item belongs in this category */}
                              <div className="flex flex-wrap items-center gap-1 text-[10px] sm:text-[11px]">
                                <span className="inline-flex items-center gap-1 text-[#0071E3] bg-[#0071E3]/5 px-2 py-0.5 rounded-md break-words max-w-full">
                                  <Info className="w-3 h-3 shrink-0" />
                                  <span className="truncate max-w-[200px] sm:max-w-none">
                                    <strong>Category:</strong> {item.categoryReasoning}
                                  </span>
                                </span>

                                {item.voiceContextApplied && (
                                  <span className="inline-flex items-center gap-1 text-[#34C759] bg-[#34C759]/10 px-2 py-0.5 rounded-md font-medium break-words max-w-full">
                                    <Mic className="w-3 h-3 shrink-0" />
                                    <span className="truncate max-w-[200px] sm:max-w-none">
                                      {item.voiceContextApplied}
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="flex items-center gap-1 font-mono text-xs sm:text-sm font-semibold text-[#1D1D1F] shrink-0 pt-0.5">
                            <span>$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={item.amount}
                              onChange={(e) =>
                                handleUpdateItem(item.id, { amount: parseFloat(e.target.value) || 0 })
                              }
                              className="w-14 sm:w-16 text-right font-mono bg-transparent border-b border-transparent hover:border-[#D1D1D6] focus:border-[#0071E3] outline-none"
                            />
                          </div>
                        </div>

                        {/* Category and Assignment Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F2F2F7] text-xs">
                          {/* Category selector */}
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
                            >
                              <Icon className="w-3 h-3" />
                            </div>

                            <select
                              value={item.category}
                              onChange={(e) =>
                                handleUpdateItem(item.id, {
                                  category: e.target.value as ExpenseCategory,
                                  categoryReasoning: `Manually changed to ${getCategoryMeta(e.target.value).name}.`,
                                })
                              }
                              className="px-2 py-0.5 bg-[#F9F9FB] border border-[#E5E5EA] rounded-md text-xs font-medium text-[#1D1D1F] outline-none cursor-pointer"
                            >
                              {ACTIVE_CATEGORIES.map((catKey) => (
                                <option key={catKey} value={catKey}>
                                  {getCategoryMeta(catKey).name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Roommate / Ownership Allocation */}
                          <div className="flex items-center gap-2">
                            {/* Paid By */}
                            <select
                              value={item.paidBy}
                              onChange={(e) =>
                                handleUpdateItem(item.id, { paidBy: e.target.value as 'me' | 'friend' })
                              }
                              className="px-2 py-0.5 bg-[#F9F9FB] border border-[#E5E5EA] rounded-md text-xs font-medium text-[#1D1D1F] outline-none cursor-pointer"
                            >
                              <option value="me">Paid by {profile.meName}</option>
                              <option value="friend">Paid by {profile.friendName}</option>
                            </select>

                            {/* Split */}
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateItem(item.id, {
                                  split: item.split === 'equal' ? 'none' : 'equal',
                                })
                              }
                              className={`px-2 py-0.5 rounded-md border text-xs font-medium transition-colors ${
                                item.split === 'equal'
                                  ? 'bg-[#0071E3]/10 border-[#0071E3] text-[#0071E3]'
                                  : 'bg-[#F9F9FB] border-[#E5E5EA] text-[#86868B]'
                              }`}
                            >
                              {item.split === 'equal' ? 'Split 50/50' : 'Solo'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Import Options */}
              <div className="bg-[#F9F9FB] p-3 rounded-xl border border-[#E5E5EA] space-y-2">
                <span className="text-xs font-semibold text-[#1D1D1F] block">
                  Choose how to save these items:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setImportMode('itemized')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      importMode === 'itemized'
                        ? 'bg-white border-[#0071E3] shadow-xs ring-1 ring-[#0071E3]'
                        : 'bg-white/60 border-[#E5E5EA] text-[#86868B]'
                    }`}
                  >
                    <span className="font-semibold text-[#1D1D1F] block">
                      Individual Itemized Records (Recommended)
                    </span>
                    <span className="text-[11px] text-[#86868B]">
                      Each receipt line item gets its own category curve entry and split tracking.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode('combined')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      importMode === 'combined'
                        ? 'bg-white border-[#0071E3] shadow-xs ring-1 ring-[#0071E3]'
                        : 'bg-white/60 border-[#E5E5EA] text-[#86868B]'
                    }`}
                  >
                    <span className="font-semibold text-[#1D1D1F] block">
                      Single Combined Record
                    </span>
                    <span className="text-[11px] text-[#86868B]">
                      Logs one total expense under the merchant name with item list in the memo.
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-[#F2F2F7] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F2F2F7] rounded-xl transition-colors text-center"
          >
            Cancel
          </button>

          {parsedData && (
            <button
              type="button"
              onClick={handleImport}
              className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-98"
            >
              <Check className="w-3.5 h-3.5" />
              Confirm & Import to Tracker ({parsedData.items.filter((i) => i.selected).length} items)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
