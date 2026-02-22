// ── Create floating petals ──
const petalsContainer = document.getElementById('petals');
for (let i = 0; i < 20; i++) {
  const petal = document.createElement('div');
  petal.className = 'petal';
  petal.style.left = Math.random() * 100 + '%';
  petal.style.animationDuration = (8 + Math.random() * 12) + 's';
  petal.style.animationDelay = (Math.random() * 15) + 's';
  petal.style.width = (8 + Math.random() * 8) + 'px';
  petal.style.height = (10 + Math.random() * 8) + 'px';
  petal.style.opacity = 0;
  petalsContainer.appendChild(petal);
}

// ── Create sparkles on card ──
const sparklesContainer = document.getElementById('sparkles');
for (let i = 0; i < 12; i++) {
  const sparkle = document.createElement('div');
  sparkle.className = 'sparkle';
  sparkle.style.left = (10 + Math.random() * 80) + '%';
  sparkle.style.top = (10 + Math.random() * 80) + '%';
  sparkle.style.animationDelay = (Math.random() * 3) + 's';
  sparkle.style.width = (2 + Math.random() * 4) + 'px';
  sparkle.style.height = sparkle.style.width;
  sparklesContainer.appendChild(sparkle);
}

// ── Envelope interaction ──
function openEnvelope() {
  const envelope = document.getElementById('envelope');
  const letter = document.getElementById('letter');

  envelope.classList.add('opened');

  setTimeout(() => {
    letter.classList.add('visible');
  }, 600);
}

function closeLetter() {
  const letter = document.getElementById('letter');
  const envelope = document.getElementById('envelope');

  letter.classList.remove('visible');

  setTimeout(() => {
    envelope.classList.remove('opened');
  }, 600);
}
