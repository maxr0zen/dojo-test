/** Russian phone presentation; validation and email keep the normalized number. */
export function hasPhonePrefix(value: string) {
  const digits = value.replace(/\D/g, "");
  return /^[78]/.test(digits) && (value.trimStart().startsWith("+") || digits.length > 10 || digits === "7" || digits === "8");
}

export function formatPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (hasPhonePrefix(value)) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  let result = "+7";
  if (digits.length) result += " (" + digits.slice(0, 3);
  if (digits.length >= 3) result += ")";
  if (digits.length > 3) result += "-" + digits.slice(3, 6);
  if (digits.length > 6) result += "-" + digits.slice(6, 8);
  if (digits.length > 8) result += "-" + digits.slice(8, 10);
  return result;
}
