const MONTH_DAY_PATTERN = /^(\d{1,2})\. ([A-Za-zäöüÄÖÜ]+)$/;
const MONTH_BY_NAME: Record<string, number> = {
  januar: 1,
  februar: 2,
  märz: 3,
  maerz: 3,
  april: 4,
  mai: 5,
  juni: 6,
  juli: 7,
  august: 8,
  september: 9,
  oktober: 10,
  november: 11,
  dezember: 12
};

export type RestrictionPeriodTone = "active" | "inactive";

export interface RestrictionPeriodStatus {
  isActive: boolean;
  isYearRound: boolean;
  label: string;
  tone: RestrictionPeriodTone;
}

export function getRestrictionPeriodStatus(period: string, date = new Date()): RestrictionPeriodStatus {
  if (period.toLowerCase().includes("ganzjährig")) {
    return {
      isActive: true,
      isYearRound: true,
      label: "ganzjährig aktiv",
      tone: "active"
    };
  }

  const range = parseRestrictionPeriodRange(period);

  if (!range) {
    return {
      isActive: false,
      isYearRound: false,
      label: "Zeitraum unklar",
      tone: "inactive"
    };
  }

  const isActive = isMonthDayRangeActive(range.start, range.end, date);

  return {
    isActive,
    isYearRound: false,
    label: isActive ? "heute aktiv" : "saisonal, heute nicht aktiv",
    tone: isActive ? "active" : "inactive"
  };
}

export function isRestrictionPeriodActive(period: string, date = new Date()): boolean {
  return getRestrictionPeriodStatus(period, date).isActive;
}

function parseRestrictionPeriodRange(period: string): { start: number; end: number } | null {
  const [startText, endText] = period.split(/\s+bis\s+/i);

  if (!startText || !endText) {
    return null;
  }

  const start = parseGermanMonthDay(startText.trim());
  const end = parseGermanMonthDay(endText.trim());

  if (start === null || end === null) {
    return null;
  }

  return { start, end };
}

function parseGermanMonthDay(value: string): number | null {
  const match = MONTH_DAY_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = MONTH_BY_NAME[match[2].toLowerCase()];

  if (!month) {
    return null;
  }

  const daysInMonth = new Date(2024, month, 0).getDate();

  if (day < 1 || day > daysInMonth) {
    return null;
  }

  return month * 100 + day;
}

function isMonthDayRangeActive(start: number, end: number, date: Date): boolean {
  const today = (date.getMonth() + 1) * 100 + date.getDate();

  if (start <= end) {
    return today >= start && today <= end;
  }

  return today >= start || today <= end;
}
