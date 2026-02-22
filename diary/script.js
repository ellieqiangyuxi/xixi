/* ── Storage keys ── */
const PIN_KEY     = 'diary_pin';
const ENTRIES_KEY = 'diary_entries';

/* ── State ── */
let pinInput      = '';
let confirmingPin = '';
let pendingPhoto  = null;
let isUnlocked    = false;
let currentDetailId = null;

/* ── Elements ── */
const pinScreen   = document.getElementById('pin-screen');
const pinLabel    = document.getElementById('pin-label');
const pinDotsEl   = document.getElementById('pin-dots');
const dots        = pinDotsEl.querySelectorAll('.dot');
const journal     = document.getElementById('journal');
const entryDetail = document.getElementById('entry-detail');
const entriesList = document.getElementById('entries-list');
const emptyState  = document.getElementById('empty-state');
const modal       = document.getElementById('modal');

/* ════════════════════════════════════
   PIN LOGIC
════════════════════════════════════ */

function init() {
  const saved = localStorage.getItem(PIN_KEY);
  pinLabel.textContent = saved ? 'enter pin' : 'choose a 4-digit pin';
}

function handleDigit(digit) {
  if (pinInput.length >= 4) return;
  pinInput += digit;
  updateDots();
  if (pinInput.length === 4) setTimeout(processPin, 180);
}

function handleBackspace() {
  if (!pinInput.length) return;
  pinInput = pinInput.slice(0, -1);
  updateDots();
}

function updateDots() {
  dots.forEach((dot, i) => {
    dot.classList.toggle('filled', i < pinInput.length);
    dot.classList.remove('error');
  });
}

function processPin() {
  const saved = localStorage.getItem(PIN_KEY);

  if (!saved) {
    /* Setting new PIN — two-step confirmation */
    if (!confirmingPin) {
      confirmingPin = pinInput;
      pinInput = '';
      updateDots();
      pinLabel.textContent = 'confirm pin';
    } else if (pinInput === confirmingPin) {
      localStorage.setItem(PIN_KEY, pinInput);
      unlock();
    } else {
      showPinError("pins don't match — try again");
      confirmingPin = '';
    }
  } else {
    if (pinInput === saved) {
      unlock();
    } else {
      showPinError('incorrect pin');
    }
  }
}

function showPinError(msg) {
  dots.forEach(d => d.classList.add('error'));
  pinLabel.textContent = msg;
  pinLabel.classList.add('error');
  pinDotsEl.classList.add('shaking');
  setTimeout(() => {
    pinInput = '';
    updateDots();
    pinDotsEl.classList.remove('shaking');
    pinLabel.classList.remove('error');
    const saved = localStorage.getItem(PIN_KEY);
    pinLabel.textContent = saved ? 'enter pin' : 'choose a 4-digit pin';
  }, 620);
}

function unlock() {
  isUnlocked = true;
  pinScreen.classList.add('unlocking');
  setTimeout(() => {
    pinScreen.classList.add('gone');
    journal.classList.remove('view-hidden');
    document.body.style.overflow = '';
    renderEntries();
    setTimeout(animateCards, 60);
  }, 560);
}

function lock() {
  isUnlocked = false;
  journal.classList.add('view-hidden');
  pinScreen.classList.remove('gone', 'unlocking');
  document.body.style.overflow = 'hidden';
  pinInput = '';
  confirmingPin = '';
  updateDots();
  const saved = localStorage.getItem(PIN_KEY);
  pinLabel.textContent = saved ? 'enter pin' : 'choose a 4-digit pin';
  pinLabel.classList.remove('error');
}

/* ════════════════════════════════════
   ENTRIES
════════════════════════════════════ */

