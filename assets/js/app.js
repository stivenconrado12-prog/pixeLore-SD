// ============================================================================
// PixeLore — app.js
// ============================================================================

// --- CONFIG ---
const DATA_VERSION = 'v2-50games'; // bump this if games.json structure changes, to bust old localStorage caches

// --- ESTADO GLOBAL ---
let allGames = [];
let recommendedGameId = localStorage.getItem('pixeLore_rec') || null;
let currentWikiGameId = null;

// --- ELEMENTOS DEL DOM ---
const gamesContainer = document.getElementById('games-container');
const searchInput = document.getElementById('search-input');
const genreFilter = document.getElementById('genre-filter');
const sortFilter = document.getElementById('sort-filter');
const resultsCount = document.getElementById('results-count');
const gamesCountBadge = document.getElementById('games-count-badge');

// Tabs
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');
const gotoTabButtons = document.querySelectorAll('[data-goto-tab]');

// Inicio
const featuredBlock = document.getElementById('featured-recommendation');
const updatedStrip = document.getElementById('updated-games-strip');
const cheapestStrip = document.getElementById('cheapest-games-strip');

// Wiki
const wikiIndex = document.getElementById('wiki-index');
const wikiContent = document.getElementById('wiki-content');
const wikiSearchInput = document.getElementById('wiki-search-input');

// Modales
const gameModal = document.getElementById('game-modal');
const modalBody = document.getElementById('modal-body');
const loginModal = document.getElementById('login-modal');

// Admin Panel
const adminPanel = document.getElementById('admin-panel');
const adminGameSelect = document.getElementById('admin-game-select');
const adminRecSelect = document.getElementById('admin-rec-select');
const gameForm = document.getElementById('game-form');
const btnDeleteGame = document.getElementById('btn-delete-game');
const personajesList = document.getElementById('personajes-list');
const tiendasList = document.getElementById('tiendas-list');

// Chatbot
const chatBody = document.getElementById('chatbot-body');
const chatInput = document.getElementById('chat-input');
const btnSendChat = document.getElementById('send-chat');
const chatbotContainer = document.getElementById('chatbot-container');

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
  fetchGames();
  setupTabs();
  setupEventListeners();
  setupAdminAuth();
  setupChatbot();
});

async function fetchGames() {
  try {
    const cachedVersion = localStorage.getItem('pixeLore_version');
    const localData = localStorage.getItem('pixeLore_games');

    if (localData && cachedVersion === DATA_VERSION) {
      allGames = JSON.parse(localData);
    } else {
      const response = await fetch('games.json');
      allGames = await response.json();
      saveToLocalStorage();
    }
    renderEverything();
  } catch (error) {
    console.error('Error cargando juegos:', error);
    gamesContainer.innerHTML = `<p class="error-msg">No se pudo cargar el catálogo. Verifica que estés usando un servidor local (Live Server) y que games.json exista.</p>`;
  }
}

function saveToLocalStorage() {
  localStorage.setItem('pixeLore_games', JSON.stringify(allGames));
  localStorage.setItem('pixeLore_version', DATA_VERSION);
}

function renderEverything() {
  populateFiltersAndSelects();
  filterGames();
  renderInicio();
  renderWikiIndex();
  updateGamesCountBadge();
}

function updateGamesCountBadge() {
  if (gamesCountBadge) {
    gamesCountBadge.textContent = `${allGames.length} juegos`;
  }
}

// --- HELPERS ---
function parsePrice(priceStr) {
  if (!priceStr) return Infinity;
  if (/gratis/i.test(priceStr)) return 0;
  const n = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? Infinity : n;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ============================================================================
// TABS (Inicio / Buscar / Wiki)
// ============================================================================
function setupTabs() {
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });
  gotoTabButtons.forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.gotoTab));
  });
}

