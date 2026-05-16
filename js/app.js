// Bakım Modu Kapalı (Yayına açık)
const MAINTENANCE_MODE = false;

let allContent = [];
let orbitalContent = [];
let filteredContent = [];
let currentOrbitalIndex = 0;

function initApp() {
  try {
    // Verileri Birleştir
    if (typeof DB === 'undefined') return;
    allContent = [...DB.movies, ...DB.series];
    orbitalContent = DB.movies.slice(0, 8); 
    filteredContent = [...allContent];

    renderOrbital();
    renderContent();
    setupEventListeners();
    
    // Bakım ekranını her ihtimale karşı gizle
    const maintenance = document.getElementById('maintenance-screen');
    if (maintenance) maintenance.style.display = 'none';

  } catch (err) {
    console.error("Uygulama başlatılırken hata:", err);
  }
}

// 3D OVAL ORBITAL LOGIC
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

// CONTENT MATRIX RENDER
function renderContent() {
  const content = document.getElementById('content-matrix');
  if (!content) return;

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
      </div>
    </div>
  `;
}

// SEARCH LOGIC (INSTANT & SMART)
function setupSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;

  input.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    
    if (query === '') {
      filteredContent = [...allContent];
    } else {
      filteredContent = allContent.filter(item => {
        const titleMatch = item.title && item.title.toLowerCase().includes(query);
        const tagMatch = item.searchTags && item.searchTags.toLowerCase().includes(query);
        const descMatch = item.desc && item.desc.toLowerCase().includes(query);
        return titleMatch || tagMatch || descMatch;
      });
    }
    
    renderContent();
    
    // Eğer sonuç bulunduysa ve yazı yazılıyorsa hafifçe aşağı kaydır (opsiyonel)
    if (query.length > 1) {
       const matrix = document.getElementById('content-matrix');
       if (matrix) matrix.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

function handleSearchClick() {
  const input = document.getElementById('search-input');
  if (input) {
     // Butona basıldığında da manuel tetikleme (isteğe bağlı)
     input.dispatchEvent(new Event('input'));
  }
}

function resetFilter() {
  filteredContent = [...allContent];
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  renderContent();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// MODAL LOGIC
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
            <button class="play-btn-mini">İZLE</button>
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
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 500);
  }
}

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
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; iframe.src = ''; }, 600);
  }
}

function setupEventListeners() {
  setupSearch();
  const input = document.getElementById('search-input');
  if (input) {
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearchClick(); });
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closePlayer(); closeDetails(); }
    if (e.key === 'ArrowRight') nextOrbital();
    if (e.key === 'ArrowLeft') prevOrbital();
  });
}

document.addEventListener('DOMContentLoaded', initApp);
