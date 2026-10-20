/** Replace this adapter with your API call. It never sends or stores personal data.
 * The first valid submission fails once to demonstrate retry; the next succeeds.
 * Pass { outcome: 'success' | 'error', delay: 0 } for deterministic automated checks.
 */
export function createMockSubmit({ delay = 1100, outcome = 'retry-demo' } = {}) {
  let attempts = 0;
  return async function submitAppointment(_payload) {
    attempts += 1;
    await new Promise(resolve => setTimeout(resolve, delay));
    if (outcome === 'error' || (outcome === 'retry-demo' && attempts === 1)) {
      throw new Error('Демонстрационная ошибка. Заявка не отправлена. Повторите попытку — следующая завершится успешно.');
    }
    return { demo: true, message: 'Демонстрация завершена успешно. Заявка в клинику не отправлялась.' };
  };
}
export const submitAppointment = createMockSubmit();
