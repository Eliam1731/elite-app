const BUSINESS_TIME_ZONE = "America/Mexico_City";

function getDatePart(parts: Intl.DateTimeFormatPart[], type: "year" | "month" | "day") {
  return parts.find((part) => part.type === type)?.value ?? "";
}

export function getTodayForDateInput(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = getDatePart(parts, "year");
  const month = getDatePart(parts, "month");
  const day = getDatePart(parts, "day");

  return `${year}-${month}-${day}`;
}

export function isValidDateInputValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isDueDateTodayOrLater(value: string) {
  return isValidDateInputValue(value) && value >= getTodayForDateInput();
}
