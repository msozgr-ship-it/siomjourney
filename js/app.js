// Bakım Modu Kapalı
const MAINTENANCE_MODE = false;

let allContent = [];
let orbitalContent = [];
let filteredContent = [];
let currentOrbitalIndex = 0;

// UYGULAMA BAŞLATMA
function initApp() {
  try {
    if (typeof DB === 'undefined') {
      console.error("DB Dosyası Eksik!");
      return;
    }
    
    allContent = [...DB.movies, ...DB.series];
    orbitalContent = DB.movies.slice(0, 10); 
    filteredContent = [...allContent];

    renderOrbital();
    renderContent();
    setupEventListeners();
    
    console.log("SiomJourney Aktif.");
  } catch (err) {
    console.error("Başlatma Hatası:", err);
  }
}

// 3D ORBITAL RENDER
function renderOrbital() {
  const container = document.getElementById('orbital-container');
  if (!container) return;
  
  container.innerHTML = orbitalContent.map((item, index) => `
    <div class="cf-item ${getOrbitalClass(index)}" 
         data-id="${item.id}" 
         data-index="${index}"
         style="cursor: pointer; pointer-events: auto;">
      <img src="${item.poster}" alt="${item.title}" style="pointer-events: none;">
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

// MATRİS RENDER
function renderContent() {
  const content = document.getElementById('content-matrix');
  if (!content) return;

  content.innerHTML = `
    <div class="movie-grid">
      ${filteredContent.map(item => `
        <div class="card-wrapper" data-id="${item.id}" style="cursor: pointer; pointer-events: auto;">
          <div class="card">
            ${(item.isCollection || item.episodes) ? '<div class="card-badge">SERİ</div>' : ''}
            <div class="card-rating">⭐ ${item.rating || '9.0'}</div>
            <img src="${item.poster}" alt="${item.title}" style="pointer-events: none;">
          </div>
          <div class="card-info" style="pointer-events: none;">
              <h3>${item.title}</h3>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// KÜRESEL TIKLAMA YAKALAYICI (EN GÜVENLİ YÖNTEM)
function setupEventListeners() {
  // Arama inputu için anlık dinleyici
  const input = document.getElementById('search-input');
  if (input) {
    input.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      filteredContent = allContent.filter(item => 
        (item.title && item.title.toLowerCase().includes(query)) || 
        (item.searchTags && item.searchTags.toLowerCase().includes(query))
      );
      renderContent();
    });
  }

  // TÜM SAYFA TIKLAMALARI
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

      // ANA MANTIK: Seri ise detayları aç, değilse direkt oynat
      if (item.episodes || item.isCollection) {
        openDetails(id);
      } else {
        openPlayer(item.file);
      }
      return;
    }

    // 2. Alt film (ep-card) mı?
    const ep = e.target.closest('.ep-card');
    if (ep) {
      openPlayer(ep.dataset.file);
      return;
    }
  });

  // Klavye Kontrolleri
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closePlayer(); closeDetails(); }
    if (e.key === 'ArrowRight') nextOrbital();
    if (e.key === 'ArrowLeft') prevOrbital();
  });
}

// PANEL VE OYNATICI
function openDetails(id) {
  const item = allContent.find(i => i.id === id);
  if (!item) return;

  const modal = document.getElementById('details-modal');
  if (!modal) return;

  // Bilgileri Bas
  document.getElementById('details-poster').src = item.poster;
  document.getElementById('details-title').textContent = item.title;
  document.getElementById('details-year').textContent = item.year;
  document.getElementById('details-rating').textContent = `⭐ ${item.rating || '9.0'}`;
  document.getElementById('details-type').textContent = item.episodes ? 'Dizi' : (item.isCollection ? 'Koleksiyon' : 'Film');
  
  const descEl = document.getElementById('details-desc');
  descEl.textContent = item.desc;

  const grid = document.getElementById('details-grid');
  const listSection = document.querySelector('.details-list-section');

  let subItems = [];
  if (item.episodes) subItems = item.episodes;
  else if (item.isCollection) subItems = item.collection;

  if (subItems.length > 0) {
    listSection.style.display = 'block';
    grid.innerHTML = subItems.map(sub => `
      <div class="ep-card" data-file="${sub.file}" style="cursor: pointer;">
        <div class="ep-header">
            <h3>${sub.epNum ? sub.epNum + '. ' : ''}${sub.title}</h3>
            <button class="play-btn-mini">İZLE</button>
        </div>
        <p>${sub.desc || ''}</p>
      </div>
    `).join('');
  } else {
    listSection.style.display = 'none';
    grid.innerHTML = '';
    // Direkt butonu ekle (Kuvvetli Yöntem)
    descEl.innerHTML += `<br><br><button class="ctrl-btn" style="width:auto; padding:0 30px; border-radius:10px; font-size:16px;" onclick="openPlayer('${item.file}')">Hemen İzle</button>`;
  }

  // GÖSTER (Zorlamalı)
  modal.style.display = 'flex';
  modal.style.opacity = '1';
  modal.classList.add('active');
}

function closeDetails() {
  const modal = document.getElementById('details-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.opacity = '0';
    setTimeout(() => { modal.style.display = 'none'; }, 500);
  }
}

function openPlayer(file) {
  if (!file) return;
  const modal = document.getElementById('player-modal');
  const iframe = document.getElementById('player-frame');
  if (!modal || !iframe) return;

  modal.style.display = 'flex';
  modal.style.opacity = '1';
  modal.classList.add('active');
  iframe.src = file.includes('?') ? `${file}&autoplay=1` : `${file}?autoplay=1`;
}

function closePlayer() {
  const modal = document.getElementById('player-modal');
  const iframe = document.getElementById('player-frame');
  if (modal) {
    modal.classList.remove('active');
    modal.style.opacity = '0';
    setTimeout(() => { modal.style.display = 'none'; iframe.src = ''; }, 600);
  }
}

// Anasayfaya dön
function resetFilter() {
  filteredContent = [...allContent];
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  renderContent();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleSearchClick() {
  const input = document.getElementById('search-input');
  if (input) input.dispatchEvent(new Event('input'));
}

document.addEventListener('DOMContentLoaded', initApp);
