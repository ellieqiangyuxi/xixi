// ── Scroll-triggered card & label entrance ──
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

const label = document.querySelector('.section-label');
if (label) observer.observe(label);

document.querySelectorAll('.card').forEach((card, i) => {
  card.style.transitionDelay = `${i * 0.13}s`;
  observer.observe(card);

  card.addEventListener('transitionend', () => {
    card.style.transitionDelay = '0s';
  }, { once: true });
});
