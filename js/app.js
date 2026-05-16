// Versiyon 4.0 - Canlı Otomatik Yörünge Motoru
let allContent = [];
let orbitalContent = [];
let filteredContent = [];
let currentRotation = 0;
let autoRotateSpeed = 0.05; // Dönüş hızı
let isDragging = false;
let startX = 0;
let startRotation = 0;

function initApp() {
  try {
    if (typeof DB === 'undefined') return;
    allContent = [...DB.movies, ...DB.series];
    // TÜM AFİŞLER YÖRÜNGEDE
    orbitalContent = [...allContent]; 
    filteredContent = [...allContent];

    renderOrbital();
    renderContent();
    setupSearch();
    setupDragEvents();
    
    // Animasyon döngüsünü başlat
    animate();

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closePlayer(); closeDetails(); }
    });
  } catch (err) {
    console.error("Sistem hatası:", err);
  }
}

// OTOMATİK DÖNÜŞ DÖNGÜSÜ
function animate() {
  if (!isDragging) {
    currentRotation -= autoRotateSpeed; // Kendi kendine yavaşça döner
    updateOrbitalTransforms();
  }
  requestAnimationFrame(animate);
}

function setupDragEvents() {
  const dragArea = document.getElementById('hero-drag-area');
  if (!dragArea) return;

  const onStart = (e) => {
    isDragging = true;
    startX = e.pageX || e.touches[0].pageX;
    startRotation = currentRotation;
  };

  const onMove = (e) => {
    if (!isDragging) return;
    const x = e.pageX || e.touches[0].pageX;
    const diff = (x - startX) * 0.15;
    currentRotation = startRotation + diff;
    updateOrbitalTransforms();
  };

  const onEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    // Bıraktığında en yakın karta oturması için hafif bir düzenleme yapmıyoruz ki akış bozulmasın
  };

  dragArea.addEventListener('mousedown', onStart);
  dragArea.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);
  dragArea.addEventListener('touchstart', onStart);
  dragArea.addEventListener('touchmove', onMove);
  window.addEventListener('touchend', onEnd);
}

function renderOrbital() {
  const container = document.getElementById('orbital-container');
  if (!container) return;
  container.innerHTML = orbitalContent.map((item, index) => `
    <div class="cf-item" id="orb-${index}" onclick="handleOrbitalClick(${index}, '${item.id}')">
      <div class="neon-rim"></div>
      <img src="${item.poster}" alt="" onerror="this.src='https://via.placeholder.com/200x300?text=Afiş+Yok'">
    </div>
  `).join('');
}

function updateOrbitalTransforms() {
  const items = document.querySelectorAll('.cf-item');
  if (!items.length) return;
  const count = items.length;
  const angleStep = 360 / count;
  const radiusX = 800; // Tüm afişler sığsın diye biraz genişlettik
  const radiusZ = 350;

  items.forEach((item, i) => {
    const angle = (i * angleStep) + currentRotation;
    const rad = (angle * Math.PI) / 180;
    const x = Math.sin(rad) * radiusX;
    const z = Math.cos(rad) * radiusZ;
    
    // rotateX(-45deg) ile dik duruş sağlanıyor
    item.style.transform = `translate3d(${x}px, 0, ${z}px) rotateY(${angle}deg) rotateX(-45deg)`;
    
    const normalizedAngle = ((angle % 360) + 360) % 360;
    if (normalizedAngle < 15 || normalizedAngle > 345) {
      item.classList.add('active');
      item.style.opacity = "1";
      item.style.zIndex = "20000"; // En öndeki kart her şeyin üstünde
    } else {
      item.classList.remove('active');
      const isBack = normalizedAngle > 80 && normalizedAngle < 280;
      item.style.opacity = isBack ? "0.05" : "0.5";
      item.style.zIndex = Math.round(z); // Derinliğe göre z-index
    }
  });
}

function handleOrbitalClick(index, id) {
  if (isDragging) return;
  const item = allContent.find(i => i.id === id);
  if (!item) return;
  if (item.episodes || item.isCollection) openDetails(id);
  else openPlayer(item.file);
}

function renderContent() {
  const content = document.getElementById('content-matrix');
  if (!content) return;
  content.innerHTML = `<div class="movie-grid">${filteredContent.map(item => `
    <div class="card-wrapper" onclick="handleItemClick('${item.id}')">
      <div class="card">
        ${(item.isCollection || item.episodes) ? '<div class="card-badge">SERİ</div>' : ''}
        <img src="${item.poster}" alt="" onerror="this.src='https://via.placeholder.com/200x300?text=Afiş+Yok'">
      </div>
    </div>`).join('')}</div>`;
}

function handleItemClick(id) {
  const item = allContent.find(i => i.id === id);
  if (item.episodes || item.isCollection) openDetails(id);
  else openPlayer(item.file);
}

function setupSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;
  input.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    filteredContent = allContent.filter(item => (item.title && item.title.toLowerCase().includes(q)) || (item.searchTags && item.searchTags.toLowerCase().includes(q)));
    renderContent();
  });
}

function openDetails(id) {
  const item = allContent.find(i => i.id === id);
  if (!item) return;
  const modal = document.getElementById('details-modal');
  const grid = document.getElementById('details-grid');
  document.getElementById('details-title').textContent = item.title;
  let subItems = item.episodes || item.collection || [];
  grid.innerHTML = subItems.map(sub => `
    <div class="card-wrapper" onclick="event.stopPropagation(); openPlayer('${sub.file}')">
      <div class="card"><img src="${sub.poster || item.poster}" alt=""></div>
      <div style="font-size:10px; margin-top:5px; font-weight:700;">${sub.title}</div>
    </div>
  `).join('');
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);
}

function closeDetails() {
  const modal = document.getElementById('details-modal');
  if (modal) { modal.classList.remove('active'); setTimeout(() => modal.style.display = 'none', 500); }
}

function openPlayer(file) {
  if (!file) return;
  const modal = document.getElementById('player-modal');
  const iframe = document.getElementById('player-frame');
  let finalUrl = file;
  if (file.includes('pixeldrain.com/u/')) finalUrl = file.replace('pixeldrain.com/u/', 'pixeldrain.com/u/') + '?embed';
  modal.style.display = 'flex';
  modal.classList.add('active');
  iframe.src = finalUrl;
}

function closePlayer() {
  const modal = document.getElementById('player-modal');
  const iframe = document.getElementById('player-frame');
  if (modal) { modal.classList.remove('active'); setTimeout(() => { modal.style.display = 'none'; iframe.src = ''; }, 500); }
}

function resetFilter() {
  filteredContent = [...allContent];
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  renderContent();
}

document.addEventListener('DOMContentLoaded', initApp);
