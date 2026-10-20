import { submitAppointment } from './mock-api.js';
import { validateAppointment } from './validation.js';
import { serviceInfo } from './service-info.js';
import { bindPhoneMask } from './phone-mask.js';

const services = [
  ['Элайнеры','5-19418','5-9579'],['Имплантация','5-19429','5-9590'],['Брекеты','5-19440','5-9601'],
  ['Терапия','5-19451','5-9613'],['Гигиена полости рта','5-19463','5-9624'],['Хирургия','5-19478','5-9639'],
  ['Гнатология','5-19489','5-9650'],['Протезирование','5-28469','5-18631'],['Эстетическая стоматология','5-28481','5-18642']
];
const track = document.querySelector('.service-track');
const pageForm = document.querySelector('.appointment form');
const dialog = document.querySelector('.modal');
const modalBody = dialog.querySelector('.modal-body');
const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)').matches;
let dragMoved = false;
let returnFocus = null;

/** Consultation opens booking; the arrow opens the service overview. */
function ServiceCard([title, desktop, mobile], index) {
  const card = document.createElement('article');
  card.style.setProperty('--card-order', index);
  card.style.setProperty('--card-mask', `url('assets/${desktop}-imgSubtract.png')`);
  card.style.setProperty('--card-mask-mobile', `url('assets/${mobile}-imgSubtract.png')`);
  card.className = `service-card${[services[4][0],services[8][0]].includes(title) ? ' multiline' : ''}`;
  card.innerHTML = `<picture><source media="(max-width:767px)" srcset="assets/${mobile}-imgSubtract.png"><img class="service-image" src="assets/${desktop}-imgSubtract.png" alt="" draggable="false"></picture><h2>${title}</h2><div class="card-actions"><button class="button consult" type="button">Консультация</button><button class="arrow" type="button"><picture><source media="(max-width:767px)" srcset="assets/5-9579-imgGroup71.svg"><img src="assets/5-19418-imgGroup71.svg" alt="" draggable="false"></picture></button></div>`;
  card.querySelectorAll('button').forEach(button => {
    const details = button.classList.contains('arrow');
    button.setAttribute('aria-label', `${details ? 'Подробнее об услуге' : 'Консультация'}: ${title}`);
    button.setAttribute('aria-haspopup', 'dialog');
    button.addEventListener('click', event => {
      if (!dragMoved || event.detail === 0) (details ? openServiceDetails : openService)(title, button);
    });
  });
  return card;
}
track.append(...services.map(ServiceCard));

function openDialog(title, opener = document.activeElement, serviceWindow = false) {
  dialog.classList.toggle('service-modal', serviceWindow);
  dialog.classList.remove('service-details');
  dialog.querySelector('#modal-title').textContent = title;
  modalBody.replaceChildren();
  if (!dialog.open) {
    returnFocus = opener;
    // Keep the background stationary without changing its available layout width.
    const scrollbarWidth = innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
  }
}
dialog.querySelector('.modal-close').addEventListener('click', () => dialog.close());
let backdropDown = false;
function outsideDialog(event) {
  const rect = dialog.getBoundingClientRect();
  return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
}
dialog.addEventListener('pointerdown', event => { backdropDown = outsideDialog(event); });
dialog.addEventListener('click', event => { if (backdropDown && outsideDialog(event)) dialog.close(); });
dialog.addEventListener('close', () => {
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  returnFocus?.focus({preventScroll:true});
});

function showNotice(title, message, opener) {
  openDialog(title, opener);
  const text = document.createElement('p');
  text.setAttribute('role', 'status');
  text.setAttribute('aria-live', 'polite');
  text.textContent = message;
  modalBody.append(text);
  return value => { text.textContent = value; };
}

function bindPolicy(link, notify) {
  link.addEventListener('click', event => {
    event.preventDefault();
    notify('Демонстрационная ссылка. Текст согласия должен предоставить владелец клиники. Данные формы никуда не передаются.');
  });
}

