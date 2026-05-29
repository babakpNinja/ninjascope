let ALL = [], CATEGORIES = [], FILTERED = [];
let state = { filter: 'all', category: 'all', pricing: 'all', q: '', sort: 'rating' };

async function load() {
  const [statsR, toolsR] = await Promise.all([
    fetch('/api/stats').then(r => r.json()),
    fetch('/api/tools?sort=rating').then(r => r.json())
  ]);
  ALL = toolsR.tools;
  document.getElementById('hero-total').textContent = statsR.toolsTotal;
  document.getElementById('stat-tools').textContent = statsR.toolsTotal;
  document.getElementById('stat-cats').textContent = statsR.categoriesTotal;
  document.getElementById('stat-rating').textContent = statsR.avgRating;
  document.getElementById('dir-count').textContent = statsR.toolsTotal;
  CATEGORIES = [...new Set(ALL.map(t => t.category))].sort();
  renderCats();
  applyFilters();
}

function renderCats() {
  const wrap = document.getElementById('cats');
  wrap.innerHTML = '';
  const all = catBtn('all', `All (${ALL.length})`);
  wrap.appendChild(all);
  CATEGORIES.forEach(c => {
    const n = ALL.filter(t => t.category === c).length;
    wrap.appendChild(catBtn(c, `${c} (${n})`));
  });
}
function catBtn(cat, label) {
  const b = document.createElement('button');
  b.className = 'chip cat-chip' + (state.category === cat ? ' active' : '');
  b.dataset.cat = cat;
  b.textContent = label;
  b.onclick = () => { state.category = cat; applyFilters(); };
  return b;
}

document.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => { state.filter = b.dataset.filter; applyFilters(); });
document.querySelectorAll('[data-price]').forEach(b => b.onclick = () => { state.pricing = b.dataset.price; applyFilters(); });
document.getElementById('search').oninput = e => { state.q = e.target.value; applyFilters(); };
document.getElementById('sort').onchange = e => { state.sort = e.target.value; applyFilters(); };

async function applyFilters() {
  const url = new URL('/api/tools', location.origin);
  url.searchParams.set('sort', state.sort);
  if (state.filter !== 'all') url.searchParams.set('filter', state.filter);
  if (state.category !== 'all') url.searchParams.set('category', state.category);
  if (state.pricing !== 'all') url.searchParams.set('pricing', state.pricing);
  if (state.q) url.searchParams.set('q', state.q);
  const r = await fetch(url).then(r => r.json());
  FILTERED = r.tools;
  document.getElementById('dir-count').textContent = r.count;
  // sync chip activeness
  document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('active', b.dataset.filter === state.filter));
  document.querySelectorAll('[data-price]').forEach(b => b.classList.toggle('active', b.dataset.price === state.pricing));
  document.querySelectorAll('.cat-chip').forEach(b => b.classList.toggle('active', b.dataset.cat === state.category));
  renderGrid(FILTERED);
}

function renderGrid(items) {
  const g = document.getElementById('grid');
  if (!items.length) { g.innerHTML = '<p style="color:var(--muted);">No tools match those filters.</p>'; return; }
  g.innerHTML = items.map(t => `
    <a class="card" href="${t.website}" target="_blank" rel="noopener">
      <div class="card-head">
        <div class="card-logo">${t.logo || '🤖'}</div>
        <div class="card-rating">⭐ ${t.rating}</div>
      </div>
      <h3>${t.name}${t.trending ? '<span class="trending-pill">TRENDING</span>' : ''}</h3>
      <p>${t.tagline}</p>
      <div class="card-tags">${(t.tags || []).slice(0,3).map(x => `<span class="card-tag">${x}</span>`).join('')}</div>
      <div class="card-foot">
        <span>${t.users}</span>
        <span class="card-price">${t.pricing}${t.priceFromUSD ? ` · $${t.priceFromUSD}+` : ''}</span>
      </div>
    </a>
  `).join('');
}

if (document.getElementById('grid')) load();
