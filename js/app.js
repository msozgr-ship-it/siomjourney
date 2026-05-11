function generateCardHTML(item, type) {
  let onClickAction = type === 'series' ? `openSeriesModal('${item.id}')` : `openPlayerMovie('${item.id}')`;
  return `
  <div class="card-wrapper" onmouseenter="updateHero('${item.id}', '${type}')">
    <div class="card" onclick="${onClickAction}">
      <div class="poster-art" style="background-image: url('${item.poster}')"></div>
      <div class="card-content">
        <div class="card-meta">${item.year} • ${item.meta}</div>
        <div class="card-title">${item.title}</div>
      </div>
    </div>
  </div>`;
}

function renderContent() {
  const seriesHTML = DB.series.map(s => generateCardHTML(s, 'series')).join('');
  const moviesHTML = DB.movies.map(m => generateCardHTML(m, 'movie')).join('');
  document.getElementById('series-row').innerHTML = seriesHTML;
  document.getElementById('movies-row').innerHTML = moviesHTML;
}
renderContent();

const heroTitle = document.getElementById('hero-title');
const heroDesc = document.getElementById('hero-desc');
const heroMatch = document.getElementById('hero-match');
const heroYear = document.getElementById('hero-year');
const heroMeta = document.getElementById('hero-meta');
const heroType = document.getElementById('hero-type');
const heroVideo = document.getElementById('hero-video');
const heroYt = document.getElementById('hero-yt');
const heroPlayBtn = document.getElementById('hero-play-btn');
let currentHeroId = null; let heroTimeout = null;

function updateHero(id, type) {
  if (currentHeroId === id) return;
  currentHeroId = id;
  const item = type === 'series' ? DB.series.find(x => x.id === id) : DB.movies.find(x => x.id === id);
  if(!item) return;
  if(heroTimeout) clearTimeout(heroTimeout);
  heroTimeout = setTimeout(() => {
    heroTitle.innerText = item.title; heroDesc.innerText = item.desc;
    heroMatch.innerText = item.match + ' Eşleşme'; heroYear.innerText = item.year;
    heroMeta.innerText = item.meta; heroType.innerText = type === 'series' ? 'Orijinal Dizi' : 'Orijinal Film';
    heroPlayBtn.onclick = () => { if(type === 'series') openSeriesModal(item.id); else openPlayerMovie(item.id); };
    if(item.isYoutube && item.trailer.includes('http')) {
      heroVideo.style.display = 'none'; heroVideo.pause(); heroYt.style.display = 'block'; heroYt.src = item.trailer;
    } else {
      heroYt.style.display = 'none'; heroYt.src = ''; heroVideo.style.display = 'block'; heroVideo.src = item.trailer;
      heroVideo.play().catch(e=>console.log("Autoplay engellendi"));
    }
  }, 400);
}
if(DB.series.length > 0) updateHero(DB.series[0].id, 'series');

const seriesModal = document.getElementById('series-modal');
const playerModal = document.getElementById('player-modal');
const videoPlayer = document.getElementById('video-player');
const ytPlayer = document.getElementById('yt-player');
const subText = document.getElementById('sub-text');

function openSeriesModal(id) {
  const s = DB.series.find(x => x.id === id);
  if(!s) return;
  document.getElementById('sm-poster').src = s.poster; document.getElementById('sm-title').innerText = s.title; document.getElementById('sm-desc').innerText = s.desc;
  document.getElementById('sm-episodes').innerHTML = s.episodes.map(ep => `
    <div class="episode-row" onclick="openPlayerEpisode('${s.id}', '${ep.id}')"><div class="ep-number">${ep.epNum}</div><div class="ep-thumb"><video src="${ep.file}#t=2" preload="metadata"></video></div><div class="ep-details"><div class="ep-title">${ep.epNum}. ${ep.title}</div><div class="ep-desc">${ep.desc}</div></div></div>
  `).join('');
  seriesModal.classList.add('active');
}
function closeSeriesModal() { seriesModal.classList.remove('active'); }
function openPlayerMovie(id) { const m = DB.movies.find(x => x.id === id); if(m) initPlayer(m); }
function openPlayerEpisode(seriesId, epId) { const s = DB.series.find(x => x.id === seriesId); const ep = s.episodes.find(x => x.id === epId); if(ep) initPlayer(ep); }

function initPlayer(c) {
  heroVideo.pause(); heroYt.src = ''; playerModal.classList.add('active');
  if (c.isYoutube) { videoPlayer.style.display = 'none'; ytPlayer.style.display = 'block'; ytPlayer.src = c.file; } 
  else { ytPlayer.style.display = 'none'; videoPlayer.style.display = 'block'; videoPlayer.src = c.file; videoPlayer.play(); }
}
function closePlayer() {
  playerModal.classList.remove('active'); ytPlayer.src = ''; videoPlayer.pause(); videoPlayer.src = '';
  if(currentHeroId) updateHero(currentHeroId, DB.series.find(x=>x.id===currentHeroId)?'series':'movie');
}
seriesModal.addEventListener('click', (e) => { if (e.target === seriesModal) closeSeriesModal(); });
playerModal.addEventListener('click', (e) => { if (e.target === playerModal) closePlayer(); });
window.addEventListener('scroll', () => { const nav = document.getElementById('navbar'); if (window.scrollY > 50) nav.classList.add('scrolled'); else nav.classList.remove('scrolled'); });