function activateTab(tabName) {
  tabButtons.forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
  tabPanels.forEach(p => p.classList.toggle('active', p.id === `tab-${tabName}`));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================================
// SECCIÓN INICIO
// ============================================================================
function renderInicio() {
  renderFeatured();
  renderUpdatedStrip();
  renderCheapestStrip();
}

function renderFeatured() {
  if (!featuredBlock) return;
  const game = recommendedGameId ? allGames.find(g => g.id === recommendedGameId) : null;

  if (!game) {
    featuredBlock.innerHTML = `
      <div class="featured-empty">
        El administrador aún no ha fijado un juego recomendado. Usa <strong>Ctrl + Shift + A</strong> para entrar al panel y elegir uno.
      </div>`;
    return;
  }

  featuredBlock.innerHTML = `
    <div class="featured-card">
      <img src="${escapeHtml(game.imagen)}" alt="${escapeHtml(game.titulo)}" onerror="this.src='https://via.placeholder.com/600x400/121629/00f3ff?text=No+Image'">
      <div class="featured-copy">
        <span class="featured-tag">★ Recomendado del bot</span>
        <h3>${escapeHtml(game.titulo)}</h3>
        <p class="company">${escapeHtml(game.compania)} · ${escapeHtml(game.distribuidora)}</p>
        <p class="lore-preview">${escapeHtml(game.lore)}</p>
        <div>
          <button class="btn-primary" onclick="openGameModal('${game.id}')" type="button">Ver detalle y tiendas</button>
        </div>
      </div>
    </div>`;
}

function renderUpdatedStrip() {
  if (!updatedStrip) return;
  const updated = allGames.filter(g => g.actualizado);
  if (updated.length === 0) {
    updatedStrip.innerHTML = `<p class="dynamic-list-empty">No hay juegos marcados como actualizados todavía.</p>`;
    return;
  }
  updatedStrip.innerHTML = updated.map(stripCardHTML).join('');
}

function renderCheapestStrip() {
  if (!cheapestStrip) return;
  const priced = [...allGames].sort((a, b) => parsePrice(a.precioMasBajo) - parsePrice(b.precioMasBajo));
  cheapestStrip.innerHTML = priced.slice(0, 8).map(stripCardHTML).join('');
}

function stripCardHTML(game) {
  return `
    <div class="strip-card" role="button" tabindex="0" onclick="openGameModal('${game.id}')" onkeypress="if(event.key==='Enter')openGameModal('${game.id}')">
      <img src="${escapeHtml(game.imagen)}" alt="${escapeHtml(game.titulo)}" loading="lazy" onerror="this.src='https://via.placeholder.com/600x400/121629/00f3ff?text=No+Image'">
      <div class="strip-body">
        ${game.actualizado ? '<span class="strip-badge">Actualizado</span><br>' : ''}
        <h4>${escapeHtml(game.titulo)}</h4>
        <p class="strip-price">${escapeHtml(game.precioMasBajo)}</p>
      </div>
    </div>`;
}

// ============================================================================
// SECCIÓN BUSCAR — RENDERIZADO Y FILTROS
// ============================================================================
function renderGames(games) {
  gamesContainer.innerHTML = '';
  if (games.length === 0) {
    gamesContainer.innerHTML = '<p class="empty-state">No se encontraron juegos con esos filtros.</p>';
    resultsCount.textContent = '';
    return;
  }

  resultsCount.textContent = `${games.length} resultado${games.length === 1 ? '' : 's'}`;

  games.forEach(game => {
    const card = document.createElement('div');
    card.classList.add('game-card');
    card.innerHTML = `
      <img src="${escapeHtml(game.imagen)}" alt="${escapeHtml(game.titulo)}" loading="lazy" onerror="this.src='https://via.placeholder.com/600x400/121629/00f3ff?text=No+Image'">
      <div class="card-content">
        <h3>${escapeHtml(game.titulo)}</h3>
        <p class="company">${escapeHtml(game.compania)}</p>
        <div class="genres">
          ${game.genero.map(g => `<span class="badge">${escapeHtml(g)}</span>`).join('')}
          ${game.actualizado ? '<span class="badge badge-updated">Actualizado</span>' : ''}
        </div>
        <p class="price">${escapeHtml(game.precioMasBajo)}</p>
        <button class="btn-details" onclick="openGameModal('${game.id}')">Ver Detalle</button>
      </div>
    `;
    gamesContainer.appendChild(card);
  });
}

function populateFiltersAndSelects() {
  const genres = new Set();
  allGames.forEach(g => g.genero.forEach(gen => genres.add(gen)));
  const sortedGenres = [...genres].sort((a, b) => a.localeCompare(b));

  genreFilter.innerHTML = '<option value="all">Todos los Géneros</option>';
  sortedGenres.forEach(genre => {
    genreFilter.innerHTML += `<option value="${escapeHtml(genre)}">${escapeHtml(genre)}</option>`;
  });

  const sortedByTitle = [...allGames].sort((a, b) => a.titulo.localeCompare(b.titulo));
  const adminOptions = sortedByTitle.map(g => `<option value="${g.id}">${escapeHtml(g.titulo)}</option>`).join('');
  adminGameSelect.innerHTML = `<option value="new">-- CREAR NUEVO JUEGO --</option>` + adminOptions;
  adminRecSelect.innerHTML = adminOptions;

  if (recommendedGameId) adminRecSelect.value = recommendedGameId;
}

function filterGames() {
  const term = searchInput.value.toLowerCase().trim();
  const genre = genreFilter.value;
  const sortMode = sortFilter ? sortFilter.value : 'default';

  let filtered = allGames.filter(g => {
    const matchName = g.titulo.toLowerCase().includes(term) || g.compania.toLowerCase().includes(term);
    const matchGenre = genre === 'all' || g.genero.includes(genre);
    return matchName && matchGenre;
  });

  if (sortMode === 'price-asc') {
    filtered = [...filtered].sort((a, b) => parsePrice(a.precioMasBajo) - parsePrice(b.precioMasBajo));
  } else if (sortMode === 'price-desc') {
    filtered = [...filtered].sort((a, b) => parsePrice(b.precioMasBajo) - parsePrice(a.precioMasBajo));
  } else if (sortMode === 'az') {
    filtered = [...filtered].sort((a, b) => a.titulo.localeCompare(b.titulo));
  }

  renderGames(filtered);
}

// ============================================================================
// SECCIÓN WIKI
// ============================================================================
function renderWikiIndex(filterTerm = '') {
  if (!wikiIndex) return;
  const term = filterTerm.toLowerCase().trim();
  const sorted = [...allGames].sort((a, b) => a.titulo.localeCompare(b.titulo));
  const filtered = term
    ? sorted.filter(g => g.titulo.toLowerCase().includes(term) || g.compania.toLowerCase().includes(term))
    : sorted;

  if (filtered.length === 0) {
    wikiIndex.innerHTML = '<p class="wiki-index-empty">Sin coincidencias.</p>';
    return;
  }

  wikiIndex.innerHTML = filtered.map(g => `
    <button type="button" class="wiki-index-item ${g.id === currentWikiGameId ? 'active' : ''}" data-wiki-id="${g.id}">
      ${escapeHtml(g.titulo)}
    </button>
  `).join('');

  wikiIndex.querySelectorAll('.wiki-index-item').forEach(btn => {
    btn.addEventListener('click', () => openWikiArticle(btn.dataset.wikiId));
  });
}

function openWikiArticle(id) {
  const game = allGames.find(g => g.id === id);
  if (!game) return;
  currentWikiGameId = id;

  renderWikiIndex(wikiSearchInput ? wikiSearchInput.value : '');

  const personajesHTML = (game.personajes && game.personajes.length > 0)
    ? `<div class="character-grid">${game.personajes.map(p => `
        <div class="character-card">
          <span class="char-name">${escapeHtml(p.nombre)}</span>
          <span class="char-role">${escapeHtml(p.rol || '')}</span>
          <p>${escapeHtml(p.descripcion || '')}</p>
        </div>`).join('')}</div>`
    : `<p class="dynamic-list-empty">Aún no hay personajes registrados para este juego.</p>`;

  const tiendasHTML = renderStoreList(game.tiendas);

  wikiContent.innerHTML = `
    <div class="wiki-article-header">
      <img src="${escapeHtml(game.imagen)}" alt="${escapeHtml(game.titulo)}" onerror="this.src='https://via.placeholder.com/600x400/121629/00f3ff?text=No+Image'">
      <div class="wiki-article-meta">
        <h2>${escapeHtml(game.titulo)}</h2>
        <p class="company">${escapeHtml(game.compania)} · Distribuido por ${escapeHtml(game.distribuidora)}</p>
        <div class="genres">
          ${game.genero.map(g => `<span class="badge">${escapeHtml(g)}</span>`).join('')}
          ${game.actualizado ? '<span class="badge badge-updated">Actualizado</span>' : ''}
        </div>
      </div>
    </div>

    <h3 class="wiki-section-title">Lore</h3>
    <p class="wiki-lore">${escapeHtml(game.lore)}</p>

    <h3 class="wiki-section-title">Personajes</h3>
    ${personajesHTML}

    <h3 class="wiki-section-title">Dónde conseguirlo</h3>
    ${tiendasHTML}
  `;
}

// ============================================================================
// MODAL DE DETALLE (usado en Inicio y Buscar)
// ============================================================================
function renderStoreList(tiendas) {
  if (!tiendas || tiendas.length === 0) {
    return '<p style="color:var(--text-secondary)">No hay enlaces de tiendas registrados.</p>';
  }
  const items = tiendas.map(t => `
    <li>
      <a href="${escapeHtml(t.url)}" target="_blank" rel="noopener noreferrer" class="store-link">
        <span>🛒 ${escapeHtml(t.nombre)}</span>
        <span class="store-price">${escapeHtml(t.precio)} ↗</span>
      </a>
    </li>`).join('');
  return `<ul class="store-list">${items}</ul>`;
}

window.openGameModal = function (id) {
  const game = allGames.find(g => g.id === id);
  if (!game) return;

  const personajesHTML = (game.personajes && game.personajes.length > 0)
    ? `<div class="character-grid">${game.personajes.map(p => `
        <div class="character-card">
          <span class="char-name">${escapeHtml(p.nombre)}</span>
          <span class="char-role">${escapeHtml(p.rol || '')}</span>
          <p>${escapeHtml(p.descripcion || '')}</p>
        </div>`).join('')}</div>`
    : '';

  modalBody.innerHTML = `
    <h2 class="modal-title">${escapeHtml(game.titulo)}</h2>
    <p class="modal-meta"><strong>Desarrollador:</strong> ${escapeHtml(game.compania)} | <strong>Distribuidor:</strong> ${escapeHtml(game.distribuidora)}</p>
    <p class="modal-price"><strong>Mejor Precio:</strong> <span class="amount">${escapeHtml(game.precioMasBajo)}</span></p>

    <h3 class="modal-section-title">Disponibilidad y Tiendas:</h3>
    ${renderStoreList(game.tiendas)}

    <h3 class="modal-section-title">Lore</h3>
    <p class="modal-lore">${escapeHtml(game.lore)}</p>

    ${personajesHTML ? `<h3 class="modal-section-title">Personajes</h3>${personajesHTML}` : ''}
  `;
  gameModal.style.display = 'flex';
};

// ============================================================================
// EVENTOS GENERALES
// ============================================================================
function setupEventListeners() {
  searchInput.addEventListener('input', filterGames);
  genreFilter.addEventListener('change', filterGames);
  if (sortFilter) sortFilter.addEventListener('change', filterGames);

  if (wikiSearchInput) {
    wikiSearchInput.addEventListener('input', () => renderWikiIndex(wikiSearchInput.value));
  }

  document.getElementById('close-game-modal').onclick = () => gameModal.style.display = 'none';
  document.getElementById('close-login-modal').onclick = () => loginModal.style.display = 'none';
  window.addEventListener('click', (e) => {
    if (e.target === gameModal) gameModal.style.display = 'none';
    if (e.target === loginModal) loginModal.style.display = 'none';
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      gameModal.style.display = 'none';
      loginModal.style.display = 'none';
    }
  });
}

