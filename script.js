// ── Hero: slow zoom on load ──
window.addEventListener('load', () => {
  const hero = document.querySelector('.hero');
  if (hero) hero.classList.add('loaded');
  createParticles();
});

// ── Floating particles ──
function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  const count = 20;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');

    const size    = Math.random() * 3 + 1.4;          // 1.4–4.4 px
    const left    = Math.random() * 100;               // % across screen
    const top     = 20 + Math.random() * 75;           // % — keep away from edges
    const dur     = Math.random() * 14 + 14;           // 14–28 s
    const delay   = Math.random() * -24;               // stagger start
    const drift   = (Math.random() - 0.5) * 70;       // horizontal wander
    const opacity = (Math.random() * 0.14 + 0.07).toFixed(3); // 0.07–0.21

    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${left}%;
      top: ${top}%;
      --p-opacity: ${opacity};
      --p-drift: ${drift}px;
      animation-duration: ${dur}s;
      animation-delay: ${delay}s;
    `;

    container.appendChild(p);
  }
}

// ── Scroll-triggered card & label entrance ──
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // fire once
      }
    });
  },
  { threshold: 0.12 }
);

// Observe section label
const label = document.querySelector('.section-label');
if (label) observer.observe(label);

// Observe cards with staggered delay
document.querySelectorAll('.card').forEach((card, i) => {
  card.style.transitionDelay = `${i * 0.13}s`;
  observer.observe(card);

  // Remove stagger delay after entrance so hover transitions feel instant
  card.addEventListener('transitionend', () => {
    card.style.transitionDelay = '0s';
  }, { once: true });
});