function getEntries() {
  try {
    return JSON.parse(localStorage.getItem(ENTRIES_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  try {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  } catch {
    alert('Storage full — try removing some photos from older entries.');
  }
}

function formatDate(d) {
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderEntries() {
  const entries = getEntries();
  if (!entries.length) {
    entriesList.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');
  entriesList.innerHTML = entries.map(e => `
    <article class="entry-card" data-id="${e.id}">
      <p class="entry-date">${e.date}</p>
      ${e.title ? `<h2 class="entry-title">${escapeHtml(e.title)}</h2>` : ''}
      ${e.body  ? `<p class="entry-body">${escapeHtml(e.body).replace(/\n/g, '<br>')}</p>` : ''}
      ${e.photo ? `<div class="entry-photo"><img src="${e.photo}" alt="" loading="lazy"/></div>` : ''}
      <button class="delete-btn" data-id="${e.id}" aria-label="Delete entry" title="Delete">✕</button>
    </article>
  `).join('');
}

function animateCards() {
  entriesList.querySelectorAll('.entry-card:not(.visible)').forEach((card, i) => {
    setTimeout(() => card.classList.add('visible'), i * 75);
  });
}

function deleteEntry(id) {
  if (!confirm('Delete this entry?')) return;
  saveEntries(getEntries().filter(e => e.id !== Number(id)));
  if (entryDetail.classList.contains('open')) closeDetail();
  renderEntries();
  setTimeout(animateCards, 20);
}

/* ════════════════════════════════════
   DETAIL VIEW
════════════════════════════════════ */

function openDetail(id) {
  const entry = getEntries().find(e => e.id === id);
  if (!entry) return;
  currentDetailId = id;

  document.getElementById('detail-date').textContent  = entry.date;
  document.getElementById('detail-title').textContent = entry.title || '';
  document.getElementById('detail-body').textContent  = entry.body  || '';

  const photoWrap = document.getElementById('detail-photo');
  const photoImg  = document.getElementById('detail-photo-img');
  if (entry.photo) {
    photoImg.src = entry.photo;
    photoWrap.classList.remove('hidden');
  } else {
    photoImg.src = '';
    photoWrap.classList.add('hidden');
  }

  // Hide title element if empty
  document.getElementById('detail-title').style.display = entry.title ? '' : 'none';
  document.getElementById('detail-body').style.display  = entry.body  ? '' : 'none';

  entryDetail.classList.add('open');
  // Push state so browser/Android back button works
  history.pushState({ detail: id }, '');
}

function closeDetail() {
  entryDetail.classList.remove('open');
  currentDetailId = null;
}

/* ════════════════════════════════════
   MODAL
════════════════════════════════════ */

function openModal() {
  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => modal.classList.add('open'));
  });
  setTimeout(() => document.getElementById('entry-title').focus(), 400);
}

function closeModal() {
  modal.classList.remove('open');
  setTimeout(() => {
    modal.classList.add('hidden');
    resetModal();
  }, 400);
}

function resetModal() {
  document.getElementById('entry-title').value = '';
  document.getElementById('entry-body').value   = '';
  document.getElementById('photo-preview-wrap').classList.add('hidden');
  document.getElementById('photo-preview').src  = '';
  document.getElementById('photo-input').value  = '';
  pendingPhoto = null;
}

function postEntry() {
  const title = document.getElementById('entry-title').value.trim();
  const body  = document.getElementById('entry-body').value.trim();
  if (!title && !body && !pendingPhoto) return;

  const entries = getEntries();
  entries.unshift({
    id:    Date.now(),
    title: title,
    body:  body,
    photo: pendingPhoto,
    date:  formatDate(new Date())
  });
  saveEntries(entries);
  closeModal();
  setTimeout(() => {
    renderEntries();
    setTimeout(animateCards, 20);
  }, 420);
}

/* ════════════════════════════════════
   PHOTO HANDLING
════════════════════════════════════ */

function resizeImage(file, maxWidth, quality) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
        const canvas = document.createElement('canvas');
        canvas.width  = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handlePhotoSelect(file) {
  if (!file) return;
  pendingPhoto = await resizeImage(file, 900, 0.72);
  document.getElementById('photo-preview').src = pendingPhoto;
  document.getElementById('photo-preview-wrap').classList.remove('hidden');
}

/* ════════════════════════════════════
   EVENT LISTENERS
════════════════════════════════════ */

/* Keypad buttons */
document.querySelectorAll('.key[data-digit]').forEach(key => {
  key.addEventListener('click', () => {
    key.classList.add('pressed');
    setTimeout(() => key.classList.remove('pressed'), 120);
    handleDigit(key.dataset.digit);
  });
});

document.getElementById('key-back').addEventListener('click', handleBackspace);

/* Physical keyboard for PIN */
document.addEventListener('keydown', e => {
  if (isUnlocked) return;
  if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
  if (e.key === 'Backspace') handleBackspace();
});

/* Journal controls */
document.getElementById('lock-btn').addEventListener('click', lock);
document.getElementById('new-entry-btn').addEventListener('click', openModal);

/* Modal controls */
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-backdrop').addEventListener('click', closeModal);
document.getElementById('post-btn').addEventListener('click', postEntry);

document.getElementById('photo-input').addEventListener('change', e => {
  handlePhotoSelect(e.target.files[0]);
});

document.getElementById('remove-photo').addEventListener('click', () => {
  pendingPhoto = null;
  document.getElementById('photo-preview-wrap').classList.add('hidden');
  document.getElementById('photo-preview').src = '';
  document.getElementById('photo-input').value = '';
});

/* Card click — open detail or delete */
entriesList.addEventListener('click', e => {
  const del  = e.target.closest('.delete-btn');
  if (del) { deleteEntry(Number(del.dataset.id)); return; }
  const card = e.target.closest('.entry-card');
  if (card) openDetail(Number(card.dataset.id));
});

/* Detail view controls */
document.getElementById('back-btn').addEventListener('click', () => {
  history.back();
});

document.getElementById('detail-delete-btn').addEventListener('click', () => {
  if (currentDetailId) deleteEntry(currentDetailId);
});

/* Browser / Android back button */
window.addEventListener('popstate', () => {
  if (entryDetail.classList.contains('open')) closeDetail();
  else if (!modal.classList.contains('hidden')) closeModal();
});

/* Keyboard shortcuts when journal is open */
document.addEventListener('keydown', e => {
  if (!isUnlocked) return;
  if (e.key === 'Escape') {
    if (!modal.classList.contains('hidden')) closeModal();
    else if (entryDetail.classList.contains('open')) { history.back(); }
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter'
      && !modal.classList.contains('hidden')) postEntry();
});

/* ── Start ── */
init();