// ============================================================================
// AUTENTICACIÓN ADMIN (SHA-256, Ctrl+Shift+A)
// ============================================================================
// Hash SHA-256 de la contraseña de administrador (nunca se guarda en texto plano)
const TARGET_HASH = "7b1048d89f99342f4e78ebdc606cd9e286ec51759e6c29f8246de2a04230887e";

async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function setupAdminAuth() {
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      loginModal.style.display = 'flex';
      document.getElementById('admin-password').focus();
    }
  });

  document.getElementById('btn-login').onclick = async () => {
    const pwd = document.getElementById('admin-password').value;
    const hashed = await hashPassword(pwd);
    if (hashed === TARGET_HASH) {
      loginModal.style.display = 'none';
      adminPanel.classList.remove('hidden');
      document.getElementById('admin-password').value = '';
      document.getElementById('login-error').innerText = '';
      resetGameForm();
    } else {
      document.getElementById('login-error').innerText = 'Contraseña incorrecta';
    }
  };

  document.getElementById('admin-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-login').click();
  });

  document.getElementById('close-admin').onclick = () => {
    adminPanel.classList.add('hidden');
  };

  setupAdminCRUD();
}

// ============================================================================
// CRUD DEL ADMIN
// ============================================================================
function createDynamicRow(container, fields, values = {}) {
  const row = document.createElement('div');
  row.className = 'dynamic-row';
  row.innerHTML = fields.map(f => {
    if (f.type === 'textarea') {
      return `<textarea data-field="${f.key}" placeholder="${f.placeholder}">${escapeHtml(values[f.key] || '')}</textarea>`;
    }
    return `<input type="${f.type || 'text'}" data-field="${f.key}" placeholder="${f.placeholder}" value="${escapeHtml(values[f.key] || '')}">`;
  }).join('') + `<button type="button" class="btn-remove-row" aria-label="Eliminar fila">&times;</button>`;

  row.querySelector('.btn-remove-row').addEventListener('click', () => row.remove());
  container.appendChild(row);
}

