/** Validate locally; accepts RU numbers with 10 digits or an 11-digit +7/8 prefix. */
export function validateAppointment({fullName,phone,consent}) {
  const errors={};
  if (!fullName.trim()) errors.fullName='Введите ФИО.';
  else if (!/^[\p{L}\p{M} .’'\-]+$/u.test(fullName.trim()) || !/\p{L}/u.test(fullName) || fullName.trim().length<2) errors.fullName='Проверьте ФИО: используйте буквы.';
  const digits=phone.replace(/\D/g,'');
  if (!phone.trim()) errors.phone='Введите номер телефона.';
  else if (!/^\+?[\d\s()\-]+$/.test(phone) || !(phone.trim().startsWith('+') ? /^7\d{10}$/.test(digits) : /^(?:[78]\d{10}|\d{10})$/.test(digits))) errors.phone='Введите телефон: +7 и 10 цифр, например +7 (999) 999 99 99.';
  if (!consent) errors.consent='Подтвердите согласие на обработку персональных данных.';
  return errors;
}
