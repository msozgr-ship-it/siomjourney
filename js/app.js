// SiomJourney Premium - Ultra Quality Version
window.DB = DB; 

function get(id) { return document.getElementById(id); }

function generateCardHTML(item, type) {
  // Afiş kalitesini 800px'e çıkararak netliği artırıyoruz
  const proxyUrl = item.poster.startsWith('assets') ? item.poster : `https://wsrv.nl/?url=${encodeURIComponent(item.poster)}&w=800&output=webp&q=90`;
  const playType = item.isCollection ? 'collection' : type;
  return `
    <div class="card-wrapper" onclick="handleItemClick('${item.id}', '${playType}')">
      <div class="card">
        <img class="poster-art" src="${proxyUrl}" alt="${item.title}" loading="lazy">
        <div class="card-glass-play"><svg viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg></div>
        <div class="card-content">
          <div class="card-meta">${item.year}</div>
          <div class="card-title">${item.title}</div>
        </div>
      </div>
    </div>
  `;
}

function renderContent() {
  const all = [...window.DB.series.map(s => ({...s, type: 'series'})), ...window.DB.movies.map(m => ({...m, type: 'movie'}))];
  const movieGrid = get('movie-grid');
  if(movieGrid) movieGrid.innerHTML = all.map(item => generateCardHTML(item, item.type)).join('');
}

window.handleItemClick = function(id, type) {
  if (type === 'series' || type === 'collection') openDetailsModal(id, type);
  else openPlayerMovie(id);
};

// Coverflow Logic
let cfActiveIndex = 0;
let cfItems = [];
let cfInterval = null;
let isDragging = false;
let startX = 0;
let dragDist = 0;

function initCoverFlow() {
  const allItems = [...window.DB.series.map(s => ({...s, type: 'series'})), ...window.DB.movies.map(m => ({...m, type: 'movie'}))];
  allItems.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
  cfItems = allItems.slice(0, 5);
  while(cfItems.length < 5 && cfItems.length > 0) cfItems = cfItems.concat(cfItems);
  const container = get('coverflow-container');
  if(!container) return;
  container.innerHTML = cfItems.map((item, i) => {
    const proxyUrl = item.poster.startsWith('assets') ? item.poster : `https://wsrv.nl/?url=${encodeURIComponent(item.poster)}&w=1000&output=webp&q=90`;
    return `
    <div class="cf-item" id="cf-item-${i}" onclick="handleCoverflowClick(${i})">
      <img class="poster-art" src="${encodeURI(proxyUrl)}" alt="${item.title}" style="pointer-events:none;">
      <div class="play-overlay" style="pointer-events:none;">
        <div class="play-glass-btn"><svg viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg></div>
      </div>
    </div>`;
  }).join('');
  updateCoverFlow();
  startCoverflowAuto();
  container.addEventListener('mousedown', dragStart);
  container.addEventListener('touchstart', dragStart, {passive: true});
  window.addEventListener('mousemove', dragMove);
  window.addEventListener('touchmove', dragMove, {passive: false});
  window.addEventListener('mouseup', dragEnd);
  window.addEventListener('touchend', dragEnd);
}

function dragStart(e) { isDragging = true; startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX; dragDist = 0; clearInterval(cfInterval); }
function dragMove(e) {
  if (!isDragging) return;
  const x = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
  dragDist = x - startX;
  const container = get('coverflow-container');
  if(container) container.style.transform = `translateX(${dragDist * 0.2}px)`;
  if (Math.abs(dragDist) > 10) e.preventDefault();
}
function dragEnd() {
  if (!isDragging) return;
  isDragging = false;
  const container = get('coverflow-container');
  if(container) container.style.transform = `translateX(0)`;
  if (dragDist > 60) cfActiveIndex = (cfActiveIndex - 1 + cfItems.length) % cfItems.length;
  else if (dragDist < -60) cfActiveIndex = (cfActiveIndex + 1) % cfItems.length;
  updateCoverFlow();
  startCoverflowAuto();
}

window.handleCoverflowClick = function(index) {
  if (Math.abs(dragDist) > 15) return; 
  if (index === cfActiveIndex) {
    const item = cfItems[index];
    const playType = item.isCollection ? 'collection' : (item.episodes ? 'series' : 'movie');
    handleItemClick(item.id, playType);
  } else {
    cfActiveIndex = index; updateCoverFlow(); startCoverflowAuto();
  }
};

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
  if(get('cf-bg-blur')) get('cf-bg-blur').style.backgroundImage = `url('${active.poster}')`;
  if(get('cf-title')) get('cf-title').innerText = active.title;
  if(get('cf-meta')) get('cf-meta').innerText = `${active.year} • ${active.meta}`;
}