function addPersonajeRow(values = {}) {
  createDynamicRow(personajesList, [
    { key: 'nombre', placeholder: 'Nombre del personaje' },
    { key: 'rol', placeholder: 'Rol (ej: Protagonista)' },
    { key: 'descripcion', placeholder: 'Descripción breve', type: 'textarea' },
  ], values);
}

function addTiendaRow(values = {}) {
  createDynamicRow(tiendasList, [
    { key: 'nombre', placeholder: 'Tienda (ej: Steam)' },
    { key: 'precio', placeholder: 'Precio (ej: $19.99 USD)' },
    { key: 'url', placeholder: 'https://... (enlace directo al juego)', type: 'url' },
  ], values);
}

function collectDynamicRows(container, keys) {
  return [...container.querySelectorAll('.dynamic-row')]
    .map(row => {
      const obj = {};
      keys.forEach(k => {
        const el = row.querySelector(`[data-field="${k}"]`);
        obj[k] = el ? el.value.trim() : '';
      });
      return obj;
    })
    .filter(obj => Object.values(obj).some(v => v)); // descarta filas totalmente vacías
}

function resetGameForm() {
  gameForm.reset();
  document.getElementById('game-id').value = '';
  personajesList.innerHTML = '';
  tiendasList.innerHTML = '';
  btnDeleteGame.classList.add('hidden');
}

