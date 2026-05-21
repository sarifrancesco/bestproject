<template>
  <div class="scout-app">

    <!-- Header -->
    <header class="app-header">
      <div class="header-inner">
        <div class="logo">
          <span class="logo-icon">⚽</span>
          <span class="logo-text">SCOUT<em>PRO</em></span>
        </div>
        <div class="header-tabs">
          <button class="tab-btn" :class="{ active: mode === 'search' }" @click="mode = 'search'">🔍 Cerca giocatore</button>
          <button class="tab-btn" :class="{ active: mode === 'browse' }" @click="mode = 'browse'">🛡 Sfoglia squadre</button>
        </div>
      </div>
    </header>

    <!-- ── SEARCH MODE ── -->
    <div v-if="mode === 'search'">
      <div class="search-bar-wrap">
        <div class="search-container">
          <div class="search-box">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cerca giocatore... (es. Messi, Ronaldo, Kane)"
              class="search-input"
              @keyup.enter="searchPlayers"
            />
            <button class="search-btn" :disabled="loadingSearch || !searchQuery.trim()" @click="searchPlayers">
              <span v-if="!loadingSearch">CERCA</span>
              <span v-else class="spinner"></span>
            </button>
          </div>
          <div class="filters-row" v-if="searched">
            <div class="filter-chip" :class="{ active: sortBy === 'market' }" @click="toggleSort('market')">💶 Valore mercato</div>
            <div class="filter-chip" :class="{ active: sortBy === 'age' }" @click="toggleSort('age')">🎂 Età</div>
            <div v-if="sortBy" class="filter-chip reset" @click="sortBy = null">✕ Reset</div>
          </div>
        </div>
      </div>

      <div class="main-content">
        <div v-if="error" class="error-banner">⚠ {{ error }}</div>

        <div v-if="!searched && !loadingSearch" class="empty-state">
          <svg class="pitch-svg" viewBox="0 0 200 130" fill="none">
            <rect x="1" y="1" width="198" height="128" rx="4" stroke="#2a3a4a" stroke-width="1.5" fill="none"/>
            <circle cx="100" cy="65" r="20" stroke="#2a3a4a" stroke-width="1.5" fill="none"/>
            <line x1="100" y1="1" x2="100" y2="129" stroke="#2a3a4a" stroke-width="1"/>
            <rect x="1" y="42" width="22" height="46" stroke="#2a3a4a" stroke-width="1.5" fill="none"/>
            <rect x="177" y="42" width="22" height="46" stroke="#2a3a4a" stroke-width="1.5" fill="none"/>
          </svg>
          <p class="empty-title">Inizia la tua ricerca</p>
          <p class="empty-sub">Cerca per nome o sfoglia le rose delle squadre</p>
        </div>

        <div v-else-if="loadingSearch" class="players-grid">
          <div v-for="n in 6" :key="n" class="player-card skeleton-card">
            <div class="card-top">
              <div class="skeleton-avatar"></div>
              <div class="skeleton-lines">
                <div class="skeleton-line w80"></div>
                <div class="skeleton-line w50"></div>
                <div class="skeleton-line w60"></div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="searched && filteredPlayers.length === 0" class="empty-state">
          <p class="empty-title">Nessun risultato</p>
          <p class="empty-sub">Prova con un nome diverso</p>
        </div>

        <div v-else class="players-grid">
          <div
            v-for="(player, i) in filteredPlayers"
            :key="player.id || i"
            class="player-card"
            :style="{ '--i': i }"
            @click="openDetail(player)"
          >
            <div class="card-top">
              <div class="card-avatar">
                <img v-if="playerImages[player.id]" :src="playerImages[player.id]" @error="playerImages[player.id] = null"/>
                <div v-else class="avatar-fallback"><svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg></div>
              </div>
              <div class="card-info">
                <h3 class="card-name">{{ player.name || player.shortName }}</h3>
                <p class="card-short" v-if="player.shortName && player.shortName !== player.name">{{ player.shortName }}</p>
                <div class="card-tags">
                  <span v-if="player.position" class="tag tag-pos">{{ player.position }}</span>
                  <span v-if="player.nationality" class="tag tag-nat">{{ player.nationality }}</span>
                </div>
              </div>
              <div class="card-arrow">→</div>
            </div>
            <div class="card-footer">
              <span v-if="player.team" class="footer-team">🛡 {{ player.team }}</span>
              <span class="detail-hint">Dettagli →</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── BROWSE MODE ── -->
    <div v-else class="main-content">

      <!-- Step 1: Team list -->
      <div v-if="browseStep === 'teams'">
        <div class="browse-header">
          <h2 class="browse-title">🛡 Scegli una Squadra</h2>
        </div>
        <div class="league-sections">
          <div v-for="league in teamsByLeague" :key="league.label" class="league-section">
            <h3 class="league-label">{{ league.label }}</h3>
            <div class="teams-grid">
              <div
                v-for="team in league.teams"
                :key="team.id"
                class="team-card"
                @click="selectTeam(team)"
              >
                <img :src="`https://images.fotmob.com/image_resources/logo/teamlogo/${team.id}_large.png`" :alt="team.name" class="team-logo" @error="e => e.target.style.display='none'"/>
                <span class="team-name-text">{{ team.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Squad -->
      <div v-else-if="browseStep === 'squad'">
        <div class="browse-header">
          <button class="back-btn" @click="browseStep = 'teams'">← Squadre</button>
          <div class="browse-header-info">
            <img :src="`https://images.fotmob.com/image_resources/logo/teamlogo/${selectedTeam?.id}_large.png`" class="header-team-logo" @error="e => e.target.style.display='none'"/>
            <div>
              <h2 class="browse-title">{{ selectedTeam?.name }}</h2>
              <p class="browse-sub">{{ teamPlayers.length }} giocatori in rosa</p>
            </div>
          </div>
        </div>

        <div v-if="loadingTeamPlayers" class="loading-center">
          <div class="detail-spinner"></div><p>Caricamento rosa...</p>
        </div>
        <div v-else-if="teamPlayers.length === 0" class="empty-state">
          <p class="empty-title">Nessun giocatore trovato</p>
        </div>
        <div v-else>
          <div v-for="group in squadGroups" :key="group.title" class="squad-group">
            <h3 class="group-title">{{ groupLabel(group.title) }}</h3>
            <div class="players-grid">
              <div
                v-for="(player, i) in group.members"
                :key="player.id"
                class="player-card"
                :style="{ '--i': i }"
                @click="openDetail(player)"
              >
                <div class="card-top">
                  <div class="card-avatar">
                    <img v-if="playerImages[player.id]" :src="playerImages[player.id]" @error="playerImages[player.id] = null"/>
                    <div v-else class="avatar-fallback"><svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg></div>
                  </div>
                  <div class="card-info">
                    <h3 class="card-name">{{ player.name }}</h3>
                    <div class="card-tags">
                      <span class="tag tag-pos">{{ player.role?.fallback || '—' }}</span>
                      <span v-if="player.cname" class="tag tag-nat">{{ player.cname }}</span>
                      <span v-if="player.injured" class="tag tag-injured">🤕 Infortunato</span>
                    </div>
                  </div>
                  <div class="card-right">
                    <span v-if="player.shirtNumber" class="shirt-number">#{{ player.shirtNumber }}</span>
                    <div class="card-arrow">→</div>
                  </div>
                </div>
                <div class="card-footer">
                  <div class="mini-stats">
                    <span class="mini-stat" title="Gol">⚽ {{ player.goals ?? 0 }}</span>
                    <span class="mini-stat" title="Assist">🎯 {{ player.assists ?? 0 }}</span>
                    <span v-if="player.rating" class="mini-stat rating" :class="ratingClass(player.rating)">★ {{ Number(player.rating).toFixed(1) }}</span>
                  </div>
                  <span v-if="player.transferValue" class="transfer-value">{{ formatValue(player.transferValue) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── DETAIL MODAL ── -->
    <transition name="modal">
      <div v-if="selectedPlayer" class="modal-overlay" @click.self="closeDetail">
        <div class="modal-panel">
          <button class="modal-close" @click="closeDetail">✕</button>

          <div class="modal-header">
            <div class="modal-avatar">
              <img v-if="playerImages[selectedPlayer.id]" :src="playerImages[selectedPlayer.id]" @error="playerImages[selectedPlayer.id] = null"/>
              <div v-else class="avatar-fallback large"><svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg></div>
            </div>
            <div class="modal-title-block">
              <h2 class="modal-name">{{ selectedPlayer.name || selectedPlayer.shortName }}</h2>
              <p class="modal-short" v-if="selectedPlayer.shortName && selectedPlayer.shortName !== selectedPlayer.name">{{ selectedPlayer.shortName }}</p>
              <div class="modal-tags">
                <span v-if="selectedPlayer.position || selectedPlayer.role?.fallback" class="tag tag-pos">{{ selectedPlayer.position || selectedPlayer.role?.fallback }}</span>
                <span v-if="selectedPlayer.nationality || selectedPlayer.cname" class="tag tag-nat">{{ selectedPlayer.nationality || selectedPlayer.cname }}</span>
                <span v-if="selectedPlayer.team" class="tag tag-team">{{ selectedPlayer.team }}</span>
                <span v-if="selectedPlayer.injured" class="tag tag-injured">🤕 Infortunato</span>
              </div>
            </div>
          </div>

          <!-- Squad stats (from browse) -->
          <div v-if="selectedPlayer.goals !== undefined" class="squad-stats-grid">
            <div class="squad-stat-item">
              <span class="squad-stat-label">Gol</span>
              <span class="squad-stat-value green">{{ selectedPlayer.goals ?? 0 }}</span>
            </div>
            <div class="squad-stat-item">
              <span class="squad-stat-label">Assist</span>
              <span class="squad-stat-value">{{ selectedPlayer.assists ?? 0 }}</span>
            </div>
            <div class="squad-stat-item">
              <span class="squad-stat-label">Rating</span>
              <span class="squad-stat-value" :class="ratingClass(selectedPlayer.rating)">{{ selectedPlayer.rating ? Number(selectedPlayer.rating).toFixed(1) : '—' }}</span>
            </div>
            <div class="squad-stat-item">
              <span class="squad-stat-label">Cartellini G</span>
              <span class="squad-stat-value yellow">{{ selectedPlayer.ycards ?? 0 }}</span>
            </div>
            <div class="squad-stat-item">
              <span class="squad-stat-label">Cartellini R</span>
              <span class="squad-stat-value red">{{ selectedPlayer.rcards ?? 0 }}</span>
            </div>
            <div class="squad-stat-item">
              <span class="squad-stat-label">Altezza</span>
              <span class="squad-stat-value">{{ selectedPlayer.height ? selectedPlayer.height + ' cm' : '—' }}</span>
            </div>
            <div class="squad-stat-item">
              <span class="squad-stat-label">Età</span>
              <span class="squad-stat-value">{{ selectedPlayer.age ? selectedPlayer.age + ' anni' : '—' }}</span>
            </div>
            <div class="squad-stat-item">
              <span class="squad-stat-label">Valore</span>
              <span class="squad-stat-value green">{{ selectedPlayer.transferValue ? formatValue(selectedPlayer.transferValue) : '—' }}</span>
            </div>
            <div v-if="selectedPlayer.injured && selectedPlayer.injury" class="squad-stat-item full-width">
              <span class="squad-stat-label">Infortunio</span>
              <span class="squad-stat-value red">{{ selectedPlayer.injury.expectedReturn }}</span>
            </div>
          </div>

          <!-- API detail stats -->
          <div v-if="loadingDetail" class="detail-loading">
            <div class="detail-spinner"></div>
            <p>Caricamento dettagli aggiuntivi...</p>
          </div>
          <div v-else-if="playerDetail.length > 0">
            <div class="detail-section-title">📋 Scheda Giocatore</div>
            <div class="detail-grid">
              <div v-for="item in playerDetail" :key="item.title" class="detail-item">
                <span class="detail-label">{{ item.title }}</span>
                <span class="detail-value">{{ formatDetailValue(item) }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

const API_KEY = '4fa0094bbcmsha23d67515d98dacp1ac1e2jsn23b9ff2f9be4'
const API_HOST = 'free-api-live-football-data.p.rapidapi.com'
const BASE = 'https://free-api-live-football-data.p.rapidapi.com'
const H = { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': API_HOST }

// Hardcoded teams with known IDs
const teamsByLeague = [
  {
    label: '🇮🇹 Serie A',
    teams: [
      { id: 8636, name: 'Inter' },
      { id: 8564, name: 'Milan' },
      { id: 9885, name: 'Juventus' },
      { id: 9875, name: 'Napoli' },
      { id: 9906, name: 'Atletico Madrid' }, // placeholder, will fix
    ]
  },
  {
    label: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League',
    teams: [
      { id: 8650, name: 'Liverpool' },
      { id: 8456, name: 'Manchester City' },
      { id: 8455, name: 'Chelsea' },
      { id: 9825, name: 'Arsenal' },
      { id: 10203, name: 'Nottingham Forest' },
    ]
  },
  {
    label: '🇪🇸 LaLiga',
    teams: [
      { id: 8633, name: 'Real Madrid' },
      { id: 8634, name: 'Barcelona' },
      { id: 9906, name: 'Atletico Madrid' },
    ]
  },
  {
    label: '🇩🇪 Bundesliga',
    teams: [
      { id: 9823, name: 'Bayern München' },
      { id: 9789, name: 'Borussia Dortmund' },
      { id: 8178, name: 'Bayer Leverkusen' },
      { id: 178475, name: 'RB Leipzig' },
    ]
  },
]

const mode = ref('search')
const searchQuery = ref('')
const players = ref([])
const loadingSearch = ref(false)
const error = ref(null)
const searched = ref(false)
const sortBy = ref(null)

const browseStep = ref('teams')
const selectedTeam = ref(null)
const squadGroups = ref([])
const teamPlayers = ref([])
const loadingTeamPlayers = ref(false)

const selectedPlayer = ref(null)
const playerDetail = ref([])
const loadingDetail = ref(false)
const playerImages = reactive({})

const filteredPlayers = computed(() => {
  let list = [...players.value]
  if (sortBy.value === 'market') list.sort((a, b) => (b._marketValue || 0) - (a._marketValue || 0))
  if (sortBy.value === 'age') list.sort((a, b) => (a._age || 999) - (b._age || 999))
  return list
})

async function api(path) {
  const res = await fetch(`${BASE}${path}`, { headers: H })
  return res.json()
}

async function searchPlayers() {
  const q = searchQuery.value.trim()
  if (!q) return
  loadingSearch.value = true
  error.value = null
  players.value = []
  searched.value = true
  try {
    const res = await fetch(`/api-football/football-players-search?search=${encodeURIComponent(q)}`)
    
    // ← AGGIUNGI QUESTO
    console.log('Status:', res.status)
    const raw = await res.text()
    console.log('Raw response:', raw)
    const data = JSON.parse(raw)
    console.log('Parsed data:', JSON.stringify(data, null, 2))
    // ← FINE LOG

    const list = data?.response?.suggestions || []
    console.log('Lista giocatori trovata:', list.length, list)
    players.value = list
    list.slice(0, 9).forEach(p => { if (p.id) fetchPlayerImage(p.id) })
  } catch(e) {
    console.error('Errore fetch:', e)
    error.value = 'Errore durante la ricerca.'
  } finally {
    loadingSearch.value = false
  }
}
async function selectTeam(team) {
  selectedTeam.value = team
  browseStep.value = 'squad'
  loadingTeamPlayers.value = true
  squadGroups.value = []
  teamPlayers.value = []
  try {
    const data = await api(`/football-get-list-player?teamid=${team.id}`)
    console.log('SQUAD response:', JSON.stringify(data))
    const squad = data?.response?.list?.squad || []
    console.log('Squad groups found:', squad.length)
  } catch(e) {
    console.error('SQUAD error:', e)
  } finally {
    loadingTeamPlayers.value = false
  }
}

async function fetchPlayerImage(playerId) {
  if (playerImages[playerId] !== undefined) return
  playerImages[playerId] = null
  try {
    const data = await api(`/football-get-player-logo?playerid=${playerId}`)
    console.log('IMAGE response for', playerId, JSON.stringify(data))
    playerImages[playerId] = data?.response?.url || null
  } catch(e) { 
    console.error('IMAGE error:', e)
    playerImages[playerId] = null 
  }
}

async function openDetail(player) {
  selectedPlayer.value = player
  playerDetail.value = []
  if (player.id) {
    fetchPlayerImage(player.id)
    loadingDetail.value = true
    try {
      const data = await api(`/football-get-player-detail?playerid=${player.id}`)
      console.log('DETAIL response:', JSON.stringify(data))
      const detail = data?.response?.detail || []
      playerDetail.value = detail
    } catch(e) {
      console.error('DETAIL error:', e)
    } finally {
      loadingDetail.value = false
    }
  }
}

function closeDetail() {
  selectedPlayer.value = null
  playerDetail.value = []
}

function toggleSort(key) {
  sortBy.value = sortBy.value === key ? null : key
}

function groupLabel(title) {
  const map = { keepers: '🧤 Portieri', defenders: '🛡 Difensori', midfielders: '⚙️ Centrocampisti', attackers: '⚡ Attaccanti' }
  return map[title] || title
}

function ratingClass(rating) {
  if (!rating) return ''
  if (rating >= 7.5) return 'rating-high'
  if (rating >= 6.5) return 'rating-mid'
  return 'rating-low'
}

function formatValue(val) {
  if (!val) return '—'
  if (val >= 1000000) return `€${(val / 1000000).toFixed(1)}M`
  if (val >= 1000) return `€${(val / 1000).toFixed(0)}K`
  return `€${val}`
}

function formatDetailValue(item) {
  const val = item.value
  if (!val) return '—'
  if (item.title === 'Contract end' && val.fallback?.utcTime) {
    return new Date(val.fallback.utcTime).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
  }
  if (typeof val.fallback === 'string' || typeof val.fallback === 'number') {
    const s = String(val.fallback)
    if (val.options?.unit === 'year') return `${s} anni`
    return s
  }
  return '—'
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Sans+3:wght@300;400;500&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }

.scout-app { min-height: 100vh; background: #080d14; font-family: 'Source Sans 3', sans-serif; color: #c8d8e8; }

/* Header */
.app-header { background: #0c1520; border-bottom: 1px solid #1a2a3a; padding: 0 24px; }
.header-inner { max-width: 1200px; margin: 0 auto; height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.logo { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.logo-icon { font-size: 22px; }
.logo-text { font-family: 'Oswald', sans-serif; font-size: 22px; font-weight: 700; color: #e8f4ff; letter-spacing: 2px; text-transform: uppercase; }
.logo-text em { font-style: normal; color: #00c853; }
.header-tabs { display: flex; gap: 4px; }
.tab-btn { background: none; border: 1px solid #1a2a3a; color: #4a6a8a; border-radius: 6px; padding: 6px 16px; font-family: 'Source Sans 3', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; }
.tab-btn:hover { border-color: #2a4a6a; color: #c8d8e8; }
.tab-btn.active { background: #00c853; border-color: #00c853; color: #080d14; font-weight: 600; }

/* Search bar */
.search-bar-wrap { background: #0c1520; border-bottom: 1px solid #1a2a3a; padding: 20px 24px; }
.search-container { max-width: 800px; margin: 0 auto; }
.search-box { display: flex; align-items: center; background: #111c28; border: 1px solid #1e3048; border-radius: 8px; padding: 4px 4px 4px 16px; transition: border-color 0.2s; }
.search-box:focus-within { border-color: #00c853; }
.search-icon { width: 18px; height: 18px; color: #3a5a7a; flex-shrink: 0; }
.search-input { flex: 1; background: none; border: none; outline: none; color: #c8d8e8; font-family: 'Source Sans 3', sans-serif; font-size: 15px; padding: 10px 12px; }
.search-input::placeholder { color: #3a5a7a; }
.search-btn { background: #00c853; color: #080d14; border: none; border-radius: 6px; padding: 10px 24px; font-family: 'Oswald', sans-serif; font-size: 14px; font-weight: 600; letter-spacing: 2px; cursor: pointer; transition: background 0.2s; min-width: 80px; display: flex; align-items: center; justify-content: center; }
.search-btn:hover:not(:disabled) { background: #00e676; }
.search-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.spinner { width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.3); border-top-color: #080d14; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }

/* Filters */
.filters-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.filter-chip { background: #111c28; border: 1px solid #1e3048; color: #4a6a8a; border-radius: 20px; padding: 5px 14px; font-size: 12px; cursor: pointer; transition: all 0.2s; user-select: none; }
.filter-chip:hover { border-color: #00c853; color: #c8d8e8; }
.filter-chip.active { background: rgba(0,200,83,0.15); border-color: #00c853; color: #00c853; }
.filter-chip.reset { border-color: #ff5252; color: #ff5252; }

/* Main */
.main-content { max-width: 1200px; margin: 0 auto; padding: 32px 24px 80px; }
.error-banner { background: rgba(255,82,82,0.1); border: 1px solid rgba(255,82,82,0.3); color: #ff5252; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 14px; }

/* Empty */
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 80px 20px; gap: 16px; text-align: center; }
.pitch-svg { opacity: 0.3; margin-bottom: 8px; }
.empty-title { font-family: 'Oswald', sans-serif; font-size: 24px; font-weight: 600; color: #4a6a8a; text-transform: uppercase; letter-spacing: 1px; }
.empty-sub { font-size: 14px; color: #2a3a4a; max-width: 360px; line-height: 1.6; }

/* Players grid */
.players-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.player-card { background: #0e1a26; border: 1px solid #1a2a3a; border-radius: 12px; overflow: hidden; cursor: pointer; transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s; animation: fadeUp 0.35s ease both; animation-delay: calc(var(--i, 0) * 0.04s); }
.player-card:hover { transform: translateY(-3px); border-color: #00c853; box-shadow: 0 8px 32px rgba(0,200,83,0.1); }
@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
.card-top { display: flex; align-items: center; gap: 14px; padding: 16px 16px 12px; }
.card-avatar { width: 56px; height: 56px; border-radius: 50%; overflow: hidden; background: #1a2a3a; border: 2px solid #1e3048; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.card-avatar img { width: 100%; height: 100%; object-fit: cover; }
.avatar-fallback { color: #2a4a6a; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
.avatar-fallback.large { width: 100px; height: 100px; }
.card-info { flex: 1; min-width: 0; }
.card-name { font-family: 'Oswald', sans-serif; font-size: 16px; font-weight: 600; color: #e0eeff; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card-short { font-size: 12px; color: #3a5a7a; font-style: italic; margin-top: 1px; }
.card-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
.tag { font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
.tag-pos { background: rgba(0,200,83,0.12); color: #00c853; border: 1px solid rgba(0,200,83,0.25); }
.tag-nat { background: rgba(41,182,246,0.1); color: #29b6f6; border: 1px solid rgba(41,182,246,0.2); }
.tag-team { background: rgba(255,193,7,0.1); color: #ffc107; border: 1px solid rgba(255,193,7,0.2); }
.tag-injured { background: rgba(255,82,82,0.1); color: #ff5252; border: 1px solid rgba(255,82,82,0.25); }
.card-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.shirt-number { font-family: 'Oswald', sans-serif; font-size: 13px; color: #3a5a7a; font-weight: 600; }
.card-arrow { color: #1e3048; font-size: 18px; transition: color 0.2s, transform 0.2s; }
.player-card:hover .card-arrow { color: #00c853; transform: translateX(4px); }
.card-footer { border-top: 1px solid #1a2a3a; padding: 8px 16px; display: flex; align-items: center; justify-content: space-between; }
.footer-team { font-size: 12px; color: #3a5a7a; }
.detail-hint { font-size: 11px; color: #1e3048; text-transform: uppercase; letter-spacing: 1px; }
.mini-stats { display: flex; gap: 10px; }
.mini-stat { font-size: 12px; color: #4a6a8a; }
.mini-stat.rating { font-weight: 600; }
.rating-high { color: #00c853 !important; }
.rating-mid { color: #ffc107 !important; }
.rating-low { color: #ff5252 !important; }
.transfer-value { font-size: 12px; color: #00c853; font-weight: 600; font-family: 'Oswald', sans-serif; }

/* Skeleton */
.skeleton-card { pointer-events: none; }
.skeleton-avatar { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(90deg, #111c28 25%, #1a2a3a 50%, #111c28 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; flex-shrink: 0; }
.skeleton-lines { flex: 1; display: flex; flex-direction: column; gap: 8px; padding: 4px 0; }
.skeleton-line { height: 12px; border-radius: 4px; background: linear-gradient(90deg, #111c28 25%, #1a2a3a 50%, #111c28 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; }
.w80 { width: 80%; } .w50 { width: 50%; } .w60 { width: 60%; }
@keyframes shimmer { to { background-position: -200% 0; } }

/* Browse */
.browse-header { display: flex; align-items: center; gap: 20px; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 1px solid #1a2a3a; }
.browse-header-info { display: flex; align-items: center; gap: 16px; }
.header-team-logo { width: 48px; height: 48px; object-fit: contain; }
.browse-title { font-family: 'Oswald', sans-serif; font-size: 26px; font-weight: 700; color: #e0eeff; }
.browse-sub { font-size: 13px; color: #3a5a7a; margin-top: 4px; }
.back-btn { background: #111c28; border: 1px solid #1e3048; color: #4a6a8a; border-radius: 8px; padding: 8px 16px; font-family: 'Source Sans 3', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; flex-shrink: 0; }
.back-btn:hover { border-color: #00c853; color: #00c853; }
.loading-center { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px; color: #3a5a7a; font-size: 14px; }

/* League sections */
.league-sections { display: flex; flex-direction: column; gap: 40px; }
.league-section {}
.league-label { font-family: 'Oswald', sans-serif; font-size: 18px; font-weight: 600; color: #4a6a8a; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #1a2a3a; }
.teams-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
.team-card { background: #0e1a26; border: 1px solid #1a2a3a; border-radius: 10px; padding: 20px 12px 16px; display: flex; flex-direction: column; align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s; }
.team-card:hover { border-color: #00c853; transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,200,83,0.08); }
.team-logo { width: 52px; height: 52px; object-fit: contain; }
.team-name-text { font-family: 'Oswald', sans-serif; font-size: 13px; font-weight: 600; color: #e0eeff; text-align: center; line-height: 1.3; }

/* Squad groups */
.squad-group { margin-bottom: 36px; }
.group-title { font-family: 'Oswald', sans-serif; font-size: 16px; font-weight: 600; color: #4a6a8a; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid #1a2a3a; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(4,8,16,0.88); backdrop-filter: blur(6px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal-panel { background: #0e1a26; border: 1px solid #1e3048; border-radius: 16px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; position: relative; padding: 28px; box-shadow: 0 32px 80px rgba(0,0,0,0.7); }
.modal-close { position: absolute; top: 16px; right: 16px; background: #1a2a3a; border: none; color: #4a6a8a; width: 32px; height: 32px; border-radius: 50%; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.modal-close:hover { background: #1e3048; color: #c8d8e8; }
.modal-header { display: flex; gap: 20px; align-items: flex-start; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #1a2a3a; }
.modal-avatar { width: 96px; height: 96px; border-radius: 50%; overflow: hidden; background: #1a2a3a; border: 3px solid #1e3048; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.modal-avatar img { width: 100%; height: 100%; object-fit: cover; }
.modal-title-block { flex: 1; padding-right: 32px; }
.modal-name { font-family: 'Oswald', sans-serif; font-size: 24px; font-weight: 700; color: #e0eeff; text-transform: uppercase; letter-spacing: 1px; line-height: 1.1; }
.modal-short { font-size: 13px; color: #3a5a7a; font-style: italic; margin-top: 4px; }
.modal-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }

/* Squad stats grid */
.squad-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 24px; }
.squad-stat-item { background: #111c28; border: 1px solid #1a2a3a; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 4px; }
.squad-stat-item.full-width { grid-column: 1 / -1; }
.squad-stat-label { font-size: 10px; color: #3a5a7a; text-transform: uppercase; letter-spacing: 1.5px; }
.squad-stat-value { font-family: 'Oswald', sans-serif; font-size: 22px; font-weight: 700; color: #c8d8e8; }
.squad-stat-value.green { color: #00c853; }
.squad-stat-value.yellow { color: #ffc107; }
.squad-stat-value.red { color: #ff5252; }

/* Detail section */
.detail-section-title { font-family: 'Oswald', sans-serif; font-size: 14px; color: #3a5a7a; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; margin-top: 8px; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.detail-item { background: #111c28; border: 1px solid #1a2a3a; border-radius: 8px; padding: 12px 14px; display: flex; flex-direction: column; gap: 4px; }
.detail-label { font-size: 10px; color: #3a5a7a; text-transform: uppercase; letter-spacing: 1.5px; }
.detail-value { font-family: 'Oswald', sans-serif; font-size: 18px; font-weight: 600; color: #00c853; }
.detail-loading { display: flex; align-items: center; gap: 12px; padding: 20px 0; color: #3a5a7a; font-size: 13px; }
.detail-spinner { width: 24px; height: 24px; border: 2px solid #1a2a3a; border-top-color: #00c853; border-radius: 50%; animation: spin 0.8s linear infinite; flex-shrink: 0; }

@keyframes spin { to { transform: rotate(360deg); } }
.modal-enter-active, .modal-leave-active { transition: opacity 0.25s ease; }
.modal-enter-active .modal-panel, .modal-leave-active .modal-panel { transition: transform 0.25s ease, opacity 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-panel, .modal-leave-to .modal-panel { transform: translateY(20px); opacity: 0; }
.modal-panel::-webkit-scrollbar { width: 6px; }
.modal-panel::-webkit-scrollbar-track { background: #0e1a26; }
.modal-panel::-webkit-scrollbar-thumb { background: #1e3048; border-radius: 3px; }
</style>