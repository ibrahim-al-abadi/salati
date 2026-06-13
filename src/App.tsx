/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getNextPrayerInfo, calculateManbijPrayers, NextPrayerInfo, formatPrayerTime } from './prayerCalc';
import CommitmentCalendar from './components/CommitmentCalendar';
import { 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Sparkles,
  Check,
  X,
  Calendar,
  FileEdit,
  Flame,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Info,
  Sun,
  Moon,
  Palette,
  Cloud,
  CloudOff,
  RefreshCw,
  LogOut,
  User as UserIcon
} from 'lucide-react';


// Soothing and motivational Arabic values focused on prayer, commitment, and spiritual energy
const MOTIVATIONAL_PHRASES = [
  "«أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ» - المحافظة والاستمرار غايتنا.",
  "صلاتك هي النور الذي يضيء لك دروب الحياة ويبث السكينة في روحك.",
  "«عَلَيْكَ بِكَثْرَةِ السُّجُودِ لِلَّهِ، فَإِنَّكَ لَا تَسْجُدُ لِلَّهِ سَجْدَةً إِلَّا رَفَعَكَ اللَّهُ بِهَا دَرَجَةً»",
  "التزامك المتواصل بالصلوات هو سر البركة والتوفيق في كامل تفاصيل يومك.",
  "صلاة الغداة (الفجر) تجعلك في ذمة الله ورعايته، فلا تفرط في بدايتك المشرقة.",
  "«إن الصلاة كانت على المؤمنين كتاباً موقوتاً» - تنظيم الوقت يبدأ بصلاتك.",
  "عندما تلتزم بصلاتك، تروّض نفسك على الانضباط والنجاح والارتقاء الروحي.",
  "كل صلاة تؤديها هي طاقة جديدة وحصن متين يحميك طوال اليوم."
];

// Definition of the 5 Islamic prayers
const PRAYERS_LIST = [
  { id: 'fajr', label: 'الفجر', icon: '🌅' },
  { id: 'dhuhr', label: 'الظهر', icon: '☀️' },
  { id: 'asr', label: 'العصر', icon: '🌤️' },
  { id: 'maghrib', label: 'المغرب', icon: '🌇' },
  { id: 'isha', label: 'العشاء', icon: '🌌' }
] as const;

// Define post-prayer authentic dhikr list generator based on prayer type
interface DhikrItem {
  id: string;
  text: string;
  target: number;
  note: string;
}

function getAdhkarForPrayer(prayerId: string): DhikrItem[] {
  const isFajrOrMaghrib = prayerId === 'fajr' || prayerId === 'maghrib';
  
  return [
    {
      id: 'istighfar',
      text: "أَسْتَغْفِرُ اللهَ",
      target: 3,
      note: "يُقال 3 مرات لتكفير ما قد يقع بصلاة العبد من تقصير وجناية."
    },
    {
      id: 'salam',
      text: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ",
      target: 1,
      note: "استشعار حقيقة السلالم والسلامة والتعظيم للخالق عز وجل."
    },
    {
      id: 'tawheed_spec',
      text: "لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِي وَيُمِيتُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
      target: isFajrOrMaghrib ? 10 : 1,
      note: isFajrOrMaghrib 
        ? "مأثور 10 مرات بعد صلاة الفجر وصلاة المغرب للتحصين ومضاعفة الأجر." 
        : "يُقال مرة واحدة بعد الظهر والعصر والعشاء دبر الصلاة المكتوبة."
    },
    {
      id: 'tasbih',
      text: "سُبْحَانَ اللهِ",
      target: 33,
      note: "تنزيهاً لله وبحمده تكراراً وخشوعاً."
    },
    {
      id: 'tahmeed',
      text: "الْحَمْدُ للهِ",
      target: 33,
      note: "تثبيتاً للحمد والثناء على نِعمه سبحانه الظاهرة والباطنة."
    },
    {
      id: 'takbeer',
      text: "اللهُ أَكْبَرُ",
      target: 33,
      note: "تعظيماً وإجلالاً لكبريائه وعظمته فوق كل شيء."
    },
    {
      id: 'hundred',
      text: "لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
      target: 1,
      note: "تمام المائة لغفران الذنوب والزلات وإن كانت مثل زبد البحر."
    },
    {
      id: 'kursi',
      text: "بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ: {اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ...}",
      target: 1,
      note: "من قرأها دبر كل صلاة مكتوبة لم يمنعه من دخول الجنة إلا الموت."
    },
    {
      id: 'muawidhat',
      text: "قراءة سورة الإخلاص، وسورة الفلق، وسورة الناس.",
      target: isFajrOrMaghrib ? 3 : 1,
      note: isFajrOrMaghrib 
        ? "تكرر السور الإخلاص والفلق والناس 3 مرات دبر الفجر والمغرب." 
        : "تُقرأ السور الثلاث مرة واحدة بعد الصلوات الثلاث الأخرى."
    }
  ];
}

interface ActiveDhikrSession {
  prayerId: string;
  prayerLabel: string;
  adhkars: DhikrItem[];
  currentIndex: number;
  counts: Record<string, number>; // Maps Dhikr Item ID -> current counter
}

const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getFriendlyArabicDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const weekdays = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const dayName = weekdays[date.getDay()];
  
  const formatter = new Intl.DateTimeFormat('ar-SA', { day: 'numeric', month: 'long' });
  try {
    return `${dayName}، ${formatter.format(date)}`;
  } catch (e) {
    const parts = dateStr.split('-');
    return `${dayName}، ${parts[2]}/${parts[1]}/${parts[0]}`;
  }
};

function CloudSyncIcon({ state }: { state: 'synced' | 'syncing' | 'offline' | 'error' }) {
  if (state === 'syncing') {
    return <RefreshCw className="w-3 h-3 text-blue-500 dark:text-blue-400 animate-spin" />;
  }
  if (state === 'synced') {
    return <Cloud className="w-3 h-3 text-emerald-500 dark:text-emerald-400 fill-emerald-500/10" />;
  }
  if (state === 'error') {
    return <CloudOff className="w-3 h-3 text-rose-500 dark:text-rose-450" />;
  }
  return <Cloud className="w-3 h-3 text-stone-400 dark:text-stone-500" />;
}