function openService(service, opener) {
  openDialog(service ? `Консультация: ${service}` : 'Запись на прием', opener, Boolean(service));
  const layout = document.createElement('div');
  layout.className = service ? 'service-modal-layout' : 'general-booking-layout';
  const booking = document.createElement('section');
  booking.className = 'service-booking';
  booking.setAttribute('aria-label', 'Запись на консультацию');
  const heading = document.createElement('h3');
  heading.textContent = 'Записаться на консультацию';
  const intro = document.createElement('p');
  intro.className = 'modal-intro';
  intro.textContent = 'Бесплатная консультация. Это демонстрационная форма: заявка в клинику не отправляется.';
  const form = pageForm.cloneNode(true);
  form.removeAttribute('aria-busy');
  form.querySelectorAll('[id]').forEach(element => { element.id = `modal-${element.id}`; });
  form.querySelectorAll('[for]').forEach(element => { element.htmlFor = `modal-${element.htmlFor}`; });
  form.querySelectorAll('input').forEach(input => {
    input.disabled = false;
    input.removeAttribute('aria-invalid');
    input.setAttribute('aria-describedby', 'modal-feedback');
    if (input.type === 'checkbox') input.checked = true;
    else input.value = '';
  });
  const button = form.querySelector('.submit');
  button.disabled = false;
  button.removeAttribute('aria-busy');
  button.querySelector('span').textContent = 'Записаться на прием';
  const status = document.createElement('p');
  status.id = 'modal-feedback';
  status.className = 'modal-feedback';
  status.hidden = true;
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  booking.append(heading, intro, form, status);
  if (service) layout.append(createOverview(service));
  layout.append(booking);
  modalBody.append(layout);
  const notify = message => {
    status.textContent = message;
    status.hidden = false;
    status.scrollIntoView({block:'nearest'});
  };
  bindForm(form, {service, notify});
  bindPolicy(form.querySelector('.policy'), notify);
  focusServiceHeading();
}

/** Original Figma image and service-specific information are shared by both views. */
function createOverview(service) {
  const info = serviceInfo[service];
  const [, asset] = services.find(([title]) => title === service);
  const overview = document.createElement('section');
  overview.className = 'service-overview';
  overview.setAttribute('aria-label', `Об услуге: ${service}`);
  overview.innerHTML = `<img class="service-modal-image" src="assets/${asset}-imgSubtract.png" alt="${service}" width="384" height="384"><p class="service-category">${info.category}</p><p class="service-description">${info.summary}</p><h3>Что обсудить с врачом</h3><ul class="service-topics">${info.topics.map(topic => `<li>${topic}</li>`).join('')}</ul>`;
  return overview;
}

function focusServiceHeading() {
  dialog.scrollTop = 0;
  const heading = dialog.querySelector('#modal-title');
  heading.tabIndex = -1;
  heading.focus({preventScroll:true});
}

function openServiceDetails(service, opener) {
  openDialog(service, opener, true);
  dialog.classList.add('service-details');
  const overview = createOverview(service);
  const footer = document.createElement('div');
  footer.className = 'service-details-footer';
  const note = document.createElement('p');
  note.textContent = 'План, сроки и стоимость лечения определяются после обследования.';
  const book = document.createElement('button');
  book.type = 'button';
  book.className = 'button submit';
  book.textContent = 'Записаться на консультацию';
  book.addEventListener('click', () => openService(service, opener));
  footer.append(note, book);
  modalBody.append(overview, footer);
  focusServiceHeading();
}

/** The page and overlay forms share validation, loading and the replaceable API adapter. */
function bindForm(form, {service = null, notify = null} = {}) {
  const {fullName, phone, consent} = form.elements;
  bindPhoneMask(phone);
  const submit = form.querySelector('.submit');
  let pending = false;
  for (const input of [fullName, phone, consent]) {
    input.addEventListener('input', () => input.removeAttribute('aria-invalid'));
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending) return;
    const payload = {fullName:fullName.value.trim(), phone:phone.value.trim(), consent:consent.checked, service};
    const errors = validateAppointment(payload);
    [fullName, phone, consent].forEach(input => input.setAttribute('aria-invalid', String(Boolean(errors[input.name]))));
    const report = notify || (message => showNotice('Запись на прием', message, submit));
    if (Object.keys(errors).length) {
      report(Object.values(errors).join(' '));
      if (notify) form.elements[Object.keys(errors)[0]].focus();
      else returnFocus = form.elements[Object.keys(errors)[0]];
      return;
    }
    pending = true;
    form.setAttribute('aria-busy', 'true');
    submit.setAttribute('aria-busy', 'true');
    [fullName, phone, consent, submit].forEach(input => { input.disabled = true; });
    submit.querySelector('span').textContent = 'Отправка…';
    const loadingMessage = 'Выполняется демонстрационная отправка. Данные остаются в браузере.';
    // Capture this notice instance so finishing a request never replaces a subsequently opened window.
    const update = notify || showNotice('Запись на прием', loadingMessage, submit);
    if (notify) update(loadingMessage);
    try { const result = await submitAppointment(payload); update(result.message); }
    catch (error) { update(error.message); }
    finally {
      pending = false;
      form.removeAttribute('aria-busy');
      submit.removeAttribute('aria-busy');
      [fullName, phone, consent, submit].forEach(input => { input.disabled = false; });
      submit.querySelector('span').textContent = 'Записаться на прием';
    }
  });
}
bindForm(pageForm);
bindPolicy(pageForm.querySelector('.policy'), message => showNotice('Обработка персональных данных', message));

