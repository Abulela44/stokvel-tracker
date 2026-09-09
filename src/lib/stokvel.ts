export const FREE_MEMBER_LIMIT = 15;
export const MIN_CONTRIBUTION = 100;
export const MAX_CONTRIBUTION = 2000;

export function randFormat(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? "-" : "";
  const digits = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}R${digits}`;
}

/** Turns a South African number into the wa.me digits format (27...). */
export function toWaNumber(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("27")) return digits;
  if (digits.startsWith("0")) return `27${digits.slice(1)}`;
  if (digits.length === 9) return `27${digits}`;
  return digits;
}

export function waLink(phone: string, message: string): string {
  const number = toWaNumber(phone);
  const text = encodeURIComponent(message);
  return number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
}

/** Local-part safe id used for the account behind a phone number. */
export function phoneToLogin(phone: string): string {
  return `${toWaNumber(phone)}@stokvel.sa`;
}

export function isValidSaPhone(phone: string): boolean {
  const n = toWaNumber(phone);
  return /^27\d{9}$/.test(n);
}

export function monthsElapsed(year: number, now = new Date()): number {
  if (year < now.getFullYear()) return 12;
  if (year > now.getFullYear()) return 0;
  return now.getMonth() + 1;
}

export function dueDateLabel(meetingDay: number, now = new Date()): string {
  const day = Math.min(Math.max(meetingDay, 1), 28);
  const date = new Date(now.getFullYear(), now.getMonth(), day);
  if (date < now) date.setMonth(date.getMonth() + 1);
  return `${date.getDate()} ${date.toLocaleString("en-ZA", { month: "long" })}`;
}
