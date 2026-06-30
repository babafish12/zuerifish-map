import type { FishRule, FishStatus } from "../types";

const MONTH_DAY_PATTERN = /^\d{2}-\d{2}$/;

export function getFishStatus(rule: Pick<FishRule, "dailyLimit" | "protectedAllYear" | "closedSeason" | "localRestrictionWarning">, today = new Date()): FishStatus {
  if (rule.protectedAllYear || rule.dailyLimit === "protected") {
    return "protected";
  }

  if (rule.closedSeason === null) {
    return rule.localRestrictionWarning ? "unclear" : "allowed";
  }

  if (!rule.closedSeason || !isValidMonthDay(rule.closedSeason.start) || !isValidMonthDay(rule.closedSeason.end)) {
    return "unclear";
  }

  if (isDateInClosedSeason(today, rule.closedSeason.start, rule.closedSeason.end)) {
    return "closed";
  }

  return rule.localRestrictionWarning ? "unclear" : "allowed";
}

export function isDateInClosedSeason(today: Date, start: string, end: string): boolean {
  const current = toMonthDayNumber(today);
  const startNumber = monthDayToNumber(start);
  const endNumber = monthDayToNumber(end);

  if (startNumber === null || endNumber === null) {
    return false;
  }

  if (startNumber <= endNumber) {
    return current >= startNumber && current <= endNumber;
  }

  return current >= startNumber || current <= endNumber;
}

function toMonthDayNumber(date: Date): number {
  return (date.getMonth() + 1) * 100 + date.getDate();
}

function isValidMonthDay(value: string): boolean {
  return monthDayToNumber(value) !== null;
}

function monthDayToNumber(value: string): number | null {
  if (!MONTH_DAY_PATTERN.test(value)) {
    return null;
  }

  const [monthText, dayText] = value.split("-");
  const month = Number(monthText);
  const day = Number(dayText);
  const daysInMonth = new Date(2024, month, 0).getDate();

  if (month < 1 || month > 12 || day < 1 || day > daysInMonth) {
    return null;
  }

  return month * 100 + day;
}