// Phones show one readable card and a preview; wider screens keep whole columns.
function cardStep() {
  return track.querySelector('article').getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap);
}
function fitTrack() {
  wheelGesture = null;
  const previousIndex = Math.round(track.scrollLeft / cardStep());
  track.style.removeProperty('--card');
  const available = document.querySelector('.service-carousel').clientWidth;
  const gap = parseFloat(getComputedStyle(track).columnGap);
  const fullCards = innerWidth >= 1000 ? 3 : 2;
  const fittedCard = innerWidth < 768
    ? Math.min(420, (available - gap) * .86)
    : (available - (fullCards - 1) * gap) / fullCards;
  track.style.setProperty('--card', `${fittedCard}px`);
  track.style.width = `${available}px`;
  scrollToCard(previousIndex, false);
}
const previousServices = document.querySelector('.service-prev');
const nextServices = document.querySelector('.service-next');
function updateServiceControls() {
  const max = track.scrollWidth - track.clientWidth;
  previousServices.disabled = track.scrollLeft < 1;
  nextServices.disabled = track.scrollLeft >= max - 1;
}
let settleTimer, pointer = null, scrollFrame = 0, inertiaFrame = 0, scrollTarget = 0, lastFrame = 0, wheelGesture = null;
let touching = false, touchStartLeft = null;
function stopInertia() {
  cancelAnimationFrame(inertiaFrame);
  inertiaFrame = 0;
}
function stopScrollAnimation() {
  stopInertia();
  cancelAnimationFrame(scrollFrame);
  scrollFrame = 0;
  scrollTarget = track.scrollLeft;
}
function animateScroll(left, smooth = true) {
  stopInertia();
  scrollTarget = Math.max(0, Math.min(left, track.scrollWidth - track.clientWidth));
  if (!smooth || reducedMotion) {
    stopScrollAnimation();
    scrollTarget = Math.max(0, Math.min(left, track.scrollWidth - track.clientWidth));
    track.scrollLeft = scrollTarget;
    updateServiceControls();
    return;
  }
  // Retarget the running motion instead of restarting a browser smooth-scroll on every tick.
  if (scrollFrame) return;
  lastFrame = performance.now();
  function frame(now) {
    const elapsed = Math.min(now - lastFrame, 50);
    lastFrame = now;
    const remaining = scrollTarget - track.scrollLeft;
    if (Math.abs(remaining) < 1) {
      track.scrollLeft = scrollTarget;
      scrollFrame = 0;
      return;
    }
    const movement = remaining * (1 - Math.exp(-elapsed / 85));
    track.scrollLeft += Math.abs(movement) < 1 ? Math.sign(remaining) : movement;
    scrollFrame = requestAnimationFrame(frame);
  }
  scrollFrame = requestAnimationFrame(frame);
}
function scrollToCard(index, smooth = true) {
  clearTimeout(settleTimer);
  animateScroll(index * cardStep(), smooth);
}
function settleTrack() {
  if (pointer || touching || scrollFrame || inertiaFrame || wheelGesture) return;
  const step = cardStep();
  let index = Math.round(track.scrollLeft / step);
  // A deliberate thumb swipe should advance a large phone card without requiring half its width.
  if (innerWidth < 768 && touchStartLeft !== null) {
    const distance = track.scrollLeft - touchStartLeft;
    const startIndex = Math.round(touchStartLeft / step);
    if (index === startIndex && Math.abs(distance) >= Math.min(60, step * .2)) index += Math.sign(distance);
  }
  touchStartLeft = null;
  scrollToCard(index);
}
track.addEventListener('touchstart', () => { touching = true; touchStartLeft = track.scrollLeft; clearTimeout(settleTimer); }, {passive:true});
track.addEventListener('touchend', () => { touching = false; settleTimer = setTimeout(settleTrack, 160); }, {passive:true});
track.addEventListener('touchcancel', () => { touching = false; touchStartLeft = null; settleTimer = setTimeout(settleTrack, 160); }, {passive:true});
track.addEventListener('scroll', () => {
  updateServiceControls();
  if (scrollFrame || inertiaFrame || pointer || wheelGesture) return;
  clearTimeout(settleTimer);
  settleTimer = setTimeout(settleTrack, 160);
}, {passive:true});
for (const [button, direction] of [[previousServices, -1], [nextServices, 1]]) {
  button.addEventListener('click', () => {
    clearTimeout(settleTimer);
    wheelGesture = null;
    scrollToCard(Math.round((scrollFrame ? scrollTarget : track.scrollLeft) / cardStep()) + direction);
  });
}
track.addEventListener('wheel', event => {
  if (event.ctrlKey) return;
  // Keep precision trackpad movement native; align the row when the gesture finishes.
  if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
    clearTimeout(settleTimer);
    wheelGesture = null;
    stopScrollAnimation();
    return;
  }
  const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? track.clientWidth : 1);
  const max = track.scrollWidth - track.clientWidth;
  if ((delta > 0 && track.scrollLeft < max - 1) || (delta < 0 && track.scrollLeft > 0)) {
    event.preventDefault();
    if (!wheelGesture) wheelGesture = {start:Math.round(track.scrollLeft / cardStep()), direction:Math.sign(delta)};
    wheelGesture.direction = Math.sign(delta);
    clearTimeout(settleTimer);
    animateScroll((scrollFrame ? scrollTarget : track.scrollLeft) + delta * 1.25);
    settleTimer = setTimeout(() => {
      let index = Math.round(scrollTarget / cardStep());
      // A short mouse-wheel gesture still advances a card instead of bouncing back.
      if (index === wheelGesture.start) index += wheelGesture.direction;
      wheelGesture = null;
      scrollToCard(index);
    }, 220);
  }
}, {passive:false});
track.addEventListener('keydown', event => {
  if (event.target !== track) return;
  if (['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) {
    event.preventDefault();
    clearTimeout(settleTimer);
    wheelGesture = null;
    scrollToCard(event.key === 'Home' ? 0 : event.key === 'End' ? services.length : Math.round((scrollFrame ? scrollTarget : track.scrollLeft) / cardStep()) + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
track.addEventListener('pointerdown', event => {
  if (!event.isPrimary) return;
  wheelGesture = null;
  dragMoved = false;
  stopScrollAnimation();
  clearTimeout(settleTimer);
  if (event.pointerType !== 'mouse' || event.button !== 0) return;
  pointer = {id:event.pointerId, x:event.clientX, left:track.scrollLeft, samples:[{time:performance.now(), left:track.scrollLeft}]};
});
window.addEventListener('pointermove', event => {
  if (!pointer || pointer.id !== event.pointerId) return;
  if (!(event.buttons & 1)) { endDrag(event, true); return; }
  const distance = event.clientX - pointer.x;
  if (dragMoved || Math.abs(distance) > 5) {
    dragMoved = true;
    event.preventDefault();
    track.classList.add('dragging');
    if (!track.hasPointerCapture(event.pointerId)) track.setPointerCapture(event.pointerId);
    track.scrollLeft = pointer.left - distance;
    const now = performance.now();
    pointer.samples.push({time:now, left:track.scrollLeft});
    while (pointer.samples.length > 2 && now - pointer.samples[0].time > 100) pointer.samples.shift();
  }
}, {passive:false});
function coast(velocity) {
  stopScrollAnimation();
  clearTimeout(settleTimer);
  let last = performance.now(), position = track.scrollLeft;
  const started = last, friction = 260;
  function frame(now) {
    const elapsed = Math.min(now - last, 50);
    last = now;
    const decay = Math.exp(-elapsed / friction);
    position += velocity * friction * (1 - decay);
    velocity *= decay;
    const max = track.scrollWidth - track.clientWidth;
    position = Math.max(0, Math.min(position, max));
    track.scrollLeft = position;
    if (Math.abs(velocity) < .035 || position <= 0 || position >= max || now - started > 1400) {
      inertiaFrame = 0;
      settleTrack();
      return;
    }
    inertiaFrame = requestAnimationFrame(frame);
  }
  inertiaFrame = requestAnimationFrame(frame);
}
function endDrag(event, cancelled = false) {
  if (!pointer || (event && pointer.id !== event.pointerId)) return;
  const finished = pointer;
  pointer = null;
  track.classList.remove('dragging');
  if (track.hasPointerCapture(finished.id)) track.releasePointerCapture(finished.id);
  const samples = finished.samples, first = samples[0], last = samples[samples.length - 1];
  const velocity = performance.now() - last.time < 80
    ? Math.max(-3, Math.min(3, (last.left - first.left) / Math.max(16, last.time - first.time))) : 0;
  if (dragMoved && !cancelled && !reducedMotion && Math.abs(velocity) > .08) coast(velocity);
  else if (dragMoved) settleTrack();
}
window.addEventListener('pointerup', event => endDrag(event));
window.addEventListener('pointercancel', event => endDrag(event, true));
window.addEventListener('blur', () => endDrag(null, true));
track.addEventListener('lostpointercapture', event => endDrag(event, true));
track.addEventListener('dragstart', event => event.preventDefault());
track.addEventListener('click', event => {
  if (dragMoved && event.detail !== 0) {
    event.preventDefault();
    event.stopImmediatePropagation();
    dragMoved = false;
  }
}, true);
window.addEventListener('resize', fitTrack);
fitTrack();

export { openService, openServiceDetails, showNotice };