function setupAdminCRUD() {
  document.getElementById('btn-add-personaje').addEventListener('click', () => addPersonajeRow());
  document.getElementById('btn-add-tienda').addEventListener('click', () => addTiendaRow());

  adminGameSelect.addEventListener('change', (e) => {
    const id = e.target.value;
    if (id === 'new') {
      resetGameForm();
    } else {
      const game = allGames.find(g => g.id === id);
      if (!game) return;
      document.getElementById('game-id').value = game.id;
      document.getElementById('title').value = game.titulo;
      document.getElementById('company').value = game.compania;
      document.getElementById('distributor').value = game.distribuidora;
      document.getElementById('image').value = game.imagen;
      document.getElementById('price').value = game.precioMasBajo;
      document.getElementById('genres').value = game.genero.join(', ');
      document.getElementById('is-updated').checked = game.actualizado || false;
      document.getElementById('lore').value = game.lore;

      personajesList.innerHTML = '';
      tiendasList.innerHTML = '';
      (game.personajes || []).forEach(p => addPersonajeRow(p));
      (game.tiendas || []).forEach(t => addTiendaRow(t));

      btnDeleteGame.classList.remove('hidden');
    }
  });

  gameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const idField = document.getElementById('game-id').value;

    const personajes = collectDynamicRows(personajesList, ['nombre', 'rol', 'descripcion']);
    let tiendas = collectDynamicRows(tiendasList, ['nombre', 'precio', 'url']);

    // Si no se registró ninguna tienda, se generan enlaces de búsqueda por defecto
    if (tiendas.length === 0) {
      const priceVal = document.getElementById('price').value;
      const titleVal = document.getElementById('title').value;
      tiendas = [
        { nombre: "Steam", precio: priceVal, url: `https://store.steampowered.com/search/?term=${encodeURIComponent(titleVal)}` },
        { nombre: "Epic Games", precio: priceVal, url: `https://store.epicgames.com/en-US/browse?q=${encodeURIComponent(titleVal)}&sortBy=relevancy&sortDir=DESC&count=40` },
      ];
    }

    const gameData = {
      id: idField || 'game-' + Date.now(),
      titulo: document.getElementById('title').value,
      compania: document.getElementById('company').value,
      distribuidora: document.getElementById('distributor').value,
      imagen: document.getElementById('image').value || 'https://via.placeholder.com/600x400/121629/00f3ff?text=No+Image',
      precioMasBajo: document.getElementById('price').value,
      genero: document.getElementById('genres').value.split(',').map(g => g.trim()).filter(Boolean),
      actualizado: document.getElementById('is-updated').checked,
      lore: document.getElementById('lore').value,
      personajes,
      tiendas,
    };

    if (idField) {
      const index = allGames.findIndex(g => g.id === idField);
      allGames[index] = gameData;
      alert('Juego actualizado correctamente');
    } else {
      allGames.unshift(gameData);
      alert('Juego creado correctamente');
    }

    saveAndRefresh();
    adminGameSelect.value = 'new';
    resetGameForm();
  });

  btnDeleteGame.addEventListener('click', () => {
    const idField = document.getElementById('game-id').value;
    if (confirm('¿Estás seguro de eliminar este juego? Esta acción no se puede deshacer.')) {
      allGames = allGames.filter(g => g.id !== idField);
      if (recommendedGameId === idField) {
        recommendedGameId = null;
        localStorage.removeItem('pixeLore_rec');
      }
      saveAndRefresh();
      adminGameSelect.value = 'new';
      resetGameForm();
      alert('Juego eliminado');
    }
  });

  document.getElementById('btn-set-rec').onclick = () => {
    recommendedGameId = adminRecSelect.value;
    localStorage.setItem('pixeLore_rec', recommendedGameId);
    renderFeatured();
    alert('Juego recomendado actualizado. Ya se muestra en Inicio y en el comando /rec del bot.');
  };
}

