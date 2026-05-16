// Uygulama Değişkenleri
let allContent = [];
let orbitalContent = [];
let filteredContent = [];
let currentOrbitalIndex = 0;

// UYGULAMA BAŞLATMA (Hata Payını Sıfıra İndiriyoruz)
function initApp() {
  try {
    // DB Kontrolü
    if (typeof DB === 'undefined' || !DB.movies || !DB.series) {
      console.error("Veri dosyası (data.js) yüklenemedi veya hatalı!");
      return;
    }

    // Verileri Birleştir
    allContent = [...DB.movies, ...DB.series];
    orbitalContent = DB.movies.slice(0, 8); // Yörünge için ilk 8 filmi al
    filteredContent = [...allContent];

    renderOrbital();
    renderContent();
    setupEventListeners();
    
    console.log("SiomJourney başarıyla başlatıldı. İçerik sayısı:", allContent.length);
  } catch (err) {
    console.error("Uygulama başlatılırken hata oluştu:", err);
  }
}

// 3D ORBITAL RENDER
function renderOrbital() {
  const container = document.getElementById('orbital-container');
  const indicator = document.getElementById('orbital-indicator');
  if (!container || orbitalContent.length === 0) return;
  
  container.innerHTML = orbitalContent.map((item, index) => `
    <div class="cf-item ${getOrbitalClass(index)}" onclick="setOrbital(${index})">
      <img src="${item.poster}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/300x450?text=Afiş+Yok'">
    </div>
  `).join('');

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

// ANA İÇERİK MATRİSİ RENDER
function renderContent() {
  const content = document.getElementById('content-matrix');
  if (!content) return;

  if (filteredContent.length === 0) {
    content.innerHTML = `<div style="text-align:center; padding:100px; color:var(--text-muted);">Aradığınız kriterde içerik bulunamadı.</div>`;
    return;
  }

  content.innerHTML = `
    <section class="section-matrix">
      <div class="movie-grid">
        ${filteredContent.map(item => renderCard(item)).join('')}
      </div>
    </section>
  `;
}

function renderCard(item) {
  const isCollection = item.isCollection || item.episodes;
  const badge = isCollection ? `<div class="card-badge">SERİ</div>` : '';
  
  return `
    <div class="card-wrapper" onclick="openDetails('${item.id}')">
      <div class="card">
        ${badge}
        <div class="card-rating">⭐ ${item.rating || '9.0'}</div>
        <img src="${item.poster}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/300x450?text=Afiş+Yok'">
      </div>
      <div class="card-info">
          <h3>${item.title}</h3>
          <div class="card-meta">${item.year}</div>
      </div>
    </div>
  `;
}

// ARAMA VE FİLTRELEME
function handleSearch(query) {
  const q = query.toLowerCase().trim();
  if (q === '') {
    filteredContent = [...allContent];
  } else {
    filteredContent = allContent.filter(item => 
      (item.title && item.title.toLowerCase().includes(q)) || 
      (item.searchTags && item.searchTags.toLowerCase().includes(q))
    );
  }
  renderContent();
}

function resetFilter() {
  filteredContent = [...allContent];
  const searchInput = document.querySelector('.search-bar input');
  if (searchInput) searchInput.value = '';
  renderContent();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// DETAY PANELİ MANTIĞI (Hata Korumalı)
function openDetails(id) {
  const item = allContent.find(i => i.id === id);
  if (!item) return;

  const modal = document.getElementById('details-modal');
  if (!modal) return;

  const poster = document.getElementById('details-poster');
  const title = document.getElementById('details-title');
  const year = document.getElementById('details-year');
  const rating = document.getElementById('details-rating');
  const type = document.getElementById('details-type');
  const desc = document.getElementById('details-desc');
  const grid = document.getElementById('details-grid');
  const listTitle = document.getElementById('list-title');

  if (poster) poster.src = item.poster;
  if (title) title.textContent = item.title;
  if (year) year.textContent = item.year;
  if (rating) rating.textContent = `⭐ ${item.rating || '9.0'}`;
  if (type) type.textContent = item.episodes ? 'Dizi' : (item.isCollection ? 'Koleksiyon' : 'Film');
  if (desc) desc.textContent = item.desc;

  let subItems = [];
  if (item.episodes) {
    subItems = item.episodes;
    listTitle.textContent = 'Bölümler';
  } else if (item.isCollection) {
    subItems = item.collection;
    listTitle.textContent = 'Serideki Filmler';
  }

  if (subItems.length > 0) {
    grid.innerHTML = subItems.map(sub => `
      <div class="ep-card" onclick="event.stopPropagation(); openPlayer('${sub.file}')">
        <div class="ep-header">
            <h3>${sub.epNum ? sub.epNum + '. ' : ''}${sub.title}</h3>
            <button class="play-btn-mini">İZE</button>
        </div>
        <p>${sub.desc || ''}</p>
      </div>
    `).join('');
    document.querySelector('.details-list-section').style.display = 'block';
  } else {
    grid.innerHTML = '';
    document.querySelector('.details-list-section').style.display = 'none';
    if (desc) desc.innerHTML += `<br><br><button class="ctrl-btn" style="width:auto; padding:0 30px; border-radius:10px; font-size:16px;" onclick="openPlayer('${item.file}')">Hemen İzle</button>`;
  }

  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);
}

function closeDetails() {
  const modal = document.getElementById('details-modal');
  if (!modal) return;
  modal.classList.remove('active');
  setTimeout(() => modal.style.display = 'none', 500);
}

// OYNATICI MANTIĞI
function openPlayer(file) {
  const modal = document.getElementById('player-modal');
  const iframe = document.getElementById('player-frame');
  if (!modal || !iframe || !file) return;

  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);
  iframe.src = file.includes('?') ? `${file}&autoplay=1` : `${file}?autoplay=1`;
}

function closePlayer() {
  const modal = document.getElementById('player-modal');
  const iframe = document.getElementById('player-frame');
  if (!modal || !iframe) return;
  modal.classList.remove('active');
  setTimeout(() => {
    modal.style.display = 'none';
    iframe.src = '';
  }, 600);
}

// OLAY DİNLEYİCİLER
function setupEventListeners() {
  const searchInput = document.querySelector('.search-bar input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePlayer();
        closeDetails();
    }
    if (e.key === 'ArrowRight') nextOrbital();
    if (e.key === 'ArrowLeft') prevOrbital();
  });
}

// BAŞLAT
document.addEventListener('DOMContentLoaded', initApp);