export default function App() {
  // --- Simulated Authentication State ---
  interface MockUser {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    avatarColor?: string;
  }

  const [user, setUser] = useState<MockUser | null>(() => {
    const saved = localStorage.getItem('prayer_mock_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [cloudSyncState, setCloudSyncState] = useState<'synced' | 'syncing' | 'offline' | 'error'>(() => {
    return localStorage.getItem('prayer_mock_user') ? 'synced' : 'offline';
  });
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  // Mock Form inputs
  const [mockNameInput, setMockNameInput] = useState<string>('إبراهيم خليل');
  const [mockEmailInput, setMockEmailInput] = useState<string>('ibrahim.khalil@example.com');
  const [mockAvatarColor, setMockAvatarColor] = useState<string>('emerald');
  const [isSimulatingLogin, setIsSimulatingLogin] = useState<boolean>(false);

  // --- Persistent State Initialization ---
  
  // Count of committed days
  const [commitmentDays, setCommitmentDays] = useState<number>(() => {
    const saved = localStorage.getItem('prayer_commitment_days');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Calendar and history trackers state
  const [selectedDateString, setSelectedDateString] = useState<string>(() => {
    return getLocalDateString(new Date());
  });

  const [prayerHistory, setPrayerHistory] = useState<Record<string, Record<string, boolean>>>(() => {
    const savedHistory = localStorage.getItem('prayer_history');
    const savedToday = localStorage.getItem('prayer_today_checklist');
    const todayStr = getLocalDateString(new Date());
    
    let history: Record<string, Record<string, boolean>> = {};
    if (savedHistory) {
      try {
        history = JSON.parse(savedHistory);
      } catch (e) {
        history = {};
      }
    }
    
    // Seed with existing today checklist if present
    if (!history[todayStr] && savedToday) {
      try {
        history[todayStr] = JSON.parse(savedToday);
      } catch (e) {}
    }
    
    if (!history[todayStr]) {
      history[todayStr] = { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false };
    }
    
    return history;
  });

  // Current checked state for CURRENT SELECTED DAY
  const [prayedStatus, setPrayedStatus] = useState<Record<string, boolean>>(() => {
    const savedToday = localStorage.getItem('prayer_today_checklist');
    if (savedToday) {
      try {
        return JSON.parse(savedToday);
      } catch (e) {}
    }
    return { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false };
  });

  const [muted, setMuted] = useState<boolean>(() => {
    const saved = localStorage.getItem('prayer_app_muted');
    return saved === 'true';
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('prayer_dark_mode');
    return saved === 'true';
  });

  const [pinkMode, setPinkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('prayer_pink_mode');
    return saved === 'true';
  });

  const [phraseIndex, setPhraseIndex] = useState<number>(() => {
    const saved = localStorage.getItem('prayer_phrase_idx');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Active Interactive Tasbih Session after prayer
  const [activeSession, setActiveSession] = useState<ActiveDhikrSession | null>(null);

  // UI state managers
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [customInputOpen, setCustomInputOpen] = useState<boolean>(false);
  const [customInputValue, setCustomInputValue] = useState<string>('');
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);
  const [showAllTimes, setShowAllTimes] = useState<boolean>(false);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [lastActionTime, setLastActionTime] = useState<string>('');

  // Propose doing Adhkar prompt when a prayer is checked Done
  const [proposingAdhkarFor, setProposingAdhkarFor] = useState<{ id: string; label: string } | null>(null);

  // Prayer Times Info for Manbij with live countdown
  const [prayerCountdown, setPrayerCountdown] = useState<NextPrayerInfo | null>(null);

  useEffect(() => {
    // Initial calculation
    setPrayerCountdown(getNextPrayerInfo(new Date()));

    // Update every second
    const interval = setInterval(() => {
      setPrayerCountdown(getNextPrayerInfo(new Date()));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Run connection warmup (Bypassed in Frontend-only mode)
  useEffect(() => {
    // Simulated connection warmup
  }, []);

  // Simulated Cloud Sync effect for day/prayer changes and profile to give beautiful interactive feedback
  useEffect(() => {
    if (!user) return;
    
    setCloudSyncState('syncing');
    const debounceTimer = setTimeout(() => {
      setCloudSyncState('synced');
    }, 700);

    return () => clearTimeout(debounceTimer);
  }, [prayerHistory, selectedDateString, commitmentDays, muted, darkMode, pinkMode, phraseIndex, user]);

  // --- LocalStorage Synced Side Effects ---

  useEffect(() => {
    localStorage.setItem('prayer_commitment_days', commitmentDays.toString());
  }, [commitmentDays]);

  // Sync the prayer history and selected date state
  useEffect(() => {
    localStorage.setItem('prayer_history', JSON.stringify(prayerHistory));
  }, [prayerHistory]);

  // Load date-specific checklist from prayerHistory whenever selected day changes
  useEffect(() => {
    const dayData = prayerHistory[selectedDateString];
    if (dayData) {
      setPrayedStatus(dayData);
    } else {
      const defaultEmpty = { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false };
      setPrayedStatus(defaultEmpty);
      setPrayerHistory(prev => ({
        ...prev,
        [selectedDateString]: defaultEmpty
      }));
    }
  }, [selectedDateString]);

  // Save current dynamic checked status into the selected date's history record
  useEffect(() => {
    setPrayerHistory(prev => {
      const existing = prev[selectedDateString];
      if (existing && JSON.stringify(existing) === JSON.stringify(prayedStatus)) {
        return prev;
      }
      return {
        ...prev,
        [selectedDateString]: prayedStatus
      };
    });

    const todayStr = getLocalDateString(new Date());
    if (selectedDateString === todayStr) {
      localStorage.setItem('prayer_today_checklist', JSON.stringify(prayedStatus));
    }
  }, [prayedStatus, selectedDateString]);

  useEffect(() => {
    localStorage.setItem('prayer_app_muted', muted.toString());
  }, [muted]);

  useEffect(() => {
    localStorage.setItem('prayer_dark_mode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('prayer_pink_mode', pinkMode.toString());
    if (pinkMode) {
      document.documentElement.classList.add('pink-theme');
    } else {
      document.documentElement.classList.remove('pink-theme');
    }
  }, [pinkMode]);

  useEffect(() => {
    localStorage.setItem('prayer_phrase_idx', phraseIndex.toString());
  }, [phraseIndex]);

  useEffect(() => {
    const savedTime = localStorage.getItem('prayer_last_action_time');
    if (savedTime) setLastActionTime(savedTime);
  }, []);

  // Compute stats
  const totalChecked = Object.values(prayedStatus).filter(Boolean).length;
  const isDayFullyCompleted = totalChecked === 5;

  const todayPrayers = calculateManbijPrayers(new Date());

  // Dynamic color helper classes based on pinkMode state
  const colors = {
    // Brand Text
    textPri: pinkMode ? 'text-pink-600 dark:text-pink-400' : 'text-[#066A38] dark:text-emerald-400',
    textPriHover: pinkMode ? 'group-hover:text-pink-600 dark:group-hover:text-pink-400' : 'group-hover:text-[#066A38] dark:group-hover:text-emerald-400',
    textPriHoverDirect: pinkMode ? 'hover:text-pink-600 dark:hover:text-pink-400' : 'hover:text-[#066A38] dark:hover:text-emerald-400',
    textPriDirect: pinkMode ? 'text-pink-600 dark:text-pink-400' : 'text-[#066A38] dark:text-emerald-400',
    
    // SVG Stroke
    strokePri: pinkMode ? 'stroke-pink-600 dark:stroke-pink-400' : 'stroke-[#066A38] dark:stroke-emerald-400',
    strokePriHex: pinkMode ? (darkMode ? '#f472b6' : '#db2777') : (darkMode ? '#34d399' : '#066A38'), // for SVG attributes like progress circle
    strokeBgHex: pinkMode ? (darkMode ? '#301c23' : '#fdf2f8') : (darkMode ? '#152b1b' : '#f0fdf4'),
    
    // Primary Button Backgrounds
    bgPri: pinkMode ? 'bg-pink-600 dark:bg-pink-700' : 'bg-[#066A38] dark:bg-emerald-700',
    bgPriHover: pinkMode ? 'hover:bg-pink-700 dark:hover:bg-pink-600' : 'hover:bg-[#009639] dark:hover:bg-emerald-600',
    bgPriHoverDirect: pinkMode ? 'hover:bg-pink-700 dark:hover:bg-pink-600' : 'hover:bg-[#009639] dark:hover:bg-emerald-600',
    
    // Light Background Tints
    bgSoft: pinkMode ? 'bg-pink-50 dark:bg-pink-950/20' : 'bg-emerald-50 dark:bg-emerald-950/40',
    bgSoftHover: pinkMode ? 'hover:bg-pink-50 dark:hover:bg-pink-950/20' : 'hover:bg-[#066A38]/3 dark:hover:bg-emerald-955/20',
    bgSoftFlat: pinkMode ? 'bg-pink-500/5 dark:bg-pink-950/20' : 'bg-[#066A38]/5 dark:bg-emerald-950/20',
    
    // Soft Borders
    borderSoft: pinkMode ? 'border-pink-200 dark:border-pink-900/40' : 'border-emerald-100/80 dark:border-emerald-900/40',
    borderSoftThin: pinkMode ? 'border-pink-500/20 dark:border-pink-850/20' : 'border-[#066A38]/20 dark:border-emerald-800/20',
    borderHover: pinkMode ? 'hover:border-pink-500/30 dark:hover:border-pink-500/30' : 'hover:border-[#066A38]/30 dark:hover:border-emerald-500/30',
    
    // Hover Background Accents
    bgHoverAccent: pinkMode ? 'hover:bg-pink-500/5 dark:hover:bg-pink-550/5' : 'hover:bg-[#066A38]/5 dark:hover:bg-emerald-500/5',
    bgHoverAccentHeavy: pinkMode ? 'hover:bg-pink-500/10 dark:hover:bg-pink-550/10' : 'hover:bg-[#066A38]/8 dark:hover:bg-emerald-500/10',
    borderHoverAccent: pinkMode ? 'hover:border-pink-500/50 dark:hover:border-pink-500/50' : 'hover:border-[#066A38]/50 dark:hover:border-emerald-500/50',
    
    // Quick Launch Active Button
    bgQuickLaunchActive: pinkMode ? 'pink-circle-shadow bg-pink-600 dark:bg-pink-800 border-pink-600 dark:border-pink-700 text-white' : 'green-circle-shadow bg-[#066A38] dark:bg-emerald-800 border-[#066A38] dark:border-emerald-700 text-white',
    bgQuickLaunchInactive: pinkMode ? 'bg-white dark:bg-stone-900/60 border-stone-200/90 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-pink-500/30 dark:hover:border-pink-550/30 hover:bg-pink-500/2' : 'bg-white dark:bg-stone-900/60 border-stone-200/90 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-[#066A38]/30 dark:hover:border-emerald-500/30 hover:bg-[#066A38]/2',
    
    // Checkbox Active State
    checkboxActive: pinkMode ? 'bg-white text-pink-600 dark:text-pink-600' : 'bg-white text-[#066A38] dark:text-[#066A38]',
    
    // Dialog/Popup/Modal Frame
    borderDialog: pinkMode ? 'border-pink-500/20 dark:border-stone-800' : 'border-[#066A38]/20 dark:border-stone-800',
    bgDialogDecoration: pinkMode ? 'bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400' : 'bg-emerald-50 dark:bg-emerald-950/40 text-[#066A38] dark:text-emerald-400',
    focusBorder: pinkMode ? 'focus:border-pink-500 dark:focus:border-pink-550' : 'focus:border-[#066A38] dark:focus:border-emerald-500',
    
    // Circle dynamic glow or shadow
    circleGlow: pinkMode ? 'rgba(219, 39, 119, 0.12)' : 'rgba(6, 106, 56, 0.12)',
    circleGlowDone: pinkMode ? 'rgba(219, 39, 119, 0.2)' : 'rgba(6, 106, 56, 0.2)',
    circleShadow: pinkMode ? 'pink-circle-shadow' : 'green-circle-shadow',
  };

  // --- Web Audio Synthesized Feedback ---
  
  // Custom Tonal feedback synthesizer
  const playSoundEffect = (type: 'tap' | 'done' | 'finish' | 'cancel') => {
    if (muted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';

      if (type === 'tap') {
        osc.frequency.setValueAtTime(540, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } else if (type === 'done') {
        // Pleasant double bubble chime (e.g., reached target count for this specific dhikr)
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } else if (type === 'finish') {
        // Complete glorious major progression
        const now = audioCtx.currentTime;
        const playTone = (freq: number, delay: number, duration: number) => {
          const o = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, now + delay);
          g.gain.setValueAtTime(0.04, now + delay);
          g.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
          o.connect(g);
          g.connect(audioCtx.destination);
          o.start(now + delay);
          o.stop(now + delay + duration);
        };
        playTone(523.25, 0, 0.2);   // C5
        playTone(659.25, 0.08, 0.2); // E5
        playTone(783.99, 0.16, 0.25); // G5
        playTone(1046.50, 0.26, 0.45); // C6
      } else if (type === 'cancel') {
        osc.frequency.setValueAtTime(280, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(90, audioCtx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      }
    } catch (e) {
      console.warn("Audio feedback context blocked:", e);
    }
  };

  // --- Interactive Tasbih state manipulators ---

  // Taps the active dhikr counter
  const handleTapDhikr = () => {
    if (!activeSession) return;

    const currentDhikr = activeSession.adhkars[activeSession.currentIndex];
    const currentCount = activeSession.counts[currentDhikr.id] || 0;
    
    // Attempt standard device vibration pattern if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }

    if (currentCount + 1 >= currentDhikr.target) {
      // Reached limit! Record counts first
      const newCounts = {
        ...activeSession.counts,
        [currentDhikr.id]: currentDhikr.target
      };

      // Check if we are finished with ALL dhikr items
      if (activeSession.currentIndex + 1 >= activeSession.adhkars.length) {
        // Finished everything successfully!
        playSoundEffect('finish');
        setActiveSession(prev => {
          if (!prev) return null;
          return {
            ...prev,
            counts: newCounts,
            currentIndex: prev.currentIndex // stay at the end or complete it
          };
        });
        // Transition into session finished view!
      } else {
        // Advance to next dhikr automatically!
        playSoundEffect('done');
        setActiveSession(prev => {
          if (!prev) return null;
          return {
            ...prev,
            counts: newCounts,
            currentIndex: prev.currentIndex + 1
          };
        });
      }
    } else {
      // Standard increment
      playSoundEffect('tap');
      setActiveSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          counts: {
            ...prev.counts,
            [currentDhikr.id]: currentCount + 1
          }
        };
      });
    }
  };

  // Skip back and target manually if they prefer
  const handlePrevDhikr = () => {
    if (!activeSession || activeSession.currentIndex === 0) return;
    playSoundEffect('tap');
    setActiveSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        currentIndex: prev.currentIndex - 1
      };
    });
  };

  const handleNextDhikr = () => {
    if (!activeSession) return;
    if (activeSession.currentIndex + 1 < activeSession.adhkars.length) {
      playSoundEffect('tap');
      setActiveSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          currentIndex: prev.currentIndex + 1
        };
      });
    }
  };

  // Initializes interactive dhikr session
  const startDhikrSession = (prayerId: string, label: string) => {
    playSoundEffect('tap');
    const adhkars = getAdhkarForPrayer(prayerId);
    
    // Initialize session counts map to 0
    const countsMap: Record<string, number> = {};
    adhkars.forEach(item => {
      countsMap[item.id] = 0;
    });

    setActiveSession({
      prayerId,
      prayerLabel: label,
      adhkars,
      currentIndex: 0,
      counts: countsMap
    });

    setProposingAdhkarFor(null);
  };

  // Toggling of individual prayer items
  const handleTogglePrayer = (id: string, label: string) => {
    const nextStatus = !prayedStatus[id];
    
    setPrayedStatus(prev => {
      const updated = { ...prev, [id]: nextStatus };
      const nowAllChecked = Object.values(updated).filter(Boolean).length === 5;
      
      if (nowAllChecked) {
        setShowCelebration(true);
      } else if (nextStatus) {
        // Prompt them to read Post-Prayer Adhkar for this specific checked prayer!
        setProposingAdhkarFor({ id, label });
      }
      return updated;
    });

    playSoundEffect(nextStatus ? 'tap' : 'cancel');

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    setLastActionTime(formattedTime);
    localStorage.setItem('prayer_last_action_time', formattedTime);
  };

  // Finalizes full completed day commit
  const handleCommitCompletedDay = () => {
    playSoundEffect('finish');
    setCommitmentDays(prev => prev + 1);
    setPrayedStatus({ fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false });
    setShowCelebration(false);
  };

  const handleDecrementDays = () => {
    if (commitmentDays > 0) {
      playSoundEffect('cancel');
      setCommitmentDays(prev => prev - 1);
    }
  };

  const handleResetStreak = () => {
    setCommitmentDays(0);
    setPrayedStatus({ fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false });
    setShowResetConfirm(false);
    playSoundEffect('cancel');
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customInputValue, 10);
    if (!isNaN(val) && val >= 0) {
      setCommitmentDays(val);
      setCustomInputOpen(false);
      setCustomInputValue('');
      playSoundEffect('tap');
    }
  };

  const cyclePhrase = () => {
    setPhraseIndex(prev => (prev + 1) % MOTIVATIONAL_PHRASES.length);
  };

  // Circle dynamic stroke ring logic
  const progressRatio = totalChecked / 5;
  const strokeDashoffset = 880 - (880 * progressRatio);

  return (
    <div 
      id="main-container"
      className={`relative w-full min-h-screen flex flex-col justify-between items-center text-stone-800 dark:text-stone-100 ${pinkMode ? 'bg-[#FDF7F9] dark:bg-[#181114] selection:bg-pink-500/10' : 'bg-[#F9FBF9] dark:bg-[#121612] selection:bg-[#066A38]/10'} select-none pb-12 pt-5 pr-5 pl-5 overflow-y-auto overflow-x-hidden md:py-8`}
      dir="rtl"
    >
      
      {/* 🌟 HEADER: Top actions & titles */}
      <header className="w-full max-w-md flex justify-between items-center z-20">
        
        {/* Brand/Simulated Profile Greeting */}
        <div 
          onClick={() => {
            playSoundEffect('tap');
            if (user) {
              setShowAuthModal(true);
            } else {
              setShowLoginModal(true);
            }
          }}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 active:scale-95 transition-all duration-200"
          title={user ? "عرض تفاصيل الحساب السحابي" : "اضغط هنا لتفعيل الحفظ والمزامنة السحابية"}
        >
          {user ? (
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-offset-2 ring-stone-100 dark:ring-stone-900 border-2
              ${user.avatarColor === 'pink' ? 'bg-pink-500 text-pink-50 border-pink-400' :
                user.avatarColor === 'amber' ? 'bg-amber-500 text-amber-50 border-amber-400' :
                user.avatarColor === 'blue' ? 'bg-blue-500 text-blue-50 border-blue-400' :
                user.avatarColor === 'indigo' ? 'bg-indigo-500 text-indigo-50 border-indigo-400' :
                'bg-emerald-500 text-emerald-50 border-emerald-400'} shadow-sm text-center`}
            >
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-4.5 h-4.5" />}
            </div>
          ) : (
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${pinkMode ? 'bg-pink-100 text-pink-700' : 'bg-stone-100 dark:bg-stone-800 text-stone-500'}`}>
              <Cloud className="w-4.5 h-4.5 text-stone-400 animate-pulse" />
            </div>
          )}
          <div className="flex flex-col items-start leading-none gap-0.5">
            <span className="text-[9px] text-stone-400 dark:text-stone-500 font-bold">السلام عليكم</span>
            <span className={`text-xs font-bold ${colors.textPri}`}>
              {user ? (user.displayName || "يا رفيقي") : "مزامنة الصلوات ☁️"}
            </span>
          </div>
        </div>

        {/* Global Sound & Guide switches */}
        <div className="flex items-center gap-1.5">
          
          {/* Theme Variant Toggle (Green / Pink) */}
          <button
            id="theme-variant-toggle"
            onClick={() => {
              setPinkMode(!pinkMode);
              playSoundEffect('tap');
            }}
            className="p-2.5 rounded-full bg-stone-100/90 dark:bg-stone-800/90 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200/40 dark:border-stone-700/60 text-stone-600 dark:text-stone-300 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shadow-xs flex items-center justify-center"
            title={pinkMode ? "الوضع الأخضر الطبيعي 🌿" : "الوضع الوردي البنّاتي 🌸"}
          >
            <Palette className={`w-3.5 h-3.5 ${pinkMode ? 'text-pink-500' : 'text-[#066A38]'}`} />
          </button>

          {/* Dark Mode switcher */}
          <button
            id="dark-mode-toggle"
            onClick={() => {
              setDarkMode(!darkMode);
              playSoundEffect('tap');
            }}
            className={`p-2.5 rounded-full bg-stone-100/90 dark:bg-stone-800/90 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200/40 dark:border-stone-700/60 text-stone-600 dark:text-stone-300 ${pinkMode ? 'hover:text-pink-500 dark:hover:text-pink-400' : 'hover:text-[#066A38] dark:hover:text-[#0BB75D]'} transition-all duration-200 cursor-pointer shadow-xs`}
            title={darkMode ? "الوضع المضيء" : "الوضع الليلي"}
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Audio Chattering */}
          <button
            id="sound-toggle"
            onClick={() => setMuted(!muted)}
            className={`p-2.5 rounded-full bg-stone-100/90 dark:bg-stone-800/90 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200/40 dark:border-stone-700/60 text-stone-600 dark:text-stone-300 ${pinkMode ? 'hover:text-pink-500 dark:hover:text-pink-400' : 'hover:text-[#066A38] dark:hover:text-[#0BB75D]'} transition-all duration-200 cursor-pointer shadow-xs`}
            title={muted ? "تشغيل الصوت" : "كتم الصوت"}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          
          {/* Calendar Toggle */}
          <button
            id="calendar-toggle"
            onClick={() => {
              setShowCalendarModal(true);
              playSoundEffect('tap');
            }}
            className={`p-2.5 rounded-full bg-stone-100/90 dark:bg-stone-800/90 ${colors.bgHoverAccent} border border-stone-200/40 dark:border-stone-700/60 text-stone-500 dark:text-stone-300 ${colors.textPriHoverDirect} transition-all duration-200 cursor-pointer shadow-xs`}
            title="روزنامة الالتزام"
          >
            <Calendar className="w-3.5 h-3.5" />
          </button>

        </div>
      </header>

      {/* 🕌 SEAMLESS CENTER STAGE CONTEXT: Direct View switching based on active state */}
      <main className="w-full flex-1 flex flex-col justify-center items-center relative py-3 z-10 max-w-lg">
        
        <AnimatePresence mode="wait">
          {!activeSession ? (
            
            // --- 🏠 DEFAULT VIEWS: Core Prayer Tracker ---
            <motion.div 
              key="main-tracker-stage"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full flex flex-col items-center"
            >
              
              {/* Dynamic Glow Element behind circle */}
              <div 
                className="absolute pointer-events-none w-[340px] h-[340px] rounded-full filter blur-3xl -z-10 transition-all duration-700"
                style={{
                  backgroundColor: isDayFullyCompleted 
                    ? (darkMode ? (pinkMode ? 'rgba(244, 63, 94, 0.05)' : 'rgba(16, 185, 129, 0.05)') : (pinkMode ? 'rgba(219, 39, 119, 0.08)' : 'rgba(6, 106, 56, 0.08)'))
                    : (darkMode ? (pinkMode ? 'rgba(244, 63, 94, 0.02)' : 'rgba(16, 185, 129, 0.02)') : (pinkMode ? 'rgba(219, 39, 119, 0.03)' : 'rgba(6, 106, 56, 0.03)')),
                  transform: 'translateY(-10px)'
                }}
              />

              {/* 1 العداد الرئيسي (أيام الالتزام بالصلوات) */}
              <div className="relative flex flex-col items-center">
                
                <motion.div 
                  id="counter-canvas"
                  className={`relative w-56 h-56 md:w-64 md:h-64 flex justify-center items-center rounded-full bg-white dark:bg-stone-900/90 ${colors.circleShadow} border border-stone-100/60 dark:border-stone-800 relative group`}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                >
                  {/* SVG Outer progress showing prayers done of today */}
                  <svg className="absolute w-full h-full -rotate-90 pointer-events-none p-1" viewBox="0 0 300 300">
                    <circle 
                      cx="150" 
                      cy="150" 
                      r="140" 
                      className="stroke-stone-100/70 dark:stroke-stone-800/60" 
                      strokeWidth="3" 
                      fill="transparent" 
                    />
                    <motion.circle 
                      id="radial-ring"
                      cx="150" 
                      cy="150" 
                      r="140" 
                      className={colors.strokePri} 
                      strokeWidth="6" 
                      fill="transparent" 
                      strokeDasharray="880"
                      strokeLinecap="round"
                      animate={{ strokeDashoffset }}
                      transition={{ type: "spring", stiffness: 80, damping: 15 }}
                    />
                  </svg>

                  {/* Circle textual stats */}
                  <div className="flex flex-col justify-center items-center text-center p-6 select-none">
                    
                    <div className="flex items-center gap-1.5 text-stone-400 dark:text-stone-500 text-xs font-semibold mb-1">
                      <Flame className={`w-4 h-4 transition-all duration-700 ${commitmentDays > 0 ? 'text-amber-500 fill-amber-400' : 'text-stone-300 dark:text-stone-600'}`} />
                      <span>أيام الالتزام</span>
                    </div>

                    {/* Massive Count Days */}
                    <AnimatePresence mode="popLayout">
                      <motion.span 
                        id="counter-digits"
                        key={commitmentDays}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={`text-5xl md:text-6xl font-black ${colors.textPri} tabular-nums tracking-tighter`}
                      >
                        {commitmentDays}
                      </motion.span>
                    </AnimatePresence>

                    {/* Sub text */}
                    <span className="text-stone-500 dark:text-stone-400 text-xs md:text-sm font-semibold mt-1">
                      يوم كامل صليته
                    </span>

                    {/* Today indicator */}
                    <span className={`text-[9px] font-bold ${colors.textPri} ${colors.bgSoft} px-2.5 py-0.5 rounded-full mt-3`}>
                      اليوم: {totalChecked} من 5 صلوات
                    </span>

                  </div>
                </motion.div>

                {/* Sub-adjusters directly beneath circle */}
                <div className="flex items-center gap-4 mt-3.5 z-20">
                  
                  {/* Decrement days */}
                  <button
                    id="btn-decrement-streak"
                    disabled={commitmentDays === 0}
                    onClick={handleDecrementDays}
                    className={`p-1.5 rounded-full border border-stone-200/60 dark:border-stone-800 transition-all duration-200 cursor-pointer bg-white dark:bg-stone-900 shadow-xs ${
                      commitmentDays === 0 
                        ? 'opacity-45 cursor-not-allowed text-stone-300 dark:text-stone-600' 
                        : 'text-stone-500 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/30 hover:bg-red-50/10'
                    }`}
                    title="تراجع بخطوة يوم واحد (-1)"
                  >
                    <RotateCcw className="w-3.5 h-3.5 rotate-180" />
                  </button>

                  {/* Custom direct streak setup */}
                  <button
                    id="btn-edit-manual"
                    onClick={() => {
                      setCustomInputValue(commitmentDays.toString());
                      setCustomInputOpen(true);
                    }}
                    className={`p-1 px-3 ml-1 rounded-full border border-stone-200 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400 ${colors.textPriHoverDirect} ${colors.borderHover} transition-all cursor-pointer bg-white dark:bg-stone-900 shadow-xs flex items-center gap-1 font-medium`}
                    title="تهيئة الأيام السابقة يدوياً"
                  >
                    <FileEdit className="w-3 h-3" />
                    <span>تعديل الأيام يدوياً</span>
                  </button>

                  {/* Reset Counter Button */}
                  <div className="relative">
                    {!showResetConfirm ? (
                      <button
                        id="btn-confirm-trigger"
                        onClick={() => setShowResetConfirm(true)}
                        className="p-1.5 rounded-full border border-stone-200/60 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50/10 transition-all cursor-pointer bg-white dark:bg-stone-900 shadow-xs"
                        title="البدء في التتبع من جديد"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute bottom-0 -left-12 -right-12 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-red-100 dark:border-red-900/30 p-1 flex items-center justify-center gap-1 z-30"
                      >
                        <button
                          id="btn-reset-approve"
                          onClick={handleResetStreak}
                          className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] text-stone-600 dark:text-stone-300 px-1 font-semibold">تصفير؟</span>
                        <button
                          id="btn-reset-cancel"
                          onClick={() => setShowResetConfirm(false)}
                          className="p-1 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-300 rounded-lg cursor-pointer transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    )}
                  </div>

                </div>

              </div>

              {/* 🕒 NEXT PRAYER COUNTDOWN BANNER (سوريا حلب منبج) */}
              {prayerCountdown && (
                <div 
                  id="prayer-countdown-banner"
                  className={`w-full mt-4 p-4 rounded-3xl border ${colors.borderSoftThin} ${colors.bgSoftFlat} backdrop-blur-xs flex flex-col gap-3.5 transition-all duration-300 relative overflow-hidden`}
                >
                  {/* Decorative background aura */}
                  <div className={`absolute -right-10 -bottom-10 w-28 h-28 rounded-full filter blur-xl opacity-20 pointer-events-none ${pinkMode ? 'bg-pink-500' : 'bg-emerald-500'}`} />
                  
                  {/* Top Bar: Location & Header */}
                  <div className="flex justify-between items-center relative z-10 font-sans">
                    <div className="flex items-center gap-1 text-xs font-semibold text-stone-500 dark:text-stone-400">
                      <span className="text-sm">📍</span>
                      <span>منبج، حلب - سوريا</span>
                    </div>
                    
                    {/* Expand/Collapse Button for today times */}
                    <button
                      id="toggle-all-times"
                      onClick={() => {
                        setShowAllTimes(!showAllTimes);
                        playSoundEffect('tap');
                      }}
                      className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg border cursor-pointer select-none transition-all ${
                        showAllTimes 
                          ? `${colors.bgPri} border-transparent text-white`
                          : `bg-stone-100/80 dark:bg-stone-850/80 hover:bg-stone-200/80 dark:hover:bg-stone-800/80 border-stone-200/50 dark:border-stone-800 text-stone-600 dark:text-stone-300`
                      }`}
                    >
                      <span>مواقيت اليوم</span>
                      <ChevronDown className={`w-3 h-3 transition-transform duration-350 ${showAllTimes ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Dynamic Accordion list of all today's times */}
                  <AnimatePresence>
                    {showAllTimes && (
                      <motion.div
                        id="today-times-accordion"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden relative z-10 border-b border-dashed border-stone-200/40 dark:border-stone-800 pb-2.5 font-sans"
                      >
                        <div className="grid grid-cols-5 gap-1.5 text-center mt-1">
                          {[
                            { id: 'fajr', label: 'الفجر', val: todayPrayers.fajr },
                            { id: 'dhuhr', label: 'الظهر', val: todayPrayers.dhuhr },
                            { id: 'asr', label: 'العصر', val: todayPrayers.asr },
                            { id: 'maghrib', label: 'المغرب', val: todayPrayers.maghrib },
                            { id: 'isha', label: 'العشاء', val: todayPrayers.isha },
                          ].map((item) => {
                            const isCurrent = prayerCountdown.currentPrayerId === item.id;
                            const isNext = prayerCountdown.nextPrayerId === item.id;
                            return (
                              <div 
                                key={item.id} 
                                className={`p-1.5 rounded-xl border flex flex-col justify-center items-center gap-0.5 transition-all ${
                                  isNext 
                                    ? `${colors.borderSoft} ${colors.bgSoft} scale-102 shadow-xs`
                                    : isCurrent
                                      ? 'border-stone-300 dark:border-stone-700 bg-stone-100/40 dark:bg-stone-800/20'
                                      : 'border-stone-100 dark:border-stone-800/40 bg-transparent'
                                }`}
                              >
                                <span className={`text-[9px] font-black ${isNext ? colors.textPri : 'text-stone-400 dark:text-stone-500'}`}>
                                  {item.label}
                                  {isNext && <span className="block text-[7px] font-bold">(التالي)</span>}
                                </span>
                                <span className={`text-[10px] font-bold tabular-nums tracking-tighter ${isNext ? 'text-stone-800 dark:text-stone-100 font-extrabold' : 'text-stone-600 dark:text-stone-400'}`}>
                                  {formatPrayerTime(item.val)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Main Countdown Presentation */}
                  <div className="flex items-center justify-between relative z-10 font-sans">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold">الصلاة القادمة:</span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className={`text-sm md:text-base font-black ${colors.textPri}`}>
                          صلاة {prayerCountdown.nextPrayerArabic}
                        </span>
                        <span className="text-[10px] md:text-xs font-bold text-stone-500 dark:text-stone-400 tabular-nums">
                          في {formatPrayerTime(prayerCountdown.nextPrayerTime)}
                        </span>
                      </div>
                    </div>
                    
                    {/* The countdown numbers display */}
                    <div className="flex items-center gap-1 text-center font-mono" dir="ltr">
                      <div className="flex flex-col items-center">
                        <div className="bg-stone-100/60 dark:bg-stone-900/40 rounded-lg py-1 px-2.5 border border-stone-200/30 dark:border-stone-800">
                          <span className={`text-base font-black tabular-nums tracking-tight ${colors.textPri}`}>
                            {String(prayerCountdown.hoursLeft).padStart(2, '0')}
                          </span>
                        </div>
                        <span className="text-[8px] font-bold text-stone-400 dark:text-stone-500 mt-1 uppercase font-sans">ساعة</span>
                      </div>
                      
                      <span className={`text-sm font-bold ${colors.textPri} animate-pulse px-0.5`}>:</span>

                      <div className="flex flex-col items-center">
                        <div className="bg-stone-100/60 dark:bg-stone-900/40 rounded-lg py-1 px-2.5 border border-stone-200/30 dark:border-stone-800">
                          <span className={`text-base font-black tabular-nums tracking-tight ${colors.textPri}`}>
                            {String(prayerCountdown.minutesLeft).padStart(2, '0')}
                          </span>
                        </div>
                        <span className="text-[8px] font-bold text-stone-400 dark:text-stone-500 mt-1 uppercase font-sans">دقيقة</span>
                      </div>
                      
                      <span className={`text-sm font-bold ${colors.textPri} animate-pulse px-0.5`}>:</span>

                      <div className="flex flex-col items-center">
                        <div className="bg-stone-100/60 dark:bg-stone-900/40 rounded-lg py-1 px-2.5 border border-stone-200/30 dark:border-stone-800">
                          <span className={`text-base font-black tabular-nums tracking-tight ${colors.textPri}`}>
                            {String(prayerCountdown.secondsLeft).padStart(2, '0')}
                          </span>
                        </div>
                        <span className="text-[8px] font-bold text-stone-400 dark:text-stone-500 mt-1 uppercase font-sans">ثانية</span>
                      </div>
                    </div>
                  </div>

                  {/* Remaining Progress Bar */}
                  <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-900/60 rounded-full overflow-hidden relative z-10 border border-stone-200/20 dark:border-stone-800/20">
                    <motion.div 
                      className={`h-full rounded-full ${pinkMode ? 'bg-gradient-to-r from-pink-500 to-rose-400' : 'bg-gradient-to-r from-[#066A38] to-emerald-400'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${prayerCountdown.progressPercent}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              )}

              {/* 📋 THE 5 DAILY PRAYERS CARDS (هل صليت؟) */}
              <div className="w-full mt-5 space-y-2">
                {/* Retroactive Day Edit warning indicator */}
                {selectedDateString !== getLocalDateString(new Date()) && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 w-full mb-1 relative overflow-hidden"
                  >
                    <span>⚠️</span>
                    <span>استدراك: أنت تستعرض وتعدل صلوات يوم سابق مأخوذ من الروزنامة.</span>
                  </motion.div>
                )}

                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                    {selectedDateString === getLocalDateString(new Date()) 
                      ? "متابعة فروض اليوم وحالة الأداء:" 
                      : `فروض يوم ${getFriendlyArabicDate(selectedDateString)}:`
                    }
                  </span>
                  <span className={`text-[10px] ${colors.textPri} font-bold`}>سجل فروضك وادخل لأذكارها</span>
                </div>
                
                <div className="grid grid-cols-5 gap-1.5 md:gap-2">
                  {PRAYERS_LIST.map((prayer) => {
                    const checked = prayedStatus[prayer.id];
                    return (
                      <div 
                        key={prayer.id} 
                        className="flex flex-col gap-1 relative group"
                      >
                        {/* Core Interactive Card */}
                        <button
                          id={`btn-prayer-${prayer.id}`}
                          onClick={() => handleTogglePrayer(prayer.id, prayer.label)}
                          className={`flex flex-col items-center justify-between p-2.5 rounded-2xl border transition-all duration-300 cursor-pointer text-center h-[90px] ${
                            checked
                              ? colors.bgQuickLaunchActive
                              : colors.bgQuickLaunchInactive
                          }`}
                        >
                          <span className="text-lg md:text-xl">{prayer.icon}</span>
                          <span className="text-xs font-bold leading-none">{prayer.label}</span>
                          
                          {/* Visual Check Indicator */}
                          <div className={`rounded-full p-0.5 transition-all ${checked ? ('bg-white ' + (pinkMode ? 'text-pink-600' : 'text-[#066A38]')) : 'bg-stone-100 dark:bg-stone-800 text-stone-300 dark:text-stone-600'}`}>
                            {checked ? (
                              <Check className="w-3 h-3 stroke-[4]" />
                            ) : (
                              <div className="w-3 h-3" />
                            )}
                          </div>
                        </button>

                        {/* Interactive Post-Prayer Adhkar quick launcher */}
                        <button
                          id={`btn-prayer-dhikr-${prayer.id}`}
                          onClick={() => startDhikrSession(prayer.id, prayer.label)}
                          className={`py-1 px-1.5 rounded-xl text-[9px] font-semibold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            checked
                              ? (pinkMode ? 'bg-pink-50 dark:bg-pink-950/20 text-pink-650 dark:text-pink-400 border-pink-150 hover:bg-pink-100' : 'bg-emerald-50 dark:bg-emerald-950/40 text-[#066A38] dark:text-emerald-400 border-emerald-100/80 dark:border-emerald-900/40 hover:bg-emerald-100')
                              : 'bg-stone-50 dark:bg-stone-800/80 text-stone-400 dark:text-stone-500 border-stone-100 dark:border-stone-800 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                          }`}
                          title={`أذكار ما بعد صلاة ${prayer.label}`}
                        >
                          <span>📿 أذكار</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Propose reading Adhkar modal helper logic */}
              <AnimatePresence>
                {proposingAdhkarFor && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`w-full mt-3.5 p-3 rounded-2xl border flex items-center justify-between gap-3 ${colors.bgSoftFlat} ${colors.borderSoftThin}`}
                  >
                    <div className="text-right">
                      <p className="text-xs font-bold text-stone-800 dark:text-stone-200">لقد أديت صلاة {proposingAdhkarFor.label} تقبل الله! 👋</p>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">هل تريد تلاوة الأذكار والتسبيحات المأثورة عنها الآن؟</p>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        id="propose-adhkar-join"
                        onClick={() => startDhikrSession(proposingAdhkarFor.id, proposingAdhkarFor.label)}
                        className={`py-1.5 px-3.5 text-white text-[11px] font-bold rounded-xl cursor-pointer transition-colors shadow-xs ${colors.bgPri} ${colors.bgPriHover}`}
                      >
                        تلاوة الأذكار 📿
                      </button>
                      
                      <button
                        id="propose-adhkar-dismiss"
                        onClick={() => setProposingAdhkarFor(null)}
                        className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-350 rounded-lg cursor-pointer transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 2 زر الضغط التفاعلي - لتسجيل يوم سليم التزام متكامل */}
              <div className="w-full mt-4">
                <AnimatePresence mode="wait">
                  {isDayFullyCompleted && (
                    <motion.button
                      key="commit-btn"
                      id="btn-primary-action"
                      onClick={handleCommitCompletedDay}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-full py-3.5 px-6 rounded-2xl text-white font-bold text-sm shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 border animate-pulse ${colors.bgPri} ${colors.bgPriHover} ${pinkMode ? 'border-pink-500' : 'border-emerald-500'}`}
                    >
                      <span>إتمام وتسجيل يوم التزام جديد بالصلوات! ✨</span>
                      <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          ) : (
            
            // --- 📿 INTERACTIVE DHIKR & TASBIH SYSTEM: Post-Prayer Adhkar ---
            <motion.div 
              key="active-dhikr-stage"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full bg-white dark:bg-stone-900 transition-colors rounded-3xl p-5 border border-stone-100 dark:border-stone-800 shadow-md relative text-right"
            >
              
              {/* Header inside supplication session */}
              <div className="flex justify-between items-center pb-3.5 border-b border-stone-100 dark:border-stone-800 mb-4 font-sans">
                
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">📿</span>
                  <div>
                    <h2 className="text-xs font-bold text-stone-500 dark:text-stone-400">أذكار بعد الصلاة المفروضة</h2>
                    <p className={`text-xs font-black ${colors.textPri}`}>صلاة {activeSession.prayerLabel}</p>
                  </div>
                </div>

                {/* Progress dot step indicators */}
                <div className="text-[10px] text-stone-400 dark:text-stone-500 font-bold bg-stone-50 dark:bg-stone-950 px-2 py-0.5 rounded-full">
                  الخطوة {activeSession.currentIndex + 1} من {activeSession.adhkars.length}
                </div>

                {/* Cancel current session */}
                <button
                  id="btn-quit-session"
                  onClick={() => {
                    playSoundEffect('cancel');
                    setActiveSession(null);
                  }}
                  className="p-1 px-2.5 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 font-semibold text-[10px] text-stone-500 dark:text-stone-400 rounded-xl cursor-pointer transition-colors border border-stone-200 dark:border-stone-700"
                >
                  الخروج والعودة
                </button>

              </div>

              {/* Progress bar visualizer */}
              <div className="w-full h-1 bg-stone-100 dark:bg-stone-800 rounded-full mb-5 flex max-w-lg overflow-hidden gap-0.5">
                {activeSession.adhkars.map((item, idx) => {
                  const subCount = activeSession.counts[item.id] || 0;
                  const isCurrent = activeSession.currentIndex === idx;
                  const isPast = activeSession.currentIndex > idx;
                  
                  return (
                    <div 
                      key={item.id}
                      className="flex-1 h-full rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: isCurrent 
                          ? (pinkMode ? '#db2777' : '#066A38') 
                          : isPast 
                          ? (pinkMode ? '#f43f5e' : '#10b981') 
                          : 'rgba(120, 113, 108, 0.15)',
                        opacity: isCurrent ? 1 : 0.7
                      }}
                    />
                  );
                })}
              </div>

              {/* Supplication text with slide animation */}
              <div className="min-h-[170px] md:min-h-[190px] flex flex-col justify-center py-4 text-center bg-stone-50 dark:bg-stone-950 rounded-2xl px-4 border border-stone-100 dark:border-stone-800 mb-6 font-sans">
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSession.currentIndex}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-2"
                  >
                    <p id="dhikr-title-text" className={`text-sm md:text-base font-bold ${colors.textPri} leading-relaxed select-text`}>
                      {activeSession.adhkars[activeSession.currentIndex].text}
                    </p>
                    <p id="dhikr-desc-text" className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal select-text">
                      {activeSession.adhkars[activeSession.currentIndex].note}
                    </p>
                  </motion.div>
                </AnimatePresence>

              </div>

              {/* 🎯 CORE INTERACTIVE MULTI-CLICKABLE TASBIH (العداد التفاعلي للأذكار) */}
              <div className="flex flex-col items-center justify-center mb-6 font-sans">
                
                <motion.div 
                  id="tasbih-touch-area"
                  onClick={handleTapDhikr}
                  whileTap={{ scale: 0.94 }}
                  className={`w-48 h-48 rounded-full border-2 border-dashed flex flex-col justify-center items-center cursor-pointer relative group select-none transition-colors ${pinkMode ? 'bg-pink-500/4 dark:bg-pink-500/5 border-pink-500/30 dark:border-pink-500/30 hover:bg-pink-500/8 dark:hover:bg-pink-500/10 hover:border-pink-500/50 dark:hover:border-pink-500/50' : 'bg-[#066A38]/4 dark:bg-emerald-500/5 border-[#066A38]/30 dark:border-emerald-500/30 hover:bg-[#066A38]/8 dark:hover:bg-emerald-500/10 hover:border-[#066A38]/50 dark:hover:border-emerald-500/50'}`}
                >
                  
                  {/* Dynamic Circular dash stroke indicator for the current supplication progress */}
                  <svg className="absolute w-full h-full -rotate-90 pointer-events-none p-1" viewBox="0 0 200 200">
                    <circle 
                      cx="100" 
                      cy="100" 
                      r="90" 
                      className="stroke-stone-100 dark:stroke-stone-800/60" 
                      strokeWidth="2" 
                      fill="transparent" 
                    />
                    <motion.circle 
                      cx="100" 
                      cy="100" 
                      r="90" 
                      className={colors.strokePri} 
                      strokeWidth="4" 
                      fill="transparent" 
                      strokeDasharray="565" // circum of R=90 is ~565
                      animate={{ 
                        strokeDashoffset: 565 - (565 * ((activeSession.counts[activeSession.adhkars[activeSession.currentIndex].id] || 0) / activeSession.adhkars[activeSession.currentIndex].target))
                      }}
                      transition={{ type: "spring", stiffness: 80, damping: 15 }}
                    />
                  </svg>

                  {/* Count displaying large and clear */}
                  <span className={`text-4xl font-black tabular-nums mt-1 ${colors.textPri}`}>
                    {activeSession.counts[activeSession.adhkars[activeSession.currentIndex].id] || 0}
                  </span>
                  
                  <span className="text-xs text-stone-400 dark:text-stone-500 font-bold mt-1">
                    المستهدف: {activeSession.adhkars[activeSession.currentIndex].target}
                  </span>

                  {/* Accent guide overlay inside circle */}
                  <div className="absolute bottom-5 text-[9px] font-bold text-stone-500 animate-pulse flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${pinkMode ? 'bg-pink-500' : 'bg-[#066A38]'}`}></span>
                    <span>اضغط هنا للتسبيح</span>
                  </div>

                </motion.div>

                {/* Left and Right navigation manual controls */}
                <div className="flex items-center gap-8 mt-4 w-full justify-between px-6">
                  
                  {/* Previous Item */}
                  <button
                    id="btn-dhikr-prev"
                    disabled={activeSession.currentIndex === 0}
                    onClick={handlePrevDhikr}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 transition-all cursor-pointer ${
                      activeSession.currentIndex === 0 
                        ? 'opacity-40 cursor-not-allowed text-stone-300 dark:text-stone-600' 
                        : `text-stone-600 dark:text-stone-300 ${colors.textPriHoverDirect} hover:bg-stone-50 dark:hover:bg-stone-800`
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>السابق</span>
                  </button>

                  <div className="text-[10px] text-stone-400 dark:text-stone-500 font-semibold select-all">
                    تلاوة وتدبّر بتمهل وخشوع
                  </div>

                  {/* Next Item */}
                  <button
                    id="btn-dhikr-next"
                    disabled={activeSession.currentIndex + 1 >= activeSession.adhkars.length}
                    onClick={handleNextDhikr}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 transition-all cursor-pointer ${
                      activeSession.currentIndex + 1 >= activeSession.adhkars.length
                        ? 'opacity-40 cursor-not-allowed text-stone-300 dark:text-stone-600' 
                        : `text-stone-600 dark:text-stone-300 ${colors.textPriHoverDirect} hover:bg-stone-50 dark:hover:bg-stone-800`
                    }`}
                  >
                    <span>التالي</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                </div>

              </div>

              {/* End of session checklist validation */}
              {activeSession.currentIndex + 1 === activeSession.adhkars.length && 
               (activeSession.counts[activeSession.adhkars[activeSession.currentIndex].id] || 0) >= activeSession.adhkars[activeSession.currentIndex].target && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-4 rounded-2xl border text-center space-y-3 ${colors.bgSoft} ${colors.borderSoft}`}
                >
                  <p className={`text-xs font-bold ${colors.textPri}`}>أحسنت! لقد أتممت كامل الأذكار والتسبيحات بنجاح {pinkMode ? '🌸' : '🌿'}</p>
                  
                  <button
                    id="btn-finish-dhikr-session"
                    onClick={() => {
                      playSoundEffect('finish');
                      // Auto toggle the prayer to DONE if not checked
                      setPrayedStatus(prev => ({
                        ...prev,
                        [activeSession.prayerId]: true
                      }));
                      // Quit
                      setActiveSession(null);
                    }}
                    className={`py-2.5 px-6 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors inline-block animate-pulse ${colors.bgPri} ${colors.bgPriHover}`}
                  >
                    إنهاء الجلسة والخصم لصفحة الصلوات
                  </button>
                </motion.div>
              )}

            </motion.div>

          )}
        </AnimatePresence>

      </main>

      {/* 3 الشريط السفلي المساعد (Status Bar & Dynamic Quotes) */}
      <footer className="w-full max-w-md z-10 font-sans">
        <div 
          onClick={cyclePhrase}
          className={`group bg-white dark:bg-stone-900 ${colors.bgSoftHover} border border-stone-200/50 dark:border-stone-800/80 rounded-2xl p-4 cursor-pointer text-center relative transition-all duration-300`}
          title="انقر لتغيير التذكير أو الحكمة"
        >
          {/* Decorative bar */}
          <div className={`absolute top-0 right-4 w-8 h-0.5 ${pinkMode ? 'bg-pink-600 dark:bg-pink-500' : 'bg-[#066A38] dark:bg-emerald-500'}`}></div>

          <div className="text-center">
            <p id="motivational-quote" className={`text-xs font-semibold text-stone-700 dark:text-stone-300 leading-relaxed ${colors.textPriHover} transition-colors duration-200`}>
              {MOTIVATIONAL_PHRASES[phraseIndex]}
            </p>
          </div>

        </div>

      </footer>

      {/* ⚙️ LIGHTWEIGHT OVERLAYS - MODALS AND INPUT PANELS */}

      {/* Celebration & Congratulatory Modal (Activated immediately when 5th prayer checked) */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div 
            id="modal-celebrate"
            className={`absolute inset-0 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in ${pinkMode ? 'bg-pink-900/30 dark:bg-stone-950/60' : 'bg-[#066A38]/30 dark:bg-stone-950/60'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className={`bg-white dark:bg-stone-900 rounded-3xl p-6 w-full max-w-sm relative shadow-2xl text-center border ${colors.borderDialog}`}
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="flex justify-center mb-3">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${colors.bgDialogDecoration}`}>
                  <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                </div>
              </div>

              <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-2">تقبل الله منك طاعتك! 🎉</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-6">
                الحمد لله، لقد أتممت جميع الصلوات الخمس بنجاح لليوم. واصل هذا الالتزام ولا تضيعه، وسجل رصيد التزامك المتواصل الآن لترقيه بهمتك وجبر خاطرك!
              </p>

              <div className="space-y-2">
                <button 
                  id="confirm-day-commit"
                  onClick={handleCommitCompletedDay}
                  className={`w-full py-3.5 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm ${colors.bgPri} ${colors.bgPriHover}`}
                >
                  <Sparkles className="w-4 h-4 fill-amber-300 text-amber-300" />
                  <span>تسجيل يوم التزام جديد (+1) للغد</span>
                </button>
                <button 
                  id="cancel-celebrate"
                  onClick={() => setShowCelebration(false)}
                  className="w-full py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-semibold rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                >
                  العودة لمراجعة صلوات اليوم
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Entry/Override Modal for Streak */}
      <AnimatePresence>
        {customInputOpen && (
          <motion.div 
            id="modal-custom-value"
            className="absolute inset-0 bg-stone-900/40 dark:bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 text-right font-sans"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white dark:bg-stone-900 rounded-3xl p-6 w-full max-w-sm border border-stone-200 dark:border-stone-800 relative shadow-2xl"
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="absolute top-4 left-4">
                <button 
                  id="close-manual-input"
                  onClick={() => setCustomInputOpen(false)}
                  className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-full transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-base font-bold text-stone-800 dark:text-stone-100 mb-1 mt-1">تعديل رصيد أيام الالتزام</h2>
              <p className="text-xs text-stone-400 dark:text-stone-500 mb-4 leading-relaxed">قم بتهيئة أو إدخال عدد الأيام التي أديت فيها فرضك مسبقاً لمواصلة تتبع رصيدك هنا بسهولة وسلاسة.</p>

              <form onSubmit={handleCustomSubmit} className="space-y-4">
                <input 
                  id="input-manual-val"
                  type="number"
                  min="0"
                  max="9999"
                  required
                  value={customInputValue}
                  onChange={(e) => setCustomInputValue(e.target.value)}
                  className={`w-full text-center text-3xl font-bold py-3 px-4 bg-stone-50 dark:bg-stone-950 border-2 border-stone-200 dark:border-stone-800 rounded-2xl focus:outline-hidden text-stone-800 dark:text-stone-100 transition-colors tabular-nums ${colors.focusBorder}`}
                  placeholder="0"
                  autoFocus
                />
                
                <div className="flex gap-2">
                  <button 
                    id="submit-manual-val"
                    type="submit"
                    className={`flex-1 py-3 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer ${colors.bgPri} ${colors.bgPriHover}`}
                  >
                    حفظ التعديل
                  </button>
                  <button 
                    id="cancel-manual-val"
                    type="button"
                    onClick={() => setCustomInputOpen(false)}
                    className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-sm font-semibold rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Commitment Calendar Modal */}
      <AnimatePresence>
        {showCalendarModal && (
          <motion.div 
            id="modal-calendar"
            className="absolute inset-0 bg-stone-900/40 dark:bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-right font-sans"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white dark:bg-stone-900 rounded-3xl p-5 w-full max-w-sm border border-stone-200 dark:border-stone-800 relative shadow-2xl text-right overflow-y-auto max-h-[90vh]"
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="absolute top-4 left-4 z-20">
                <button 
                  id="close-calendar"
                  onClick={() => setShowCalendarModal(false)}
                  className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-full transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-2">
                <CommitmentCalendar
                  prayerHistory={prayerHistory}
                  selectedDateString={selectedDateString}
                  onSelectDate={(dateStr) => {
                    setSelectedDateString(dateStr);
                    setShowCalendarModal(false);
                  }}
                  pinkMode={pinkMode}
                  colors={colors}
                  playSoundEffect={playSoundEffect}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cloud Account & Auth Modal */}
      <AnimatePresence>
        {showAuthModal && user && (
          <motion.div 
            id="modal-auth-profile"
            className="absolute inset-0 bg-stone-900/40 dark:bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-right font-sans"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white dark:bg-stone-900 rounded-3xl p-6 w-full max-w-sm border border-stone-200 dark:border-stone-800 relative shadow-2xl text-center"
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="absolute top-4 left-4">
                <button 
                  id="close-auth-modal"
                  onClick={() => setShowAuthModal(false)}
                  className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-full transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col items-center mt-3 mb-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black mb-3 ring-4 ring-offset-4 ring-stone-50 dark:ring-stone-900 border-2
                  ${user.avatarColor === 'pink' ? 'bg-pink-500 text-pink-50 border-pink-400' :
                    user.avatarColor === 'amber' ? 'bg-amber-500 text-amber-50 border-amber-400' :
                    user.avatarColor === 'blue' ? 'bg-blue-500 text-blue-50 border-blue-400' :
                    user.avatarColor === 'indigo' ? 'bg-indigo-500 text-indigo-50 border-indigo-400' :
                    'bg-emerald-500 text-emerald-50 border-emerald-400'} shadow-md text-center`}
                >
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-8 h-8" />}
                </div>
                
                <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100">{user.displayName}</h3>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{user.email || "حساب محاكاة محلي"}</p>
              </div>

              <div className={`p-4 rounded-2xl border ${colors.borderSoft} ${colors.bgSoft} text-right flex flex-col gap-3 mb-5`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">الربط السحابي:</span>
                  <div className="flex items-center gap-1.5">
                    <CloudSyncIcon state={cloudSyncState} />
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                      {cloudSyncState === 'synced' ? "نشط ومحفوظ" : 
                       cloudSyncState === 'syncing' ? "جاري الحفظ..." : 
                       "خطأ في الاتصال"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-stone-200/40 dark:border-stone-800/60 pt-2.5">
                  <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">أيام الالتزام بالصلوات:</span>
                  <span className={`text-sm font-bold ${colors.textPri}`}>
                    {commitmentDays} {commitmentDays === 1 ? 'يوم' : commitmentDays === 2 ? 'يومان' : 'أيام'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    playSoundEffect('cancel');
                    setShowAuthModal(false);
                    setUser(null);
                    localStorage.removeItem('prayer_mock_user');
                    setCloudSyncState('offline');
                  }}
                  className="flex-1 py-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-450 text-sm font-semibold rounded-2xl transition-all cursor-pointer border border-rose-200/40 dark:border-rose-900/30"
                >
                  تسجيل الخروج
                </button>
                <button
                  onClick={() => {
                    playSoundEffect('tap');
                    setShowAuthModal(false);
                  }}
                  className={`flex-1 py-3 text-white text-sm font-bold rounded-2xl transition-all cursor-pointer ${colors.bgPri} ${colors.bgPriHover}`}
                >
                  موافق
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simulated Google Cloud Sign-In Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div 
            id="modal-mock-login"
            className="absolute inset-0 bg-stone-900/45 dark:bg-stone-950/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-right font-sans"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white dark:bg-stone-900 rounded-3xl p-6 w-full max-w-sm border border-stone-200 dark:border-stone-800 relative shadow-2xl text-right"
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="absolute top-4 left-4">
                <button 
                  id="close-login-modal"
                  onClick={() => setShowLoginModal(false)}
                  className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-full transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col items-center mt-3 mb-5 text-center">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-3 ${colors.bgDialogDecoration}`}>
                  <Cloud className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-base font-black text-stone-800 dark:text-stone-100">تفعيل الحفظ السحابي</h3>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 max-w-[260px] leading-relaxed">
                  احفظ مستواك وأيام التزامك بالصلوات سحابياً بشكل مستقل ومباشر في متصفحك اليوم!
                </p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                setIsSimulatingLogin(true);
                playSoundEffect('tap');
                
                // Simulate sweet loading/syncing
                setTimeout(() => {
                  const mockUser = {
                    uid: "mock-user-" + Math.floor(Math.random() * 10000),
                    displayName: mockNameInput.trim() || "يا رفيقي",
                    email: mockEmailInput.trim() || "demo@prayer.local",
                    photoURL: null, // we will use colored avatar
                    avatarColor: mockAvatarColor
                  };
                  setUser(mockUser);
                  localStorage.setItem('prayer_mock_user', JSON.stringify(mockUser));
                  setCloudSyncState('synced');
                  setIsSimulatingLogin(false);
                  setShowLoginModal(false);
                  playSoundEffect('finish');
                }, 1000);
              }} className="flex flex-col gap-3.5 mb-2">
                
                {/* Custom Name */}
                <div className="flex flex-col gap-1 text-right">
                  <label className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wide mr-1">
                    اسم رفيق الصلاة (الاسم المستعار):
                  </label>
                  <input 
                    type="text" 
                    value={mockNameInput}
                    onChange={(e) => setMockNameInput(e.target.value)}
                    required
                    maxLength={30}
                    className={`w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 text-xs text-right bg-stone-50/60 dark:bg-stone-900 focus:outline-none transition-all ${colors.focusBorder} dark:text-stone-100 font-medium`}
                    placeholder="امّ إبراهيم، رفيق الصلاة..."
                  />
                </div>

                {/* Custom Email */}
                <div className="flex flex-col gap-1 text-right">
                  <label className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wide mr-1">
                    البريد الإلكتروني (اختياري محاكاة):
                  </label>
                  <input 
                    type="email" 
                    value={mockEmailInput}
                    onChange={(e) => setMockEmailInput(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 text-xs text-right bg-stone-50/60 dark:bg-stone-900 focus:outline-none transition-all ${colors.focusBorder} dark:text-stone-100 font-mono`}
                    placeholder="email@example.com"
                  />
                </div>

                {/* Avatar presets selector */}
                <div className="flex flex-col gap-1 text-right">
                  <label className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wide mr-1">
                    اختر لون شارة حسابك:
                  </label>
                  <div className="flex justify-between items-center gap-2 mt-1">
                    {[
                      { key: 'emerald', bg: 'bg-emerald-500', border: 'border-emerald-600' },
                      { key: 'pink', bg: 'bg-pink-500', border: 'border-pink-600' },
                      { key: 'amber', bg: 'bg-amber-500', border: 'border-amber-600' },
                      { key: 'blue', bg: 'bg-blue-500', border: 'border-blue-600' },
                      { key: 'indigo', bg: 'bg-indigo-500', border: 'border-indigo-600' }
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setMockAvatarColor(item.key)}
                        className={`w-8 h-8 rounded-full ${item.bg} border-2 ${mockAvatarColor === item.key ? 'scale-110 ring-2 ring-stone-300 dark:ring-stone-600' : 'opacity-70'} hover:scale-105 active:scale-95 transition-all cursor-pointer`}
                      />
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    disabled={isSimulatingLogin}
                    onClick={() => {
                      playSoundEffect('cancel');
                      setShowLoginModal(false);
                    }}
                    className="flex-1 py-3 bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-500 dark:text-stone-400 text-xs font-semibold rounded-2xl transition-all cursor-pointer border border-stone-200/50 dark:border-stone-750/30"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSimulatingLogin}
                    className={`flex-1 py-3 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${colors.bgPri} ${colors.bgPriHover}`}
                  >
                    {isSimulatingLogin ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري المزامنة...</span>
                      </>
                    ) : (
                      <span>مزامنة مجانية فورية ☁️</span>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
