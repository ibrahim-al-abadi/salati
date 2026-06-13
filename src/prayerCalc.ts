/**
 * Prayer Times calculator for Manbij, Aleppo, Syria
 * Coordinates: Latitude 36.5281° N, Longitude 37.9547° E
 * Timezone: UTC+3 (Asia/Damascus)
 */

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime() + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

const d2r = (d: number) => (d * Math.PI) / 180;
const r2d = (r: number) => (r * 180) / Math.PI;

export interface PrayerTime {
  id: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  label: string;
  arabicLabel: string;
  time: Date;
  timeStr: string;
}

export function calculateManbijPrayers(date: Date): Record<'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', Date> {
  const lat = 36.5281;
  const lng = 37.9547;
  const tz = 3.0; // Syria timezone UTC+3

  const d = getDayOfYear(date);

  // Fractional year (rad)
  const gamma = (2 * Math.PI / 365) * (d - 1);

  // Equation of time (minutes)
  const eqt = 229.18 * (
    0.000075 +
    0.001868 * Math.cos(gamma) -
    0.032077 * Math.sin(gamma) -
    0.014615 * Math.cos(2 * gamma) -
    0.040849 * Math.sin(2 * gamma)
  );

  // Sun declination (radians)
  const decl = 0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.001480 * Math.sin(3 * gamma);

  // Solar noon limit
  const dhuhrDecimal = 12 + tz - (lng / 15) - (eqt / 60);

  // Hour angle helper
  const hourAngle = (zenithDeg: number, isMorning: boolean) => {
    const latRad = d2r(lat);
    const cosZ = Math.cos(d2r(zenithDeg));
    const numerator = cosZ - Math.sin(latRad) * Math.sin(decl);
    const denominator = Math.cos(latRad) * Math.cos(decl);
    const cosH = numerator / denominator;

    if (cosH > 1) return isMorning ? 0 : 24;
    if (cosH < -1) return isMorning ? 24 : 0;

    const hDeg = r2d(Math.acos(cosH));
    const hHours = hDeg / 15;
    return isMorning ? dhuhrDecimal - hHours : dhuhrDecimal + hHours;
  };

  // Fajr: Syrian Ministry of Awqaf / Levant standard matches around 18.5 or 19.5 degrees
  // Let's use 18.5 degrees depression
  const fajrDecimal = hourAngle(90 + 18.5, true);

  // Sunset is 90.833 degrees zenith (Maghrib)
  const maghribDecimal = hourAngle(90.833, false);

  // Isha is 17 degrees depression (standard Levant/Syrian custom often 17.5° or 90 minutes after Maghrib, but 17° is very close)
  const ishaDecimal = hourAngle(90 + 17, false);

  // Asr (Standard Method - Shafi'i, Maliki, Hanbali)
  const latRad = d2r(lat);
  const diff = Math.abs(latRad - decl);
  const altRad = Math.atan(1 / (1 + Math.tan(diff)));
  const cosHAsr = (Math.sin(altRad) - Math.sin(latRad) * Math.sin(decl)) / (Math.cos(latRad) * Math.cos(decl));
  let asrDecimal = dhuhrDecimal + r2d(Math.acos(Math.max(-1, Math.min(1, cosHAsr)))) / 15;

  const decimalToDate = (decimal: number) => {
    const resultDate = new Date(date);
    let totalMinutes = Math.round(decimal * 60);
    if (totalMinutes < 0) totalMinutes += 1440;
    if (totalMinutes >= 1440) totalMinutes -= 1440;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    resultDate.setHours(hours, minutes, 0, 0);
    return resultDate;
  };

  return {
    fajr: decimalToDate(fajrDecimal),
    dhuhr: decimalToDate(dhuhrDecimal),
    asr: decimalToDate(asrDecimal),
    maghrib: decimalToDate(maghribDecimal),
    isha: decimalToDate(ishaDecimal),
  };
}

// Function to find the countdown/remaining time and current active/next prayer
export interface NextPrayerInfo {
  currentPrayerId: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  nextPrayerId: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  nextPrayerArabic: string;
  nextPrayerTime: Date;
  hoursLeft: number;
  minutesLeft: number;
  secondsLeft: number;
  progressPercent: number; // For progression visual bar
}

export function getNextPrayerInfo(now: Date): NextPrayerInfo {
  const todayPrayers = calculateManbijPrayers(now);
  
  // Also get tomorrow's prayers for case after Isha
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowPrayers = calculateManbijPrayers(tomorrow);

  const prayersArray: Array<{ id: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'; arabic: string; time: Date }> = [
    { id: 'fajr', arabic: 'الفجر', time: todayPrayers.fajr },
    { id: 'dhuhr', arabic: 'الظهر', time: todayPrayers.dhuhr },
    { id: 'asr', arabic: 'العصر', time: todayPrayers.asr },
    { id: 'maghrib', arabic: 'المغرب', time: todayPrayers.maghrib },
    { id: 'isha', arabic: 'العشاء', time: todayPrayers.isha },
  ];

  let nextIdx = -1;
  for (let i = 0; i < prayersArray.length; i++) {
    if (now < prayersArray[i].time) {
      nextIdx = i;
      break;
    }
  }

  let nextPrayerId: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  let nextPrayerArabic: string;
  let nextPrayerTime: Date;
  let currentPrayerId: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  let lastPrayerTime: Date;

  if (nextIdx === -1) {
    // It's after Isha. Next prayer is tomorrow's Fajr
    nextPrayerId = 'fajr';
    nextPrayerArabic = 'الفجر (غداً)';
    nextPrayerTime = tomorrowPrayers.fajr;
    currentPrayerId = 'isha';
    lastPrayerTime = todayPrayers.isha;
  } else {
    nextPrayerId = prayersArray[nextIdx].id;
    nextPrayerArabic = prayersArray[nextIdx].arabic;
    nextPrayerTime = prayersArray[nextIdx].time;
    if (nextIdx === 0) {
      // Before Fajr. Last prayer was yesterday's Isha
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayPrayers = calculateManbijPrayers(yesterday);
      currentPrayerId = 'isha';
      lastPrayerTime = yesterdayPrayers.isha;
    } else {
      currentPrayerId = prayersArray[nextIdx - 1].id;
      lastPrayerTime = prayersArray[nextIdx - 1].time;
    }
  }

  const diffMs = nextPrayerTime.getTime() - now.getTime();
  const totalDuration = nextPrayerTime.getTime() - lastPrayerTime.getTime();
  
  const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
  const minutesLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const secondsLeft = Math.floor((diffMs % (1000 * 60)) / 1000);

  // Progression between the last prayer and next prayer
  const progressPercent = Math.max(0, Math.min(100, ((now.getTime() - lastPrayerTime.getTime()) / totalDuration) * 100));

  return {
    currentPrayerId,
    nextPrayerId,
    nextPrayerArabic,
    nextPrayerTime,
    hoursLeft,
    minutesLeft,
    secondsLeft,
    progressPercent
  };
}

export function formatPrayerTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
}
