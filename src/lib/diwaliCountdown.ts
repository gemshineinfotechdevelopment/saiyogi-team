// Known exact Diwali dates (Amavasya during Kartik month)
const DIWALI_DATES: Record<number, string> = {
  2024: "2024-11-01T00:00:00+05:30",
  2025: "2025-10-20T00:00:00+05:30",
  2026: "2026-11-08T00:00:00+05:30",
  2027: "2027-10-29T00:00:00+05:30",
  2028: "2028-10-17T00:00:00+05:30",
  2029: "2029-11-05T00:00:00+05:30",
  2030: "2030-10-26T00:00:00+05:30",
  2031: "2031-11-14T00:00:00+05:30",
  2032: "2032-11-02T00:00:00+05:30",
  2033: "2033-10-22T00:00:00+05:30",
  2034: "2034-11-10T00:00:00+05:30",
  2035: "2035-10-30T00:00:00+05:30",
  2036: "2036-10-19T00:00:00+05:30",
  2037: "2037-11-08T00:00:00+05:30",
  2038: "2038-10-27T00:00:00+05:30",
  2039: "2039-10-17T00:00:00+05:30",
  2040: "2040-11-04T00:00:00+05:30",
};

/**
 * Gets or computes the Diwali date for any given year automatically.
 * Uses exact lookup if available, or Metonic 19-year lunar cycle estimation for future years.
 */
export function getDiwaliDateForYear(year: number): Date {
  if (DIWALI_DATES[year]) {
    return new Date(DIWALI_DATES[year]);
  }

  // 19-year Metonic cycle calculation for accurate lunar calendar alignment
  const metonicBaseYear = 2024 + Math.abs((year - 2024) % 19);
  const baseDateStr = DIWALI_DATES[metonicBaseYear] || `${metonicBaseYear}-11-01T00:00:00+05:30`;
  const baseDate = new Date(baseDateStr);

  const estimatedDate = new Date(baseDate);
  estimatedDate.setFullYear(year);
  return estimatedDate;
}

export interface UpcomingDiwaliInfo {
  targetDate: Date;
  year: number;
  formattedDate: string;
}

/**
 * Automatically finds the upcoming Diwali celebration.
 * If today is before this year's Diwali, returns this year's date.
 * If this year's Diwali has passed, automatically rolls over to next year's Diwali.
 */
export function getUpcomingDiwaliInfo(): UpcomingDiwaliInfo {
  const now = new Date();
  const currentYear = now.getFullYear();

  const thisYearDiwali = getDiwaliDateForYear(currentYear);

  // If today is before this year's Diwali (including the full Diwali day until midnight)
  const diwaliDayEnd = new Date(thisYearDiwali);
  diwaliDayEnd.setHours(23, 59, 59, 999);

  let targetYear = currentYear;
  let targetDate = thisYearDiwali;

  if (now > diwaliDayEnd) {
    targetYear = currentYear + 1;
    targetDate = getDiwaliDateForYear(targetYear);
  }

  return {
    targetDate,
    year: targetYear,
    formattedDate: targetDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
}

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function calculateTimeLeft(targetDate: Date): TimeLeft {
  const now = new Date().getTime();
  const difference = targetDate.getTime() - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((difference / 1000 / 60) % 60);
  const seconds = Math.floor((difference / 1000) % 60);

  return { days, hours, minutes, seconds };
}
