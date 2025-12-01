// Main JavaScript file
const API_BASE = 'https://pokeapi.co/api/v2';
const POKEMON_COUNT = 150;

// DOM Elements
const pokemonGrid = document.getElementById('pokemon-grid');
const searchInput = document.getElementById('search');
const typeFilter = document.getElementById('type-filter');
const loadingEl = document.getElementById('loading');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const closeModalBtn = document.getElementById('close-modal');

// State
let allPokemon = [];
let allTypes = new Set();

// Initialize the app
async function init() {
  try {
    await fetchAllPokemon();
    populateTypeFilter();
    renderPokemon(allPokemon);
    setupEventListeners();
  } catch (error) {
    console.error('Failed to initialize:', error);
    pokemonGrid.innerHTML = '<p class="no-results">Failed to load Pokemon. Please try again later.</p>';
  } finally {
    loadingEl.classList.add('hidden');
  }
}

// Fetch all 150 Pokemon
async function fetchAllPokemon() {
  const promises = [];

  for (let i = 1; i <= POKEMON_COUNT; i++) {
    promises.push(fetchPokemon(i));
  }

  allPokemon = await Promise.all(promises);

  // Collect all types
  allPokemon.forEach(pokemon => {
    pokemon.types.forEach(type => allTypes.add(type.type.name));
  });
}

// Fetch a single Pokemon
async function fetchPokemon(id) {
  const response = await fetch(`${API_BASE}/pokemon/${id}`);
  return response.json();
}

// Populate the type filter dropdown
function populateTypeFilter() {
  const sortedTypes = Array.from(allTypes).sort();

  sortedTypes.forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    typeFilter.appendChild(option);
  });
}

// Render Pokemon cards
function renderPokemon(pokemonList) {
  if (pokemonList.length === 0) {
    pokemonGrid.innerHTML = '<p class="no-results">No Pokemon found matching your search.</p>';
    return;
  }

  pokemonGrid.innerHTML = pokemonList.map(pokemon => createPokemonCard(pokemon)).join('');

  // Add click listeners to cards
  document.querySelectorAll('.pokemon-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = parseInt(card.dataset.id);
      const pokemon = allPokemon.find(p => p.id === id);
      openModal(pokemon);
    });
  });
}

// Create a Pokemon card HTML
function createPokemonCard(pokemon) {
  const types = pokemon.types.map(t =>
    `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`
  ).join('');

  const imageUrl = pokemon.sprites.other['official-artwork'].front_default ||
                   pokemon.sprites.front_default;

  return `
    <div class="pokemon-card" data-id="${pokemon.id}">
      <img src="${imageUrl}" alt="${pokemon.name}" loading="lazy">
      <p class="number">#${String(pokemon.id).padStart(3, '0')}</p>
      <p class="name">${pokemon.name}</p>
      <div class="types">${types}</div>
    </div>
  `;
}

// Setup event listeners
function setupEventListeners() {
  // Search input
  searchInput.addEventListener('input', filterPokemon);

  // Type filter
  typeFilter.addEventListener('change', filterPokemon);

  // Modal close button
  closeModalBtn.addEventListener('click', closeModal);

  // Close modal on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

// Filter Pokemon based on search and type
function filterPokemon() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const selectedType = typeFilter.value;

  let filtered = allPokemon;

  // Filter by search term (name or number)
  if (searchTerm) {
    filtered = filtered.filter(pokemon =>
      pokemon.name.toLowerCase().includes(searchTerm) ||
      String(pokemon.id).includes(searchTerm) ||
      String(pokemon.id).padStart(3, '0').includes(searchTerm)
    );
  }

  // Filter by type
  if (selectedType !== 'all') {
    filtered = filtered.filter(pokemon =>
      pokemon.types.some(t => t.type.name === selectedType)
    );
  }

  renderPokemon(filtered);
}

// Open modal with Pokemon details
function openModal(pokemon) {
  const imageUrl = pokemon.sprites.other['official-artwork'].front_default ||
                   pokemon.sprites.front_default;

  const types = pokemon.types.map(t =>
    `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`
  ).join('');

  const stats = pokemon.stats.map(stat => {
    const percentage = Math.min((stat.base_stat / 255) * 100, 100);
    const color = getStatColor(stat.base_stat);
    return `
      <div class="stat-row">
        <span class="stat-name">${formatStatName(stat.stat.name)}</span>
        <div class="stat-bar">
          <div class="stat-fill" style="width: ${percentage}%; background: ${color}"></div>
        </div>
        <span class="stat-value">${stat.base_stat}</span>
      </div>
    `;
  }).join('');

  const abilities = pokemon.abilities.map(a =>
    `<span class="ability-badge">${a.ability.name.replace('-', ' ')}</span>`
  ).join('');

  const heightM = (pokemon.height / 10).toFixed(1);
  const weightKg = (pokemon.weight / 10).toFixed(1);

  modalBody.innerHTML = `
    <div class="modal-header">
      <img src="${imageUrl}" alt="${pokemon.name}">
      <p class="number">#${String(pokemon.id).padStart(3, '0')}</p>
      <h2 class="name">${pokemon.name}</h2>
      <div class="types">${types}</div>
    </div>
    <div class="modal-body">
      <div class="stats-section">
        <h3>Base Stats</h3>
        ${stats}
      </div>
      <div class="info-section">
        <div class="info-item">
          <p class="label">Height</p>
          <p class="value">${heightM} m</p>
        </div>
        <div class="info-item">
          <p class="label">Weight</p>
          <p class="value">${weightKg} kg</p>
        </div>
        <div class="info-item">
          <p class="label">Base Experience</p>
          <p class="value">${pokemon.base_experience || 'N/A'}</p>
        </div>
        <div class="info-item">
          <p class="label">Species</p>
          <p class="value">${pokemon.species.name}</p>
        </div>
      </div>
      <div class="abilities-section">
        <h3>Abilities</h3>
        <div class="abilities-list">${abilities}</div>
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// Get color based on stat value
function getStatColor(value) {
  if (value < 50) return '#ff7675';
  if (value < 80) return '#fdcb6e';
  if (value < 100) return '#74b9ff';
  if (value < 120) return '#55efc4';
  return '#a29bfe';
}

// Format stat name for display
function formatStatName(name) {
  const names = {
    'hp': 'HP',
    'attack': 'Attack',
    'defense': 'Defense',
    'special-attack': 'Sp. Atk',
    'special-defense': 'Sp. Def',
    'speed': 'Speed'
  };
  return names[name] || name;
}

// Start the app
init();
