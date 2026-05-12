// Global UI Elements
let seriesModal, playerModal, videoPlayer, ytPlayer, customControls, playPauseBtn, iconPlay, iconPause, progressBar, progressContainer, timeDisplay, fullscreenBtn, playerContainerWrapper, searchModal, searchInput, searchResults;

function initDOMElements() {
  seriesModal = document.getElementById('series-modal');
  playerModal = document.getElementById('player-modal');
  videoPlayer = document.getElementById('video-player');
  ytPlayer = document.getElementById('yt-player');
  customControls = document.getElementById('custom-controls');
  playPauseBtn = document.getElementById('play-pause-btn');
  iconPlay = document.getElementById('icon-play');
  iconPause = document.getElementById('icon-pause');
  progressBar = document.getElementById('progress-bar');
  progressContainer = document.getElementById('progress-container');
  timeDisplay = document.getElementById('time-display');
  fullscreenBtn = document.getElementById('fullscreen-btn');
  playerContainerWrapper = document.getElementById('player-container');
  searchModal = document.getElementById('search-modal');
  searchInput = document.getElementById('search-input');
  searchResults = document.getElementById('search-results');
}

function generateCardHTML(item, type) {
  const proxyUrl = item.poster.startsWith('assets') ? item.poster : `https://wsrv.nl/?url=${encodeURIComponent(item.poster)}&w=400&output=webp`;
  const playType = item.isCollection ? 'collection' : type;
  
  return `
    <div class="card-wrapper" data-id="${item.id}" data-type="${playType}">
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
  const all = [...DB.series.map(s => ({...s, type: 'series'})), ...DB.movies.map(m => ({...m, type: 'movie'}))];
  const gridHTML = all.map(item => generateCardHTML(item, item.type)).join('');
  const movieGrid = document.getElementById('movie-grid');
  if(movieGrid) movieGrid.innerHTML = gridHTML;
}

// Global Click Listener for Event Delegation
document.addEventListener('click', (e) => {
  const wrapper = e.target.closest('.card-wrapper');
  if (wrapper) {
    const id = wrapper.dataset.id;
    const type = wrapper.dataset.type;
    if (type === 'series' || type === 'collection') openDetailsModal(id, type);
    else openPlayerMovie(id);
    return;
  }

  // Coverflow clicks
  const cfItem = e.target.closest('.cf-item');
  if (cfItem) {
    const index = parseInt(cfItem.id.split('-').pop());
    clickCoverflow(index);
  }
});

let cfItems = [];
let cfActiveIndex = 0;
let cfInterval = null;
let isDragging = false;
let startX = 0;
let dragDist = 0;

function initCoverFlow() {
  const allItems = [...DB.series.map(s => ({...s, type: 'series'})), ...DB.movies.map(m => ({...m, type: 'movie'}))];
  allItems.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
  
  cfItems = allItems.slice(0, 5);
  while(cfItems.length < 5 && cfItems.length > 0) cfItems = cfItems.concat(cfItems);
  
  const container = document.getElementById('coverflow-container');
  if(!container) return;
  container.innerHTML = cfItems.map((item, i) => {
    const proxyUrl = item.poster.startsWith('assets') ? item.poster : `https://wsrv.nl/?url=${encodeURIComponent(item.poster)}&w=600&output=webp`;
    return `
    <div class="cf-item" id="cf-item-${i}">
      <img class="poster-art" src="${encodeURI(proxyUrl)}" alt="${item.title}">
      <div class="play-overlay">
        <div class="play-glass-btn">
          <svg viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
        </div>
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

function dragStart(e) {
  isDragging = true;
  startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
  dragDist = 0;
  clearInterval(cfInterval);
}

function dragMove(e) {
  if (!isDragging) return;
  const x = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
  dragDist = x - startX;
  const container = document.getElementById('coverflow-container');
  if(container) container.style.transform = `translateX(${dragDist * 0.2}px)`;
  if (Math.abs(dragDist) > 10) e.preventDefault();
}

function dragEnd() {
  if (!isDragging) return;
  isDragging = false;
  const container = document.getElementById('coverflow-container');
  if(container) container.style.transform = `translateX(0)`;
  const threshold = 60;
  if (dragDist > threshold) {
    cfActiveIndex = (cfActiveIndex - 1 + cfItems.length) % cfItems.length;
  } else if (dragDist < -threshold) {
    cfActiveIndex = (cfActiveIndex + 1) % cfItems.length;
  }
  updateCoverFlow();
  startCoverflowAuto();
}

function updateCoverFlow() {
  if(cfItems.length === 0) return;
  const len = cfItems.length;
  for(let i = 0; i < len; i++) {
    const el = document.getElementById(`cf-item-${i}`);
    if(!el) continue;
    el.className = 'cf-item';
    
    let offset = i - cfActiveIndex;
    if (offset < -Math.floor(len/2)) offset += len;
    if (offset > Math.floor(len/2)) offset -= len;
    
    if (offset === 0) el.classList.add('active');
    else if (offset === -1) el.classList.add('prev-1');
    else if (offset === 1) el.classList.add('next-1');
    else if (offset === -2) el.classList.add('prev-2');
    else if (offset === 2) el.classList.add('next-2');
    else el.classList.add('hidden');
  }
  
  const activeItem = cfItems[cfActiveIndex];
  const bgBlur = document.getElementById('cf-bg-blur');
  if(bgBlur) bgBlur.style.backgroundImage = `url('${activeItem.poster}')`;
  const cfTitle = document.getElementById('cf-title');
  if(cfTitle) cfTitle.innerText = activeItem.title;
  const cfMeta = document.getElementById('cf-meta');
  if(cfMeta) cfMeta.innerText = `${activeItem.year} • ${activeItem.meta}`;
}

function clickCoverflow(index) {
  if (Math.abs(dragDist) > 15) return; 
  if (index === cfActiveIndex) {
    const item = cfItems[index];
    const playType = item.isCollection ? 'collection' : item.type;
    if(playType === 'series' || playType === 'collection') openDetailsModal(item.id, playType); 
    else openPlayerMovie(item.id); 
  } else {
    cfActiveIndex = index;
    updateCoverFlow();
    startCoverflowAuto();
  }
}

function startCoverflowAuto() {
  if(cfInterval) clearInterval(cfInterval);
  cfInterval = setInterval(() => {
    cfActiveIndex = (cfActiveIndex + 1) % cfItems.length;
    updateCoverFlow();
  }, 5000);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60); const s = Math.floor(seconds % 60);
  return `${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
}

function openDetailsModal(id, type) {
  let s;
  if (type === 'series') s = DB.series.find(x => x.id === id);
  else if (type === 'collection') s = DB.movies.find(x => x.id === id);
  if(!s) return;
  
  const listArr = type === 'series' ? s.episodes : s.collection;
  
  document.getElementById('sm-poster').src = s.poster; 
  document.getElementById('sm-title').innerText = s.title; 
  document.getElementById('sm-desc').innerText = s.desc;
  
  document.getElementById('sm-episodes').innerHTML = listArr.map(ep => {
    const thumbUrl = ep.poster ? (ep.poster.startsWith('assets') ? ep.poster : `https://wsrv.nl/?url=${encodeURIComponent(ep.poster)}&w=300&output=webp`) : s.poster;
    return `
    <div class="episode-row" onclick="openPlayerEpisode('${s.id}', '${ep.id}', '${type}')">
      <div class="ep-number">${ep.epNum}</div>
      <div class="ep-thumb"><img src="${encodeURI(thumbUrl)}" alt="${ep.title}" loading="lazy"></div>
      <div class="ep-details">
        <div class="ep-title">${ep.title}</div>
        <div class="ep-desc">${ep.desc}</div>
      </div>
    </div>
  `; }).join('');
  seriesModal.classList.add('active');
}

function closeSeriesModal() { seriesModal.classList.remove('active'); }
function openPlayerMovie(id) { const m = DB.movies.find(x => x.id === id); if(m) initPlayer(m); }

function openPlayerEpisode(parentId, childId, type) { 
  let s, ep;
  if(type === 'series') {
     s = DB.series.find(x => x.id === parentId); 
     if(s) ep = s.episodes.find(x => x.id === childId); 
  } else if (type === 'collection') {
     s = DB.movies.find(x => x.id === parentId); 
     if(s) ep = s.collection.find(x => x.id === childId); 
  }
  if(ep) initPlayer(ep); 
}

function initPlayer(c) {
  if(!playerModal) return;
  playerModal.classList.add('active');
  const soonOverlay = document.getElementById('coming-soon-overlay');
  
  if(!c.file) {
    if(videoPlayer) videoPlayer.style.display = 'none';
    if(ytPlayer) ytPlayer.style.display = 'none';
    if(customControls) customControls.style.display = 'none';
    if(soonOverlay) soonOverlay.style.display = 'flex';
    return;
  }
  
  if(soonOverlay) soonOverlay.style.display = 'none';
  
  if (c.isYoutube) { 
    if(videoPlayer) videoPlayer.style.display = 'none'; 
    if(ytPlayer) {
      ytPlayer.style.display = 'block'; 
      ytPlayer.src = c.file; 
      if(c.file.includes('drive.google.com')) {
        ytPlayer.style.top = '-60px';
        ytPlayer.style.height = 'calc(100% + 60px)';
      } else {
        ytPlayer.style.top = '0';
        ytPlayer.style.height = '100%';
      }
    }
    if(customControls) customControls.style.display = 'none'; 
  } else { 
    if(ytPlayer) ytPlayer.style.display = 'none'; 
    if(videoPlayer) {
      videoPlayer.style.display = 'block'; 
      videoPlayer.src = c.file; 
      videoPlayer.play().catch(err => console.log("Autoplay blocked or error:", err));
    }
    if(customControls) customControls.style.display = 'flex'; 
  }
}

function closePlayer() {
  if(playerModal) playerModal.classList.remove('active');
  if(ytPlayer) ytPlayer.src = '';
  if(videoPlayer) { videoPlayer.pause(); videoPlayer.src = ''; }
}

function openSearch() {
  if(searchModal) {
    searchModal.classList.add('active');
    searchInput.value = ''; searchResults.innerHTML = '';
    setTimeout(() => searchInput.focus(), 100);
  }
}
function closeSearch() { if(searchModal) searchModal.classList.remove('active'); }

async function updateVisitorCount() {
  try {
    const response = await fetch('https://api.countapi.xyz/hit/siomjourney.io/visits');
    const data = await response.json();
    const countEl = document.getElementById('visit-count');
    if(data && data.value && countEl) {
      countEl.innerText = data.value.toLocaleString();
    }
  } catch (err) {
    const countEl = document.getElementById('visit-count');
    if(countEl) countEl.innerText = "1"; 
  }
}

// Initializations
document.addEventListener('DOMContentLoaded', () => {
  initDOMElements();
  renderContent();
  initCoverFlow();
  updateVisitorCount();

  // Search input listener
  if(searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (query.length < 2) { searchResults.innerHTML = ''; return; }
      const results = [];
      DB.series.forEach(s => { 
        const tags = s.searchTags ? s.searchTags.toLowerCase() : '';
        if(s.title.toLowerCase().includes(query) || tags.includes(query)) results.push({item: s, type: 'series'}); 
      });
      DB.movies.forEach(m => { 
        const tags = m.searchTags ? m.searchTags.toLowerCase() : '';
        if(m.title.toLowerCase().includes(query) || tags.includes(query)) results.push({item: m, type: 'movie'}); 
      });
      if (results.length === 0) {
        searchResults.innerHTML = '<div style="width:100%; text-align:center; color:#888; font-size:20px; padding: 40px;">Sonuç bulunamadı...</div>';
      } else {
        searchResults.innerHTML = results.map(r => generateCardHTML(r.item, r.type)).join('');
      }
    });
  }

  // UI Event Listeners
  if(seriesModal) seriesModal.addEventListener('click', (e) => { if (e.target === seriesModal) closeSeriesModal(); });
  if(playerModal) playerModal.addEventListener('click', (e) => { if (e.target === playerModal) closePlayer(); });
  if(searchModal) searchModal.addEventListener('click', (e) => { if (e.target === searchModal) closeSearch(); });
  window.addEventListener('scroll', () => { 
    const nav = document.getElementById('navbar'); 
    if(nav) {
      if (window.scrollY > 50) nav.classList.add('scrolled'); 
      else nav.classList.remove('scrolled'); 
    }
  });

  // Video Player Listeners
  if(videoPlayer) {
    videoPlayer.addEventListener('timeupdate', () => {
      const percent = (videoPlayer.currentTime / (videoPlayer.duration || 1)) * 100;
      if(progressBar) progressBar.style.width = percent + '%';
      if(timeDisplay) timeDisplay.innerText = `${formatTime(videoPlayer.currentTime)} / ${formatTime(videoPlayer.duration || 0)}`;
    });
    videoPlayer.addEventListener('play', () => { if(iconPlay) iconPlay.style.display = 'none'; if(iconPause) iconPause.style.display = 'block'; });
    videoPlayer.addEventListener('pause', () => { if(iconPlay) iconPlay.style.display = 'block'; if(iconPause) iconPause.style.display = 'none'; });
  }

  if(progressContainer) {
    progressContainer.addEventListener('click', (e) => {
      const rect = progressContainer.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoPlayer.currentTime = pos * videoPlayer.duration;
    });
  }
});
