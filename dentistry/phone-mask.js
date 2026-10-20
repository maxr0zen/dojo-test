/** One shared mask for the page and every cloned booking form. */
export function formatPhone(value) {
  let digits = value.replace(/\D/g, '');
  if (!digits) return '';
  if (/^[78]/.test(digits)) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  let result = '+7';
  if (digits.length) result += ` (${digits.slice(0, 3)}`;
  if (digits.length >= 3) result += ')';
  if (digits.length > 3) result += ` ${digits.slice(3, 6)}`;
  if (digits.length > 6) result += ` ${digits.slice(6, 8)}`;
  if (digits.length > 8) result += ` ${digits.slice(8, 10)}`;
  return result;
}

export function bindPhoneMask(input) {
  input.addEventListener('paste', event => {
    const text = event.clipboardData?.getData('text') || '';
    if (text.replace(/\D/g, '').length < 10) return;
    event.preventDefault();
    input.value = formatPhone(text);
    input.setSelectionRange(input.value.length, input.value.length);
    input.dispatchEvent(new Event('input', {bubbles:true}));
  });
  input.addEventListener('blur', () => {
    if (input.value.replace(/\D/g, '') === '7') input.value = '';
  });
  input.addEventListener('beforeinput', event => {
    const backward = event.inputType === 'deleteContentBackward';
    const forward = event.inputType === 'deleteContentForward';
    if ((!backward && !forward) || input.selectionStart !== input.selectionEnd) return;
    let index = input.selectionStart - (backward ? 1 : 0);
    if (index < 0 || index >= input.value.length || /\d/.test(input.value[index])) return;
    while (index >= 0 && index < input.value.length && !/\d/.test(input.value[index])) index += backward ? -1 : 1;
    if (index >= 0 && index < input.value.length) input.setSelectionRange(index, index + 1);
  });
  input.addEventListener('input', () => {
    const raw = input.value;
    const caret = input.selectionStart;
    const atEnd = caret === raw.length;
    let digitOffset = raw.slice(0, caret).replace(/\D/g, '').length;
    if (raw && !/^[78]/.test(raw.replace(/\D/g, ''))) digitOffset++;
    input.value = formatPhone(raw);
    let position = input.value.length;
    if (!atEnd) {
      let count = 0;
      position = 0;
      while (position < input.value.length && count < digitOffset) {
        if (/\d/.test(input.value[position])) count++;
        position++;
      }
    }
    input.setSelectionRange(position, position);
  });
}
