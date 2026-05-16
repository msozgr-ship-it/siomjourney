// SiomJourney S-Orbital Edition App Logic
window.DB = DB; 

function get(id) { return document.getElementById(id); }

function generateCardHTML(item, type) {
  const proxyUrl = item.poster.startsWith('assets') ? item.poster : `https://wsrv.nl/?url=${encodeURIComponent(item.poster)}&w=400&output=webp&q=90`;
  const playType = item.isCollection ? 'collection' : type;
  return `
    <div class="card-wrapper" onclick="handleItemClick('${item.id}', '${playType}')">
      <div class="card">
        <img src="${proxyUrl}" alt="${item.title}" loading="lazy">
        <div class="card-info"><h3>${item.title}</h3></div>
      </div>
    </div>
  `;
}

function renderContent() {
  const container = get('kutuphane');
  if(!container) return;
  
  // Categorization logic
  const sections = [
    { label: 'TRENDİNG', title: 'Trend Filmler', items: window.DB.movies.slice(0, 5) },
    { label: 'ANIMATION', title: 'Popüler Animasyonlar', items: window.DB.movies.filter(m => m.searchTags && m.searchTags.includes('animasyon')) },
    { label: 'SERIES', title: 'Orijinal Seriler', items: window.DB.series }
  ];

  container.innerHTML = sections.map(sec => `
    <section class="section-matrix">
      <div class="section-label">${sec.label}</div>
      <div class="matrix-title">${sec.title}</div>
      <div class="movie-grid">
        ${sec.items.map(item => generateCardHTML(item, item.episodes ? 'series' : 'movie')).join('')}
      </div>
    </section>
  `).join('');
}

window.handleItemClick = function(id, type) {
  if (type === 'series' || type === 'collection') openDetailsModal(id, type);
  else openPlayerMovie(id);
};

// Orbital Coverflow Logic
let cfActiveIndex = 0;
let cfItems = [];
let cfInterval = null;

function initCoverFlow() {
  const allItems = [...window.DB.series.map(s => ({...s, type: 'series'})), ...window.DB.movies.map(m => ({...m, type: 'movie'}))];
  allItems.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
  cfItems = allItems.slice(0, 6);
  
  const container = get('coverflow-container');
  if(!container) return;
  
  container.innerHTML = cfItems.map((item, i) => {
    const proxyUrl = item.poster.startsWith('assets') ? item.poster : `https://wsrv.nl/?url=${encodeURIComponent(item.poster)}&w=800&output=webp`;
    return `<div class="cf-item" id="cf-item-${i}" onclick="handleCoverflowClick(${i})">
      <img src="${encodeURI(proxyUrl)}" alt="${item.title}">
    </div>`;
  }).join('');
  
  updateCoverFlow();
  cfInterval = setInterval(() => { cfActiveIndex = (cfActiveIndex + 1) % cfItems.length; updateCoverFlow(); }, 5000);
}

function updateCoverFlow() {
  if(cfItems.length === 0) return;
  for(let i = 0; i < cfItems.length; i++) {
    const el = get(`cf-item-${i}`);
    if(!el) continue;
    el.className = 'cf-item';
    let offset = i - cfActiveIndex;
    if (offset < -Math.floor(cfItems.length/2)) offset += cfItems.length;
    if (offset > Math.floor(cfItems.length/2)) offset -= cfItems.length;
    
    if (offset === 0) el.classList.add('active');
    else if (Math.abs(offset) === 1) el.classList.add(offset === -1 ? 'prev-1' : 'next-1');
    else if (Math.abs(offset) === 2) el.classList.add(offset === -2 ? 'prev-2' : 'next-2');
    else el.classList.add('hidden');
  }
  const active = cfItems[cfActiveIndex];
  if(get('cf-title')) get('cf-title').innerText = active.title;
  if(get('cf-meta')) get('cf-meta').innerText = `${active.year} • ${active.meta}`;
}

window.handleCoverflowClick = function(index) {
  if (index === cfActiveIndex) {
    const item = cfItems[index];
    handleItemClick(item.id, item.episodes ? 'series' : (item.isCollection ? 'collection' : 'movie'));
  } else { cfActiveIndex = index; updateCoverFlow(); }
};

// Player & Modals
window.openPlayerMovie = function(id) { const m = window.DB.movies.find(x => x.id === id); if(m) initPlayer(m); };
window.openDetailsModal = function(id, type) {
  let s = type === 'series' ? window.DB.series.find(x => x.id === id) : window.DB.movies.find(x => x.id === id);
  if(!s) return;
  get('sm-poster').src = s.poster; get('sm-title').innerText = s.title; get('sm-desc').innerText = s.desc;
  const listArr = type === 'series' ? s.episodes : s.collection;
  get('sm-episodes').innerHTML = listArr.map(ep => `
    <div class="episode-row" onclick="openPlayerEpisode('${s.id}', '${ep.id}', '${type}')">
      <div class="ep-number">${ep.epNum}</div>
      <div class="ep-thumb"><img src="${ep.poster || s.poster}" alt="${ep.title}"></div>
      <div class="ep-details"><div class="ep-title">${ep.title}</div><div class="ep-desc">${ep.desc}</div></div>
    </div>`).join('');
  get('series-modal').classList.add('active');
};
window.openPlayerEpisode = function(pId, cId, type) {
  let s = type === 'series' ? window.DB.series.find(x => x.id === pId) : window.DB.movies.find(x => x.id === pId);
  if(s) { const ep = (type === 'series' ? s.episodes : s.collection).find(x => x.id === cId); if(ep) initPlayer(ep); }
};
window.initPlayer = function(c) {
  const modal = get('player-modal'); modal.classList.add('active');
  const video = get('video-player'); const yt = get('yt-player'); const loader = get('player-loader');
  loader.style.display = 'block'; video.style.display = 'none'; yt.style.display = 'none';
  if(!c.file) { loader.style.display = 'none'; get('coming-soon-overlay').style.display = 'flex'; return; }
  get('coming-soon-overlay').style.display = 'none';
  if(c.isYoutube) {
    yt.style.display = 'block'; yt.src = c.file + (c.file.includes('?') ? '&' : '?') + 'autoplay=1';
    yt.onload = () => { loader.style.display = 'none'; yt.classList.add('ready'); };
  } else {
    video.style.display = 'block'; video.src = c.file;
    video.oncanplay = () => { loader.style.display = 'none'; video.classList.add('ready'); video.play().catch(e => { video.controls = true; }); };
  }
};
window.closePlayer = function() { get('player-modal').classList.remove('active'); get('yt-player').src = ''; get('video-player').pause(); get('video-player').src = ''; };
window.closeSeriesModal = function() { get('series-modal').classList.remove('active'); };
window.openSearch = function() { get('search-modal').classList.add('active'); get('search-input').value = ''; get('search-results').innerHTML = ''; setTimeout(() => get('search-input').focus(), 100); };
window.closeSearch = function() { get('search-modal').classList.remove('active'); };

document.addEventListener('DOMContentLoaded', () => {
  renderContent(); initCoverFlow();
  get('search-input').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim(); if(q.length < 2) return;
    const res = [];
    [...window.DB.series, ...window.DB.movies].forEach(item => { if(item.title.toLowerCase().includes(q)) res.push(item); });
    get('search-results').innerHTML = res.map(r => generateCardHTML(r, r.episodes ? 'series' : 'movie')).join('');
  });
  window.addEventListener('click', (e) => { if(e.target.id.includes('modal')) { closeSeriesModal(); closePlayer(); closeSearch(); } });
});
