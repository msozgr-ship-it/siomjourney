// Bakım Modu Kapalı (Yayına açık)
const MAINTENANCE_MODE = false;

let allContent = [];
let orbitalContent = [];
let filteredContent = [];
let currentOrbitalIndex = 0;

// UYGULAMA BAŞLATMA
function initApp() {
  try {
    if (typeof DB === 'undefined') {
      console.error("DB bulunamadı!");
      return;
    }
    
    // Verileri Birleştir
    allContent = [...DB.movies, ...DB.series];
    orbitalContent = DB.movies.slice(0, 8); 
    filteredContent = [...allContent];

    renderOrbital();
    renderContent();
    setupEventListeners();
    
    // Varsa bakım ekranını temizle
    const maintenance = document.getElementById('maintenance-screen');
    if (maintenance) maintenance.style.display = 'none';

  } catch (err) {
    console.error("Başlatma hatası:", err);
  }
}

// 3D ORBITAL
function renderOrbital() {
  const container = document.getElementById('orbital-container');
  if (!container || orbitalContent.length === 0) return;
  
  container.innerHTML = orbitalContent.map((item, index) => `
    <div class="cf-item ${getOrbitalClass(index)}" onclick="setOrbital(${index})">
      <img src="${item.poster}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/300x450?text=Afiş+Yok'">
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
    <section class="section-matrix">
      <div class="movie-grid">
        ${filteredContent.map(item => `
          <div class="card-wrapper" onclick="openDetails('${item.id}')">
            <div class="card">
              ${(item.isCollection || item.episodes) ? '<div class="card-badge">SERİ</div>' : ''}
              <div class="card-rating">⭐ ${item.rating || '9.0'}</div>
              <img src="${item.poster}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/300x450?text=Afiş+Yok'">
            </div>
            <div class="card-info">
                <h3>${item.title}</h3>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

// ARAMA MANTIĞI
function setupSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;

  input.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (query === '') {
      filteredContent = [...allContent];
    } else {
      filteredContent = allContent.filter(item => 
        (item.title && item.title.toLowerCase().includes(query)) || 
        (item.searchTags && item.searchTags.toLowerCase().includes(query))
      );
    }
    renderContent();
  });
}

function handleSearchClick() {
  const input = document.getElementById('search-input');
  if (input) input.dispatchEvent(new Event('input'));
}

function resetFilter() {
  filteredContent = [...allContent];
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  renderContent();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// DETAY VE OYNATICI (KRİTİK DÜZELTME)
function openDetails(id) {
  const item = allContent.find(i => i.id === id);
  if (!item) return;

  const modal = document.getElementById('details-modal');
  if (!modal) return;

  // İçeriği Doldur
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
      <div class="ep-card" onclick="openPlayer('${sub.file}')">
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
    // Direkt filmse "Hemen İzle" butonu ekle
    descEl.innerHTML += `<br><br><button class="ctrl-btn" style="width:auto; padding:0 30px; border-radius:10px; font-size:16px;" onclick="openPlayer('${item.file}')">Hemen İzle</button>`;
  }

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
  setTimeout(() => modal.classList.add('active'), 10);
  iframe.src = file.includes('?') ? `${file}&autoplay=1` : `${file}?autoplay=1`;
}

function closePlayer() {
  const modal = document.getElementById('player-modal');
  const iframe = document.getElementById('player-frame');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; iframe.src = ''; }, 600);
  }
}

function setupEventListeners() {
  setupSearch();
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closePlayer(); closeDetails(); }
    if (e.key === 'ArrowRight') nextOrbital();
    if (e.key === 'ArrowLeft') prevOrbital();
  });
}

document.addEventListener('DOMContentLoaded', initApp);
