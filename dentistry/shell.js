import { openService, openServiceDetails, showNotice } from './app.js';

document.addEventListener('click', event => {
  const control = event.target.closest('[data-service], [data-booking], [data-policy]');
  if (!control) return;
  const opener = control;
  if (control.hasAttribute('data-service')) openServiceDetails(control.dataset.service, opener);
  else if (control.hasAttribute('data-booking')) openService(null, opener);
  else showNotice('Обработка персональных данных', 'Демонстрационная ссылка. Текст согласия должен предоставить владелец клиники. Данные формы никуда не передаются.', opener);
});
document.querySelectorAll('[data-service], [data-booking], [data-policy]').forEach(button => button.setAttribute('aria-haspopup', 'dialog'));