function saveAndRefresh() {
  saveToLocalStorage();
  renderEverything();
}

// ============================================================================
// CHATBOT
// ============================================================================
function setupChatbot() {
  if (chatbotContainer) {
    chatbotContainer.addEventListener('click', function (e) {
      if (!this.classList.contains('expanded')) {
        this.classList.add('expanded');
        setTimeout(() => chatInput && chatInput.focus(), 150);
      }
    });
  }

  const closeChatBtn = document.getElementById('close-chat');
  if (closeChatBtn) {
    closeChatBtn.onclick = (e) => {
      e.stopPropagation();
      chatbotContainer.classList.remove('expanded');
    };
  }

  if (btnSendChat) btnSendChat.onclick = (e) => { e.stopPropagation(); processChat(); };

  if (chatInput) {
    chatInput.addEventListener('click', (e) => e.stopPropagation());
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') processChat();
    });
  }

  document.querySelectorAll('.cmd-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      chatInput.value = chip.dataset.cmd;
      processChat();
    });
  });
}

function addMessage(text, sender) {
  if (!chatBody) return;
  const msg = document.createElement('div');
  msg.className = `chat-message ${sender}`;
  msg.innerHTML = text;
  chatBody.appendChild(msg);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function showTyping() {
  const typing = document.createElement('div');
  typing.className = 'chat-typing';
  typing.id = 'chat-typing-indicator';
  typing.innerHTML = '<span></span><span></span><span></span>';
  chatBody.appendChild(typing);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById('chat-typing-indicator');
  if (el) el.remove();
}

function processChat() {
  if (!chatInput) return;
  const text = chatInput.value.trim();
  if (!text) return;

  addMessage(escapeHtml(text), 'user');
  chatInput.value = '';
  showTyping();

  setTimeout(() => {
    hideTyping();
    const lower = text.toLowerCase();
    const [cmd, ...rest] = lower.split(' ');
    const argument = rest.join(' ').trim();

    if (cmd === '/promo') {
      const paid = allGames
        .filter(g => !g.precioMasBajo.toLowerCase().includes('gratis'))
        .sort((a, b) => parsePrice(a.precioMasBajo) - parsePrice(b.precioMasBajo));
      const top3 = paid.slice(0, 3);
      let response = "<strong>Top 3 juegos más baratos:</strong><br>";
      top3.forEach((g, i) => response += `${i + 1}. ${escapeHtml(g.titulo)} — ${escapeHtml(g.precioMasBajo)}<br>`);
      addMessage(response, 'bot');

    } else if (cmd === '/act') {
      const updated = allGames.filter(g => g.actualizado);
      if (updated.length === 0) {
        addMessage("No hay juegos actualizados recientemente.", 'bot');
      } else {
        let response = "<strong>Actualizados recientemente:</strong><br>";
        updated.forEach(g => response += `- ${escapeHtml(g.titulo)}<br>`);
        addMessage(response, 'bot');
      }

    } else if (cmd === '/rec') {
      if (!recommendedGameId) {
        addMessage("El admin aún no ha fijado una recomendación.", 'bot');
      } else {
        const rec = allGames.find(g => g.id === recommendedGameId);
        if (rec) {
          addMessage(`<strong>Te recomiendo jugar:</strong><br>${escapeHtml(rec.titulo)}<br><em>${rec.genero.map(escapeHtml).join(', ')}</em>`, 'bot');
        } else {
          addMessage("El juego recomendado ya no existe.", 'bot');
        }
      }

    } else if (cmd === '/buscar') {
      if (!argument) {
        addMessage("Escribe algo después del comando, ej: <span class='cmd'>/buscar zelda</span>", 'bot');
      } else {
        const found = allGames.filter(g =>
          g.titulo.toLowerCase().includes(argument) || g.compania.toLowerCase().includes(argument));
        if (found.length === 0) {
          addMessage(`No encontré resultados para "${escapeHtml(argument)}".`, 'bot');
        } else {
          let response = `<strong>Resultados para "${escapeHtml(argument)}":</strong><br>`;
          found.slice(0, 5).forEach(g => response += `- ${escapeHtml(g.titulo)} (${escapeHtml(g.precioMasBajo)})<br>`);
          response += `<br>Puedes verlos en la pestaña <strong>Buscar</strong>.`;
          addMessage(response, 'bot');
          searchInput.value = argument;
          genreFilter.value = 'all';
          filterGames();
        }
      }

    } else if (cmd === '/genero') {
      if (!argument) {
        addMessage("Indica un género, ej: <span class='cmd'>/genero rpg</span>", 'bot');
      } else {
        const found = allGames.filter(g => g.genero.some(gen => gen.toLowerCase().includes(argument)));
        if (found.length === 0) {
          addMessage(`No encontré juegos del género "${escapeHtml(argument)}".`, 'bot');
        } else {
          let response = `<strong>Juegos de "${escapeHtml(argument)}":</strong><br>`;
          found.slice(0, 6).forEach(g => response += `- ${escapeHtml(g.titulo)}<br>`);
          addMessage(response, 'bot');
        }
      }

    } else if (cmd === '/wiki') {
      if (!argument) {
        addMessage("Indica un juego, ej: <span class='cmd'>/wiki hades</span>", 'bot');
      } else {
        const found = allGames.find(g => g.titulo.toLowerCase().includes(argument));
        if (!found) {
          addMessage(`No encontré "${escapeHtml(argument)}" en la wiki.`, 'bot');
        } else {
          addMessage(`Abriendo el artículo de <strong>${escapeHtml(found.titulo)}</strong> en la Wiki...`, 'bot');
          activateTab('wiki');
          openWikiArticle(found.id);
        }
      }

    } else if (cmd === '/ayuda' || cmd === '/help') {
      addMessage(`
        <strong>Comandos disponibles:</strong><br>
        <span class="cmd">/promo</span> — Top 3 juegos baratos<br>
        <span class="cmd">/act</span> — Juegos actualizados<br>
        <span class="cmd">/rec</span> — Juego recomendado<br>
        <span class="cmd">/buscar &lt;texto&gt;</span> — Buscar por nombre o compañía<br>
        <span class="cmd">/genero &lt;género&gt;</span> — Filtrar por género<br>
        <span class="cmd">/wiki &lt;juego&gt;</span> — Abrir el artículo de la wiki
      `, 'bot');

    } else {
      addMessage("No reconozco ese comando. Escribe <span class='cmd'>/ayuda</span> para ver todas las opciones.", 'bot');
    }
  }, 500);
}