function startCoverflowAuto() { if(cfInterval) clearInterval(cfInterval); cfInterval = setInterval(() => { cfActiveIndex = (cfActiveIndex + 1) % cfItems.length; updateCoverFlow(); }, 5000); }

// Ultra Quality Player
window.initPlayer = function(c) {
  const modal = get('player-modal'); if(!modal) return; modal.classList.add('active');
  const video = get('video-player'); const yt = get('yt-player'); const soon = get('coming-soon-overlay');
  
  if(!c.file) { if(video) video.style.display = 'none'; if(yt) yt.style.display = 'none'; if(soon) soon.style.display = 'flex'; return; }
  if(soon) soon.style.display = 'none';

  // Archive.org Embed Linkini Direct MP4'e cevirmeye calis (Kalite artisi icin)
  let videoSrc = c.file;
  if(videoSrc.includes('archive.org/embed/')) {
    videoSrc = videoSrc.replace('embed/', 'download/') + '/' + videoSrc.split('/').pop() + '.mp4';
    // Not: Bu donusum her zaman calismayabilir, calismazsa fallback olarak ytPlayer kullanilacak
  }

  if(c.isYoutube) {
    if(video) { video.style.display = 'none'; video.src = ''; }
    if(yt) {
      yt.style.display = 'block';
      let url = c.file;
      url += (url.includes('?') ? '&' : '?') + 'autoplay=1&vq=hd1080&rel=0';
      yt.src = url;
    }
  } else {
    if(yt) { yt.style.display = 'none'; yt.src = ''; }
    if(video) {
      video.style.display = 'block';
      video.src = videoSrc;
      video.play().catch(e => { video.controls = true; });
    }
  }
};

window.openPlayerMovie = function(id) { const m = window.DB.movies.find(x => x.id === id); if(m) initPlayer(m); };
window.openDetailsModal = function(id, type) {
  let s;
  if (type === 'series') s = window.DB.series.find(x => x.id === id);
  else if (type === 'collection') s = window.DB.movies.find(x => x.id === id);
  if(!s) return;
  get('sm-poster').src = s.poster; get('sm-title').innerText = s.title; get('sm-desc').innerText = s.desc;
  const listArr = type === 'series' ? s.episodes : s.collection;
  get('sm-episodes').innerHTML = listArr.map(ep => `
    <div class="episode-row" onclick="openPlayerEpisode('${s.id}', '${ep.id}', '${type}')">
      <div class="ep-number">${ep.epNum}</div>
      <div class="ep-details"><div class="ep-title">${ep.title}</div><div class="ep-desc">${ep.desc}</div></div>
    </div>`).join('');
  get('series-modal').classList.add('active');
};
window.openPlayerEpisode = function(pId, cId, type) {
  let s, ep;
  if(type === 'series') { s = window.DB.series.find(x => x.id === pId); if(s) ep = s.episodes.find(x => x.id === cId); }
  else { s = window.DB.movies.find(x => x.id === pId); if(s) ep = s.collection.find(x => x.id === pId); }
  if(ep) initPlayer(ep);
};
window.closePlayer = function() { get('player-modal').classList.remove('active'); get('yt-player').src = ''; get('video-player').pause(); get('video-player').src = ''; };
window.closeSeriesModal = function() { get('series-modal').classList.remove('active'); };
window.openSearch = function() { get('search-modal').classList.add('active'); get('search-input').value = ''; get('search-results').innerHTML = ''; setTimeout(() => get('search-input').focus(), 100); };
window.closeSearch = function() { get('search-modal').classList.remove('active'); };

document.addEventListener('DOMContentLoaded', () => {
  renderContent(); initCoverFlow();
  const sInput = get('search-input');
  if(sInput) {
    sInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim(); if(q.length < 2) return;
      const res = [];
      window.DB.series.forEach(s => { if(s.title.toLowerCase().includes(q)) res.push({item: s, type: 'series'}); });
      window.DB.movies.forEach(m => { if(m.title.toLowerCase().includes(q)) res.push({item: m, type: 'movie'}); });
      get('search-results').innerHTML = res.map(r => generateCardHTML(r.item, r.type)).join('');
    });
  }
  window.addEventListener('click', (e) => {
    if(e.target === get('series-modal')) closeSeriesModal();
    if(e.target === get('player-modal')) closePlayer();
    if(e.target === get('search-modal')) closeSearch();
  });
  fetch('https://api.countapi.xyz/hit/siomjourney.io/visits').then(r => r.json()).then(d => { if(d.value) get('visit-count').innerText = d.value.toLocaleString(); }).catch(e => get('visit-count').innerText = "1");
});
