const preference = matchMedia('(prefers-reduced-motion: reduce)');
const ease = 'cubic-bezier(.16,1,.3,1)';
const played = new WeakSet();
const animations = new Set();
let observer;

function play(element, frames, options = {}) {
  if (!element || preference.matches || played.has(element)) return;
  played.add(element);
  const {duration=760, delay=0} = options;
  let firstFrame, secondFrame, timeout;
  const cleanup = () => {
    cancelAnimationFrame(firstFrame);
    cancelAnimationFrame(secondFrame);
    clearTimeout(timeout);
    for (const key of ['transition', 'transform', 'opacity']) element.style.removeProperty(key);
    animations.delete(animation);
  };
  const animation = {cancel:cleanup};
  animations.add(animation);
  element.style.transition = 'none';
  element.style.transform = frames[0].transform || 'none';
  element.style.opacity = frames[0].opacity;
  firstFrame = requestAnimationFrame(() => {
    secondFrame = requestAnimationFrame(() => {
      element.style.transition = `transform ${duration}ms ${ease} ${delay}ms, opacity ${duration}ms ${ease} ${delay}ms`;
      element.style.transform = frames[frames.length-1].transform || 'none';
      element.style.opacity = frames[frames.length-1].opacity;
      timeout = setTimeout(cleanup, duration + delay + 60);
    });
  });
}

function setupMotion() {
  if (preference.matches) return;
  play(document.querySelector('.header-logo'), [{opacity:0, transform:'translateY(-8px)'}, {opacity:1, transform:'none'}], {duration:650});
  play(document.querySelector('.brand-descriptor'), [{opacity:0}, {opacity:1}], {delay:100});
  play(document.querySelector('.header-booking'), [{opacity:0, transform:'translateY(-6px)'}, {opacity:1, transform:'none'}], {duration:650, delay:140});
  const items = [
    ['.services-heading h1', 0, 'title'],
    ['.service-card', 70, 'card'],
    ['.form-content h2', 0, 'title'],
    ['.intro', 90, 'text'],
    ['.form-fields .field', 70, 'text'],
    ['.appointment .submit', 150, 'text'],
    ['.consent', 180, 'text'],
    ['.portrait', 100, 'photo'],
    ['.footer-invitation', 0, 'text'],
    ['.footer-booking', 90, 'title'],
    ['.footer-links', 90, 'text'],
    ['.footer-logo img', 0, 'wordmark'],
    ['.footer-bottom', 90, 'text']
  ];
  const settings = new WeakMap();
  observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const {delay, type} = settings.get(entry.target);
      const frames = type === 'wordmark'
        ? [{opacity:.35, transform:'translateY(38%)'}, {opacity:1, transform:'none'}]
        : type === 'photo'
        ? [{opacity:.5, transform:'translateY(12px)'}, {opacity:1, transform:'none'}]
        : type === 'title'
        ? [{opacity:0, transform:'translateY(18px)'}, {opacity:1, transform:'none'}]
        : [{opacity:0, transform:`translateY(${type === 'card' ? 20 : 12}px)`}, {opacity:1, transform:'none'}];
      play(entry.target, frames, {delay, duration:type === 'wordmark' ? 1150 : type === 'photo' ? 950 : 740});
      observer.unobserve(entry.target);
    }
  }, {threshold:.08, rootMargin:'0px 0px -24px 0px'});
  for (const [selector, stagger, type] of items) {
    document.querySelectorAll(selector).forEach((element, index) => {
      settings.set(element, {delay:stagger * (index % 3), type});
      observer.observe(element);
    });
  }
}
setupMotion();
preference.addEventListener('change', () => {
  observer?.disconnect();
  animations.forEach(animation => animation.cancel());
  animations.clear();
  if (!preference.matches) setupMotion();
});

// A small photographic drift, without changing the layout or the carousel's transforms.
const portrait = document.querySelector('.portrait img');
let scheduled = false;
function drift() {
  scheduled = false;
  if (preference.matches || !portrait) return;
  const section = document.querySelector('.appointment').getBoundingClientRect();
  if (section.bottom < 0 || section.top > innerHeight) return;
  const progress = Math.max(0, Math.min(1, (innerHeight - section.top) / (innerHeight + section.height)));
  portrait.style.transform = `translateY(${(progress - .5) * 8}px)`;
}
addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(drift); } }, {passive:true});
preference.addEventListener('change', () => { if (preference.matches && portrait) portrait.style.removeProperty('transform'); });
