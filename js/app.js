// Versiyon 2.2 - Saf Sinema Modu
const MAINTENANCE_MODE = false;

let allContent = [];
let orbitalContent = [];
let filteredContent = [];
let currentOrbitalIndex = 0;

function initApp() {
  try {
    if (typeof DB === 'undefined') return;
    allContent = [...DB.movies, ...DB.series];
    orbitalContent = DB.movies.slice(0, 10); 
    filteredContent = [...allContent];

    renderOrbital();
    renderContent();
    setupEventListeners();
  } catch (err) {
    console.error("Başlatma Hatası:", err);
  }
}

// 3D ORBITAL (Sadece Afiş)
function renderOrbital() {
  const container = document.getElementById('orbital-container');
  if (!container) return;
  
  container.innerHTML = orbitalContent.map((item, index) => `
    <div class="cf-item ${getOrbitalClass(index)}" data-id="${item.id}" data-index="${index}">
      <img src="${item.poster}" alt="" onerror="this.src='https://via.placeholder.com/300x450?text=Afiş+Yok'">
    </div>
  `).join('');

  const indicator = document.getElementById('orbital-indicator');
  if (indicator) {
    const progress = ((currentOrbitalIndex + 1) / orbitalContent.length) * 100;
    indicator.style.setProperty('--progress', `${progress}%`);
  }
}

function getOrbitalClass(index) {
  const diff = index - currentOrbitalIndex;
  const len = orbitalContent.length;
  if (diff === 0) return 'active';
  let normalDiff = diff;
  if (diff < -len / 2) normalDiff += len;
  if (diff > len / 2) normalDiff -= len;
  if (normalDiff === -1) return 'prev-1';
  if (normalDiff === 1) return 'next-1';
  if (normalDiff === -2) return 'prev-2';
  if (normalDiff === 2) return 'next-2';
  return 'hidden';
}

function setOrbital(index) {
  currentOrbitalIndex = index;
  renderOrbital();
}

function nextOrbital() {
  currentOrbitalIndex = (currentOrbitalIndex + 1) % orbitalContent.length;
  renderOrbital();
}

function prevOrbital() {
  currentOrbitalIndex = (currentOrbitalIndex - 1 + orbitalContent.length) % orbitalContent.length;
  renderOrbital();
}

// MATRİS RENDER (Sadece Afiş)
function renderContent() {
  const content = document.getElementById('content-matrix');
  if (!content) return;

  content.innerHTML = `
    <div class="movie-grid">
      ${filteredContent.map(item => `
        <div class="card-wrapper" data-id="${item.id}">
          <div class="card">
            ${(item.isCollection || item.episodes) ? '<div class="card-badge">SERİ</div>' : ''}
            <img src="${item.poster}" alt="" onerror="this.src='https://via.placeholder.com/300x450?text=Afiş+Yok'">
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// AKILLI ARAMA (Sadece Input Dinleniyor)
function setupSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;

  input.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    filteredContent = allContent.filter(item => 
      (item.title && item.title.toLowerCase().includes(query)) || 
      (item.searchTags && item.searchTags.toLowerCase().includes(query))
    );
    renderContent();
  });
}

// KÜRESEL TIKLAMA YAKALAYICI
function setupEventListeners() {
  setupSearch();

  document.addEventListener('click', (e) => {
    const card = e.target.closest('.card-wrapper') || e.target.closest('.cf-item');
    if (card) {
      const id = card.dataset.id;
      const index = card.dataset.index;
      const item = allContent.find(i => i.id === id);
      if (!item) return;

      if (card.classList.contains('cf-item')) {
        const idx = parseInt(index);
        if (idx !== currentOrbitalIndex) {
          setOrbital(idx);
          return;
        }
      }

      // SERİ İSE LİSTE AÇ, DEĞİLSE DİREKT OYNAT
      if (item.episodes || item.isCollection) {
        openDetails(id);
      } else {
        openPlayer(item.file);
      }
    }

    const ep = e.target.closest('.ep-card');
    if (ep) openPlayer(ep.dataset.file);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closePlayer(); closeDetails(); }
    if (e.key === 'ArrowRight') nextOrbital();
    if (e.key === 'ArrowLeft') prevOrbital();
  });
}

// SERİ LİSTESİ PANELİ
function openDetails(id) {
  const item = allContent.find(i => i.id === id);
  if (!item) return;

  const modal = document.getElementById('details-modal');
  const grid = document.getElementById('details-grid');
  if (!modal || !grid) return;

  // Sadece başlık ve liste kalsın
  document.getElementById('details-title').textContent = item.title;
  
  // Gereksiz alanları gizle/temizle
  document.getElementById('details-poster').src = item.poster;
  document.getElementById('details-year').textContent = "";
  document.getElementById('details-rating').textContent = "";
  document.getElementById('details-type').textContent = "";
  document.getElementById('details-desc').textContent = "";

  let subItems = item.episodes || item.collection || [];

  grid.innerHTML = subItems.map(sub => `
    <div class="ep-card" data-file="${sub.file}">
      <h3>${sub.title}</h3>
      <button class="play-btn-mini">İZLE</button>
    </div>
  `).join('');

  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);
}

function closeDetails() {
  const modal = document.getElementById('details-modal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 500);
  }
}

function openPlayer(file) {
  if (!file) return;
  const modal = document.getElementById('player-modal');
  const iframe = document.getElementById('player-frame');
  if (!modal || !iframe) return;

  modal.style.display = 'flex';
  setTimeout(() => {
    modal.classList.add('active');
    iframe.src = file.includes('?') ? `${file}&autoplay=1` : `${file}?autoplay=1`;
  }, 10);
}

function closePlayer() {
  const modal = document.getElementById('player-modal');
  const iframe = document.getElementById('player-frame');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; iframe.src = ''; }, 600);
  }
}

function resetFilter() {
  filteredContent = [...allContent];
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  renderContent();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', initApp);
