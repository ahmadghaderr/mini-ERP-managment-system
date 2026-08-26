// Centralized date formatting so every page's dates respond to the
// currently selected app language, instead of falling back to the
// browser's default locale (which ignores our language toggle entirely).
//
// Numerals are kept as standard Western digits (0-9) even in Arabic mode
// via the "-u-nu-latn" locale extension — this matches common Lebanese
// business/tech convention. If Eastern Arabic numerals (٠-٩) are wanted
// instead, drop that suffix from AR_LOCALE below.

const AR_LOCALE = "ar-LB-u-nu-latn";
const EN_LOCALE = "en-US";

function resolveLocale(language: string): string {
  return language === "ar" ? AR_LOCALE : EN_LOCALE;
}

export function formatLocalDate(
  dateStr: string | Date,
  language: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString(resolveLocale(language), options);
}

export function formatLocalDateTime(
  dateStr: string | Date,
  language: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return date.toLocaleString(resolveLocale(language), options);
}

export function formatLocalTime(
  dateStr: string | Date,
  language: string,
): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return date.toLocaleTimeString(resolveLocale(language), {
    hour: "2-digit",
    minute: "2-digit",
  });
}