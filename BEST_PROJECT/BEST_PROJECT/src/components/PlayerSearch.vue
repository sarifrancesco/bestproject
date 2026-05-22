<template>
  <div class="player-search-container">
    <h2>⚽ Cerca Giocatori e Dettagli</h2>

    <div class="search-controls">
      <select v-model="selectedTeamId" @change="fetchTeamSquad">
        <option value="">Seleziona una squadra...</option>
        <option v-for="team in teams" :key="team.id" :value="team.id">
          {{ team.name }}
        </option>
      </select>
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Digita il nome del giocatore..."
        :disabled="!selectedTeamId"
      />
    </div>

    <div v-if="loading" class="status-message">Caricamento rosa in corso...</div>
    <div v-if="error" class="status-message error">{{ error }}</div>

    <div v-if="filteredSquad.length > 0" class="players-grid">
      <div
        v-for="player in filteredSquad"
        :key="player.id"
        class="player-card"
        @click="selectPlayer(player)"
      >
        <h3>{{ player.name }}</h3>
        <p><strong>Ruolo:</strong> {{ translateWord(player.position) }}</p>
        <p><strong>Nazionalità:</strong> {{ translateWord(player.nationality) }}</p>
      </div>
    </div>
    <div v-else-if="selectedTeamId && !loading" class="status-message text-muted">
      Nessun giocatore trovato. Modifica i criteri di ricerca.
    </div>

    <!-- MODAL -->
    <div v-if="selectedPlayerDetails" class="player-detail-modal">
      <div class="modal-content">
        <button class="close-btn" @click="closeModal">×</button>
        <div class="modal-body">

          <div class="player-photo-container">
            <img
              :src="playerPhotoUrl"
              :alt="selectedPlayerDetails.strPlayer"
              class="player-photo"
              @error="onImgError"
            />
          </div>

          <div class="player-info">
            <h2>{{ selectedPlayerDetails.strPlayer }}</h2>
            <p><strong>Squadra:</strong> {{ selectedPlayerDetails.strTeam }}</p>
            <p><strong>Data di Nascita:</strong> {{ formatDate(selectedPlayerDetails.dateBorn) }}</p>
            <p><strong>Luogo di Nascita:</strong> {{ selectedPlayerDetails.strBirthLocation || 'N/D' }}</p>
            <p><strong>Altezza:</strong> {{ selectedPlayerDetails.strHeight || 'N/D' }}</p>
            <p><strong>Piede Preferito:</strong> {{ translateWord(selectedPlayerDetails.strSide) }}</p>
            <p><strong>Ruolo:</strong> {{ translateWord(selectedPlayerDetails.strPosition) }}</p>

            <div class="ai-bio-container">
              <div class="ai-header">
                <h3>Scheda Tecnica AI</h3>
                <button
                  @click="generateAiAnalysis"
                  :disabled="aiLoading"
                  class="ai-btn"
                >
                  {{ aiLoading ? 'Elaborazione...' : 'Genera Analisi' }}
                </button>
              </div>
              <div v-if="aiDescription" class="ai-content">
                <p v-html="aiDescription"></p>
              </div>
              <div v-else-if="!aiLoading" class="ai-placeholder">
                Clicca per interrogare Wikipedia e generare il resoconto con l'AI.
              </div>
              <div v-else class="ai-placeholder">
                Interrogo l'AI, attendere...
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PlayerSearch',

  data() {
    return {
      footballDataToken: '6459fc74fc754feb958eaec98f888338',

      teams: [
        { id: 57,  name: 'Arsenal FC' },
        { id: 61,  name: 'Chelsea FC' },
        { id: 64,  name: 'Liverpool FC' },
        { id: 65,  name: 'Manchester City FC' },
        { id: 66,  name: 'Manchester United FC' },
        { id: 73,  name: 'Tottenham Hotspur FC' },
        { id: 81,  name: 'FC Barcelona' },
        { id: 86,  name: 'Real Madrid CF' },
        { id: 98,  name: 'AC Milan' },
        { id: 108, name: 'FC Internazionale Milano' },
        { id: 109, name: 'Juventus FC' },
      ],

      databaseLocale: {
        57: [ // Arsenal
          { id: 301, name: 'David Raya',             position: 'Goalkeeper',          nationality: 'Spain',     dateOfBirth: '1995-09-15', height: '1.83 m', foot: 'Right', birthPlace: 'Barcelona' },
          { id: 302, name: 'Aaron Ramsdale',          position: 'Goalkeeper',          nationality: 'England',   dateOfBirth: '1998-05-14', height: '1.88 m', foot: 'Right', birthPlace: 'Stoke-on-Trent' },
          { id: 303, name: 'Ben White',               position: 'Right Back',          nationality: 'England',   dateOfBirth: '1997-10-08', height: '1.86 m', foot: 'Right', birthPlace: 'Poole' },
          { id: 304, name: 'Oleksandr Zinchenko',     position: 'Left Back',           nationality: 'Ukraine',   dateOfBirth: '1996-12-15', height: '1.75 m', foot: 'Left',  birthPlace: 'Radomyshl' },
          { id: 305, name: 'William Saliba',          position: 'Centre-Back',         nationality: 'France',    dateOfBirth: '2001-03-24', height: '1.92 m', foot: 'Right', birthPlace: 'Bondy' },
          { id: 306, name: 'Gabriel Magalhães',       position: 'Centre-Back',         nationality: 'Brazil',    dateOfBirth: '1997-12-19', height: '1.90 m', foot: 'Left',  birthPlace: 'São Paulo' },
          { id: 307, name: 'Declan Rice',             position: 'Central Midfield',    nationality: 'England',   dateOfBirth: '1999-01-14', height: '1.85 m', foot: 'Right', birthPlace: 'London' },
          { id: 308, name: 'Thomas Partey',           position: 'Defensive Midfield',  nationality: 'Ghana',     dateOfBirth: '1993-06-13', height: '1.85 m', foot: 'Right', birthPlace: 'Krobo Odumase' },
          { id: 309, name: 'Martin Ødegaard',         position: 'Attacking Midfield',  nationality: 'Norway',    dateOfBirth: '1998-12-17', height: '1.78 m', foot: 'Left',  birthPlace: 'Drammen' },
          { id: 310, name: 'Jorginho',                position: 'Central Midfield',    nationality: 'Italy',     dateOfBirth: '1991-12-20', height: '1.80 m', foot: 'Right', birthPlace: 'Imbituba' },
          { id: 311, name: 'Bukayo Saka',             position: 'Right Winger',        nationality: 'England',   dateOfBirth: '2001-09-05', height: '1.78 m', foot: 'Left',  birthPlace: 'London' },
          { id: 312, name: 'Gabriel Martinelli',      position: 'Left Winger',         nationality: 'Brazil',    dateOfBirth: '2001-06-18', height: '1.75 m', foot: 'Right', birthPlace: 'Guarulhos' },
          { id: 313, name: 'Leandro Trossard',        position: 'Left Winger',         nationality: 'Belgium',   dateOfBirth: '1994-12-04', height: '1.73 m', foot: 'Right', birthPlace: 'Maasmechelen' },
          { id: 314, name: 'Kai Havertz',             position: 'Centre-Forward',      nationality: 'Germany',   dateOfBirth: '1999-06-11', height: '1.89 m', foot: 'Right', birthPlace: 'Aachen' },
          { id: 315, name: 'Eddie Nketiah',           position: 'Centre-Forward',      nationality: 'England',   dateOfBirth: '1999-05-30', height: '1.75 m', foot: 'Right', birthPlace: 'London' },
        ],
        61: [ // Chelsea
          { id: 201, name: 'Robert Sánchez',          position: 'Goalkeeper',          nationality: 'Spain',     dateOfBirth: '1997-11-18', height: '1.97 m', foot: 'Right', birthPlace: 'Cartagena' },
          { id: 202, name: 'Reece James',             position: 'Right Back',          nationality: 'England',   dateOfBirth: '1999-12-08', height: '1.80 m', foot: 'Right', birthPlace: 'London' },
          { id: 203, name: 'Marc Cucurella',          position: 'Left Back',           nationality: 'Spain',     dateOfBirth: '1998-07-22', height: '1.72 m', foot: 'Left',  birthPlace: 'Alella' },
          { id: 204, name: 'Levi Colwill',            position: 'Centre-Back',         nationality: 'England',   dateOfBirth: '2003-02-26', height: '1.88 m', foot: 'Left',  birthPlace: 'Brighton' },
          { id: 205, name: 'Tosin Adarabioyo',        position: 'Centre-Back',         nationality: 'England',   dateOfBirth: '1997-09-24', height: '1.97 m', foot: 'Right', birthPlace: 'Manchester' },
          { id: 206, name: 'Moisés Caicedo',          position: 'Defensive Midfield',  nationality: 'Ecuador',   dateOfBirth: '2001-11-02', height: '1.78 m', foot: 'Right', birthPlace: 'Santo Domingo' },
          { id: 207, name: 'Enzo Fernández',          position: 'Central Midfield',    nationality: 'Argentina', dateOfBirth: '2001-01-17', height: '1.78 m', foot: 'Right', birthPlace: 'San Martín' },
          { id: 208, name: 'Cole Palmer',             position: 'Attacking Midfield',  nationality: 'England',   dateOfBirth: '2002-05-06', height: '1.89 m', foot: 'Left',  birthPlace: 'Manchester' },
          { id: 209, name: 'Pedro Neto',              position: 'Right Winger',        nationality: 'Portugal',  dateOfBirth: '2000-03-09', height: '1.72 m', foot: 'Left',  birthPlace: 'Viana do Castelo' },
          { id: 210, name: 'Raheem Sterling',         position: 'Left Winger',         nationality: 'England',   dateOfBirth: '1994-12-08', height: '1.70 m', foot: 'Left',  birthPlace: 'London' },
          { id: 211, name: 'Christopher Nkunku',      position: 'Forward',             nationality: 'France',    dateOfBirth: '1997-11-14', height: '1.75 m', foot: 'Right', birthPlace: 'Lagny-sur-Marne' },
          { id: 212, name: 'Nicolas Jackson',         position: 'Centre-Forward',      nationality: 'Senegal',   dateOfBirth: '2001-06-20', height: '1.86 m', foot: 'Right', birthPlace: 'Banjul' },
          { id: 213, name: 'Noni Madueke',            position: 'Right Winger',        nationality: 'England',   dateOfBirth: '2002-03-10', height: '1.78 m', foot: 'Right', birthPlace: 'London' },
        ],
        64: [ // Liverpool
          { id: 601, name: 'Alisson Becker',          position: 'Goalkeeper',          nationality: 'Brazil',      dateOfBirth: '1992-10-02', height: '1.93 m', foot: 'Right', birthPlace: 'Novo Hamburgo' },
          { id: 602, name: 'Trent Alexander-Arnold',  position: 'Right Back',          nationality: 'England',     dateOfBirth: '1998-10-07', height: '1.80 m', foot: 'Right', birthPlace: 'Liverpool' },
          { id: 603, name: 'Andrew Robertson',        position: 'Left Back',           nationality: 'Scotland',    dateOfBirth: '1994-03-11', height: '1.78 m', foot: 'Left',  birthPlace: 'Glasgow' },
          { id: 604, name: 'Virgil van Dijk',         position: 'Centre-Back',         nationality: 'Netherlands', dateOfBirth: '1991-07-08', height: '1.93 m', foot: 'Right', birthPlace: 'Breda' },
          { id: 605, name: 'Ibrahima Konaté',         position: 'Centre-Back',         nationality: 'France',      dateOfBirth: '1999-05-25', height: '1.94 m', foot: 'Right', birthPlace: 'Paris' },
          { id: 606, name: 'Alexis Mac Allister',     position: 'Central Midfield',    nationality: 'Argentina',   dateOfBirth: '1998-12-24', height: '1.74 m', foot: 'Right', birthPlace: 'La Pampa' },
          { id: 607, name: 'Dominik Szoboszlai',      position: 'Attacking Midfield',  nationality: 'Hungary',     dateOfBirth: '2000-10-25', height: '1.86 m', foot: 'Right', birthPlace: 'Szombathely' },
          { id: 608, name: 'Ryan Gravenberch',        position: 'Central Midfield',    nationality: 'Netherlands', dateOfBirth: '2002-05-16', height: '1.91 m', foot: 'Right', birthPlace: 'Amsterdam' },
          { id: 609, name: 'Mohamed Salah',           position: 'Right Winger',        nationality: 'Egypt',       dateOfBirth: '1992-06-15', height: '1.75 m', foot: 'Left',  birthPlace: 'Nagrig' },
          { id: 610, name: 'Luis Díaz',               position: 'Left Winger',         nationality: 'Colombia',    dateOfBirth: '1997-01-13', height: '1.78 m', foot: 'Right', birthPlace: 'Barrancas' },
          { id: 611, name: 'Darwin Núñez',            position: 'Centre-Forward',      nationality: 'Uruguay',     dateOfBirth: '1999-06-24', height: '1.87 m', foot: 'Right', birthPlace: 'Artigas' },
          { id: 612, name: 'Diogo Jota',              position: 'Forward',             nationality: 'Portugal',    dateOfBirth: '1996-12-04', height: '1.78 m', foot: 'Right', birthPlace: 'Massarelos' },
          { id: 613, name: 'Harvey Elliott',          position: 'Right Winger',        nationality: 'England',     dateOfBirth: '2003-04-04', height: '1.70 m', foot: 'Left',  birthPlace: 'London' },
        ],
        65: [ // Manchester City
          { id: 501, name: 'Ederson',                 position: 'Goalkeeper',          nationality: 'Brazil',    dateOfBirth: '1993-08-17', height: '1.88 m', foot: 'Left',  birthPlace: 'Osasco' },
          { id: 502, name: 'Kyle Walker',             position: 'Right Back',          nationality: 'England',   dateOfBirth: '1990-05-28', height: '1.83 m', foot: 'Right', birthPlace: 'Sheffield' },
          { id: 503, name: 'Joško Gvardiol',          position: 'Left Back',           nationality: 'Croatia',   dateOfBirth: '2002-01-23', height: '1.85 m', foot: 'Left',  birthPlace: 'Zagreb' },
          { id: 504, name: 'Rúben Dias',              position: 'Centre-Back',         nationality: 'Portugal',  dateOfBirth: '1997-05-14', height: '1.87 m', foot: 'Right', birthPlace: 'Agualva-Cacém' },
          { id: 505, name: 'Manuel Akanji',           position: 'Centre-Back',         nationality: 'Switzerland',dateOfBirth: '1995-07-19', height: '1.87 m', foot: 'Right', birthPlace: 'Wiesendangen' },
          { id: 506, name: 'Rodri',                   position: 'Defensive Midfield',  nationality: 'Spain',     dateOfBirth: '1996-06-22', height: '1.91 m', foot: 'Right', birthPlace: 'Madrid' },
          { id: 507, name: 'Kevin De Bruyne',         position: 'Attacking Midfield',  nationality: 'Belgium',   dateOfBirth: '1991-06-28', height: '1.81 m', foot: 'Right', birthPlace: 'Ghent' },
          { id: 508, name: 'Bernardo Silva',          position: 'Central Midfield',    nationality: 'Portugal',  dateOfBirth: '1994-08-10', height: '1.73 m', foot: 'Left',  birthPlace: 'Lisbon' },
          { id: 509, name: 'İlkay Gündoğan',          position: 'Central Midfield',    nationality: 'Germany',   dateOfBirth: '1990-10-24', height: '1.80 m', foot: 'Right', birthPlace: 'Gelsenkirchen' },
          { id: 510, name: 'Phil Foden',              position: 'Left Winger',         nationality: 'England',   dateOfBirth: '2000-05-28', height: '1.71 m', foot: 'Left',  birthPlace: 'Stockport' },
          { id: 511, name: 'Jeremy Doku',             position: 'Left Winger',         nationality: 'Belgium',   dateOfBirth: '2002-05-12', height: '1.72 m', foot: 'Right', birthPlace: 'Antwerp' },
          { id: 512, name: 'Erling Haaland',          position: 'Centre-Forward',      nationality: 'Norway',    dateOfBirth: '2000-07-21', height: '1.94 m', foot: 'Left',  birthPlace: 'Leeds' },
          { id: 513, name: 'Jack Grealish',           position: 'Left Winger',         nationality: 'England',   dateOfBirth: '1995-09-10', height: '1.80 m', foot: 'Left',  birthPlace: 'Birmingham' },
          { id: 514, name: 'Oscar Bobb',              position: 'Right Winger',        nationality: 'Norway',    dateOfBirth: '2003-07-12', height: '1.76 m', foot: 'Left',  birthPlace: 'Bergen' },
        ],
        66: [ // Manchester United
          { id: 1001, name: 'André Onana',            position: 'Goalkeeper',          nationality: 'Cameroon',  dateOfBirth: '1996-04-02', height: '1.90 m', foot: 'Right', birthPlace: 'Nkol Ngok' },
          { id: 1002, name: 'Diogo Dalot',            position: 'Right Back',          nationality: 'Portugal',  dateOfBirth: '1999-03-18', height: '1.83 m', foot: 'Right', birthPlace: 'Braga' },
          { id: 1003, name: 'Luke Shaw',              position: 'Left Back',           nationality: 'England',   dateOfBirth: '1995-07-12', height: '1.85 m', foot: 'Left',  birthPlace: 'Kingston upon Thames' },
          { id: 1004, name: 'Raphaël Varane',         position: 'Centre-Back',         nationality: 'France',    dateOfBirth: '1993-04-25', height: '1.91 m', foot: 'Right', birthPlace: 'Lille' },
          { id: 1005, name: 'Harry Maguire',          position: 'Centre-Back',         nationality: 'England',   dateOfBirth: '1993-03-05', height: '1.94 m', foot: 'Right', birthPlace: 'Sheffield' },
          { id: 1006, name: 'Lisandro Martínez',      position: 'Centre-Back',         nationality: 'Argentina', dateOfBirth: '1998-01-18', height: '1.78 m', foot: 'Left',  birthPlace: 'Gálvez' },
          { id: 1007, name: 'Casemiro',               position: 'Defensive Midfield',  nationality: 'Brazil',    dateOfBirth: '1992-02-23', height: '1.85 m', foot: 'Right', birthPlace: 'São José dos Campos' },
          { id: 1008, name: 'Bruno Fernandes',        position: 'Attacking Midfield',  nationality: 'Portugal',  dateOfBirth: '1994-09-08', height: '1.79 m', foot: 'Right', birthPlace: 'Maia' },
          { id: 1009, name: 'Mason Mount',            position: 'Central Midfield',    nationality: 'England',   dateOfBirth: '1999-01-10', height: '1.78 m', foot: 'Right', birthPlace: 'Portsmouth' },
          { id: 1010, name: 'Marcus Rashford',        position: 'Left Winger',         nationality: 'England',   dateOfBirth: '1997-10-31', height: '1.80 m', foot: 'Right', birthPlace: 'Manchester' },
          { id: 1011, name: 'Antony',                 position: 'Right Winger',        nationality: 'Brazil',    dateOfBirth: '2000-02-24', height: '1.75 m', foot: 'Left',  birthPlace: 'Osasco' },
          { id: 1012, name: 'Rasmus Højlund',         position: 'Centre-Forward',      nationality: 'Denmark',   dateOfBirth: '2003-02-04', height: '1.91 m', foot: 'Right', birthPlace: 'Copenhagen' },
          { id: 1013, name: 'Alejandro Garnacho',     position: 'Left Winger',         nationality: 'Argentina', dateOfBirth: '2004-07-01', height: '1.80 m', foot: 'Left',  birthPlace: 'Madrid' },
        ],
        73: [ // Tottenham
          { id: 1101, name: 'Guglielmo Vicario',      position: 'Goalkeeper',          nationality: 'Italy',       dateOfBirth: '1996-10-07', height: '1.94 m', foot: 'Right', birthPlace: 'Udine' },
          { id: 1102, name: 'Pedro Porro',            position: 'Right Back',          nationality: 'Spain',       dateOfBirth: '1999-09-13', height: '1.79 m', foot: 'Right', birthPlace: 'Badajoz' },
          { id: 1103, name: 'Destiny Udogie',         position: 'Left Back',           nationality: 'Italy',       dateOfBirth: '2002-11-28', height: '1.85 m', foot: 'Left',  birthPlace: 'Verona' },
          { id: 1104, name: 'Cristian Romero',        position: 'Centre-Back',         nationality: 'Argentina',   dateOfBirth: '1998-04-27', height: '1.85 m', foot: 'Right', birthPlace: 'Córdoba' },
          { id: 1105, name: 'Micky van de Ven',       position: 'Centre-Back',         nationality: 'Netherlands', dateOfBirth: '2001-04-19', height: '1.93 m', foot: 'Left',  birthPlace: 'Aalsmeer' },
          { id: 1106, name: 'Yves Bissouma',          position: 'Defensive Midfield',  nationality: 'Mali',        dateOfBirth: '1996-08-30', height: '1.83 m', foot: 'Right', birthPlace: 'Issia' },
          { id: 1107, name: 'James Maddison',         position: 'Attacking Midfield',  nationality: 'England',     dateOfBirth: '1996-11-23', height: '1.75 m', foot: 'Right', birthPlace: 'Coventry' },
          { id: 1108, name: 'Pape Matar Sarr',        position: 'Central Midfield',    nationality: 'Senegal',     dateOfBirth: '2002-09-14', height: '1.88 m', foot: 'Right', birthPlace: 'Thiès' },
          { id: 1109, name: 'Brennan Johnson',        position: 'Right Winger',        nationality: 'Wales',       dateOfBirth: '2001-05-23', height: '1.79 m', foot: 'Left',  birthPlace: 'Nottingham' },
          { id: 1110, name: 'Son Heung-min',          position: 'Left Winger',         nationality: 'South Korea', dateOfBirth: '1992-07-08', height: '1.83 m', foot: 'Left',  birthPlace: 'Chuncheon' },
          { id: 1111, name: 'Dominic Solanke',        position: 'Centre-Forward',      nationality: 'England',     dateOfBirth: '1997-09-14', height: '1.86 m', foot: 'Right', birthPlace: 'Reading' },
          { id: 1112, name: 'Richarlison',            position: 'Centre-Forward',      nationality: 'Brazil',      dateOfBirth: '1997-05-10', height: '1.81 m', foot: 'Right', birthPlace: 'Nova Venécia' },
        ],
        81: [ // Barcelona
          { id: 1201, name: 'Marc-André ter Stegen',  position: 'Goalkeeper',          nationality: 'Germany',   dateOfBirth: '1992-04-30', height: '1.87 m', foot: 'Right', birthPlace: 'Mönchengladbach' },
          { id: 1202, name: 'Jules Koundé',           position: 'Right Back',          nationality: 'France',    dateOfBirth: '1998-11-12', height: '1.79 m', foot: 'Right', birthPlace: 'Paris' },
          { id: 1203, name: 'Alejandro Balde',        position: 'Left Back',           nationality: 'Spain',     dateOfBirth: '2003-10-18', height: '1.79 m', foot: 'Left',  birthPlace: 'Barcelona' },
          { id: 1204, name: 'Andreas Christensen',    position: 'Centre-Back',         nationality: 'Denmark',   dateOfBirth: '1996-04-10', height: '1.88 m', foot: 'Right', birthPlace: 'Lillerød' },
          { id: 1205, name: 'Pau Cubarsí',            position: 'Centre-Back',         nationality: 'Spain',     dateOfBirth: '2007-01-22', height: '1.87 m', foot: 'Left',  birthPlace: 'Martorell' },
          { id: 1206, name: 'Frenkie de Jong',        position: 'Central Midfield',    nationality: 'Netherlands',dateOfBirth: '1997-05-12', height: '1.80 m', foot: 'Right', birthPlace: 'Arkel' },
          { id: 1207, name: 'Pedri',                  position: 'Central Midfield',    nationality: 'Spain',     dateOfBirth: '2002-11-25', height: '1.74 m', foot: 'Right', birthPlace: 'Tegueste' },
          { id: 1208, name: 'Gavi',                   position: 'Central Midfield',    nationality: 'Spain',     dateOfBirth: '2004-08-05', height: '1.73 m', foot: 'Left',  birthPlace: 'Los Palacios y Villafranca' },
          { id: 1209, name: 'Lamine Yamal',           position: 'Right Winger',        nationality: 'Spain',     dateOfBirth: '2007-07-13', height: '1.77 m', foot: 'Right', birthPlace: 'Esplugues de Llobregat' },
          { id: 1210, name: 'Raphinha',               position: 'Right Winger',        nationality: 'Brazil',    dateOfBirth: '1996-12-14', height: '1.76 m', foot: 'Left',  birthPlace: 'Porto Alegre' },
          { id: 1211, name: 'Robert Lewandowski',     position: 'Centre-Forward',      nationality: 'Poland',    dateOfBirth: '1988-08-21', height: '1.85 m', foot: 'Right', birthPlace: 'Warsaw' },
          { id: 1212, name: 'Ferran Torres',          position: 'Left Winger',         nationality: 'Spain',     dateOfBirth: '2000-02-29', height: '1.82 m', foot: 'Right', birthPlace: 'Foios' },
          { id: 1213, name: 'Ansu Fati',              position: 'Left Winger',         nationality: 'Spain',     dateOfBirth: '2002-10-31', height: '1.80 m', foot: 'Right', birthPlace: 'Bissau' },
        ],
        86: [ // Real Madrid
          { id: 401, name: 'Thibaut Courtois',        position: 'Goalkeeper',          nationality: 'Belgium',   dateOfBirth: '1992-05-11', height: '1.99 m', foot: 'Left',  birthPlace: 'Bree' },
          { id: 402, name: 'Andriy Lunin',            position: 'Goalkeeper',          nationality: 'Ukraine',   dateOfBirth: '1999-02-11', height: '1.92 m', foot: 'Right', birthPlace: 'Znamianka' },
          { id: 403, name: 'Dani Carvajal',           position: 'Right Back',          nationality: 'Spain',     dateOfBirth: '1992-01-11', height: '1.73 m', foot: 'Right', birthPlace: 'Leganés' },
          { id: 404, name: 'Ferland Mendy',           position: 'Left Back',           nationality: 'France',    dateOfBirth: '1995-06-08', height: '1.80 m', foot: 'Left',  birthPlace: 'Meulan-en-Yvelines' },
          { id: 405, name: 'Éder Militão',            position: 'Centre-Back',         nationality: 'Brazil',    dateOfBirth: '1998-01-18', height: '1.86 m', foot: 'Right', birthPlace: 'São Paulo' },
          { id: 406, name: 'Antonio Rüdiger',         position: 'Centre-Back',         nationality: 'Germany',   dateOfBirth: '1993-03-03', height: '1.90 m', foot: 'Right', birthPlace: 'Berlin' },
          { id: 407, name: 'Luka Modrić',             position: 'Central Midfield',    nationality: 'Croatia',   dateOfBirth: '1985-09-09', height: '1.72 m', foot: 'Right', birthPlace: 'Zadar' },
          { id: 408, name: 'Aurélien Tchouaméni',     position: 'Defensive Midfield',  nationality: 'France',    dateOfBirth: '2000-01-27', height: '1.87 m', foot: 'Right', birthPlace: 'Rouen' },
          { id: 409, name: 'Eduardo Camavinga',       position: 'Central Midfield',    nationality: 'France',    dateOfBirth: '2002-11-10', height: '1.82 m', foot: 'Left',  birthPlace: 'Miconje' },
          { id: 410, name: 'Federico Valverde',       position: 'Central Midfield',    nationality: 'Uruguay',   dateOfBirth: '1998-07-22', height: '1.82 m', foot: 'Right', birthPlace: 'Montevideo' },
          { id: 411, name: 'Jude Bellingham',         position: 'Attacking Midfield',  nationality: 'England',   dateOfBirth: '2003-06-29', height: '1.86 m', foot: 'Right', birthPlace: 'Stourbridge' },
          { id: 412, name: 'Vinícius Júnior',         position: 'Left Winger',         nationality: 'Brazil',    dateOfBirth: '2000-07-12', height: '1.76 m', foot: 'Right', birthPlace: 'São Gonçalo' },
          { id: 413, name: 'Rodrygo',                 position: 'Right Winger',        nationality: 'Brazil',    dateOfBirth: '2001-01-09', height: '1.74 m', foot: 'Right', birthPlace: 'Santos' },
          { id: 414, name: 'Kylian Mbappé',           position: 'Centre-Forward',      nationality: 'France',    dateOfBirth: '1998-12-20', height: '1.78 m', foot: 'Right', birthPlace: 'Paris' },
          { id: 415, name: 'Brahim Díaz',             position: 'Right Winger',        nationality: 'Spain',     dateOfBirth: '1999-08-03', height: '1.72 m', foot: 'Right', birthPlace: 'Málaga' },
        ],
        98: [ // AC Milan
          { id: 701, name: 'Mike Maignan',            position: 'Goalkeeper',          nationality: 'France',     dateOfBirth: '1995-07-03', height: '1.91 m', foot: 'Right', birthPlace: 'Cayenne' },
          { id: 702, name: 'Davide Calabria',         position: 'Right Back',          nationality: 'Italy',      dateOfBirth: '1996-12-06', height: '1.77 m', foot: 'Right', birthPlace: 'Brescia' },
          { id: 703, name: 'Theo Hernández',          position: 'Left Back',           nationality: 'France',     dateOfBirth: '1997-10-06', height: '1.84 m', foot: 'Left',  birthPlace: 'Marseille' },
          { id: 704, name: 'Malick Thiaw',            position: 'Centre-Back',         nationality: 'Germany',    dateOfBirth: '2001-08-08', height: '1.93 m', foot: 'Right', birthPlace: 'Düsseldorf' },
          { id: 705, name: 'Fikayo Tomori',           position: 'Centre-Back',         nationality: 'England',    dateOfBirth: '1997-12-19', height: '1.85 m', foot: 'Right', birthPlace: 'Calgary' },
          { id: 706, name: 'Ismael Bennacer',         position: 'Defensive Midfield',  nationality: 'Algeria',    dateOfBirth: '1997-12-01', height: '1.75 m', foot: 'Right', birthPlace: 'Arles' },
          { id: 707, name: 'Tijjani Reijnders',       position: 'Central Midfield',    nationality: 'Netherlands',dateOfBirth: '1998-07-29', height: '1.85 m', foot: 'Right', birthPlace: 'Anna Paulowna' },
          { id: 708, name: 'Ruben Loftus-Cheek',      position: 'Central Midfield',    nationality: 'England',    dateOfBirth: '1996-01-23', height: '1.91 m', foot: 'Right', birthPlace: 'London' },
          { id: 709, name: 'Rafael Leão',             position: 'Left Winger',         nationality: 'Portugal',   dateOfBirth: '1999-06-10', height: '1.88 m', foot: 'Right', birthPlace: 'Almada' },
          { id: 710, name: 'Samuel Chukwueze',        position: 'Right Winger',        nationality: 'Nigeria',    dateOfBirth: '1999-05-22', height: '1.73 m', foot: 'Left',  birthPlace: 'Umuahia' },
          { id: 711, name: 'Christian Pulisic',       position: 'Right Winger',        nationality: 'USA',        dateOfBirth: '1998-09-18', height: '1.77 m', foot: 'Right', birthPlace: 'Hershey' },
          { id: 712, name: 'Olivier Giroud',          position: 'Centre-Forward',      nationality: 'France',     dateOfBirth: '1986-09-30', height: '1.92 m', foot: 'Right', birthPlace: 'Chambéry' },
          { id: 713, name: 'Luka Jović',              position: 'Centre-Forward',      nationality: 'Serbia',     dateOfBirth: '1997-12-23', height: '1.82 m', foot: 'Right', birthPlace: 'Bijeljina' },
        ],
        108: [ // Inter
          { id: 801, name: 'Yann Sommer',             position: 'Goalkeeper',          nationality: 'Switzerland',dateOfBirth: '1988-12-17', height: '1.83 m', foot: 'Right', birthPlace: 'Morges' },
          { id: 802, name: 'Matteo Darmian',          position: 'Right Back',          nationality: 'Italy',      dateOfBirth: '1989-12-02', height: '1.81 m', foot: 'Right', birthPlace: 'Legnano' },
          { id: 803, name: 'Federico Dimarco',        position: 'Left Back',           nationality: 'Italy',      dateOfBirth: '1997-11-10', height: '1.77 m', foot: 'Left',  birthPlace: 'Milan' },
          { id: 804, name: 'Francesco Acerbi',        position: 'Centre-Back',         nationality: 'Italy',      dateOfBirth: '1988-02-10', height: '1.92 m', foot: 'Right', birthPlace: 'Vizzolo Predabissi' },
          { id: 805, name: 'Alessandro Bastoni',      position: 'Centre-Back',         nationality: 'Italy',      dateOfBirth: '1999-04-08', height: '1.90 m', foot: 'Left',  birthPlace: 'Casalmaggiore' },
          { id: 806, name: 'Stefan de Vrij',          position: 'Centre-Back',         nationality: 'Netherlands',dateOfBirth: '1992-02-05', height: '1.89 m', foot: 'Right', birthPlace: 'Ouderkerk aan den IJssel' },
          { id: 807, name: 'Nicolò Barella',          position: 'Central Midfield',    nationality: 'Italy',      dateOfBirth: '1997-02-07', height: '1.72 m', foot: 'Right', birthPlace: 'Cagliari' },
          { id: 808, name: 'Hakan Çalhanoğlu',        position: 'Defensive Midfield',  nationality: 'Turkey',     dateOfBirth: '1994-02-08', height: '1.79 m', foot: 'Right', birthPlace: 'Mannheim' },
          { id: 809, name: 'Henrikh Mkhitaryan',      position: 'Central Midfield',    nationality: 'Armenia',    dateOfBirth: '1989-01-21', height: '1.77 m', foot: 'Right', birthPlace: 'Yerevan' },
          { id: 810, name: 'Davide Frattesi',         position: 'Central Midfield',    nationality: 'Italy',      dateOfBirth: '1999-09-22', height: '1.78 m', foot: 'Right', birthPlace: 'Rome' },
          { id: 811, name: 'Lautaro Martínez',        position: 'Centre-Forward',      nationality: 'Argentina',  dateOfBirth: '1997-08-22', height: '1.74 m', foot: 'Right', birthPlace: 'Bahía Blanca' },
          { id: 812, name: 'Marcus Thuram',           position: 'Centre-Forward',      nationality: 'France',     dateOfBirth: '1997-08-06', height: '1.92 m', foot: 'Right', birthPlace: 'Parma' },
          { id: 813, name: 'Marko Arnautović',        position: 'Centre-Forward',      nationality: 'Austria',    dateOfBirth: '1989-04-19', height: '1.92 m', foot: 'Right', birthPlace: 'Vienna' },
        ],
        109: [ // Juventus
          { id: 901, name: 'Wojciech Szczęsny',       position: 'Goalkeeper',          nationality: 'Poland',    dateOfBirth: '1990-04-18', height: '1.96 m', foot: 'Right', birthPlace: 'Warsaw' },
          { id: 902, name: 'Danilo',                  position: 'Right Back',          nationality: 'Brazil',    dateOfBirth: '1991-07-15', height: '1.84 m', foot: 'Right', birthPlace: 'Bicas' },
          { id: 903, name: 'Andrea Cambiaso',         position: 'Left Back',           nationality: 'Italy',     dateOfBirth: '2000-02-22', height: '1.83 m', foot: 'Left',  birthPlace: 'Genoa' },
          { id: 904, name: 'Gleison Bremer',          position: 'Centre-Back',         nationality: 'Brazil',    dateOfBirth: '1997-03-18', height: '1.87 m', foot: 'Right', birthPlace: 'Itapitanga' },
          { id: 905, name: 'Federico Gatti',          position: 'Centre-Back',         nationality: 'Italy',     dateOfBirth: '1998-06-08', height: '1.90 m', foot: 'Right', birthPlace: 'Romano Canavese' },
          { id: 906, name: 'Manuel Locatelli',        position: 'Defensive Midfield',  nationality: 'Italy',     dateOfBirth: '1998-01-08', height: '1.84 m', foot: 'Right', birthPlace: 'Lecco' },
          { id: 907, name: 'Adrien Rabiot',           position: 'Central Midfield',    nationality: 'France',    dateOfBirth: '1995-04-03', height: '1.88 m', foot: 'Right', birthPlace: 'Saint-Maurice' },
          { id: 908, name: 'Nicolò Fagioli',          position: 'Central Midfield',    nationality: 'Italy',     dateOfBirth: '2001-02-12', height: '1.79 m', foot: 'Right', birthPlace: 'Piacenza' },
          { id: 909, name: 'Kenan Yıldız',            position: 'Attacking Midfield',  nationality: 'Turkey',    dateOfBirth: '2005-05-04', height: '1.85 m', foot: 'Right', birthPlace: 'Regensburg' },
          { id: 910, name: 'Weston McKennie',         position: 'Central Midfield',    nationality: 'USA',       dateOfBirth: '1998-08-28', height: '1.83 m', foot: 'Right', birthPlace: 'Little Elm' },
          { id: 911, name: 'Dušan Vlahović',          position: 'Centre-Forward',      nationality: 'Serbia',    dateOfBirth: '2000-01-28', height: '1.90 m', foot: 'Left',  birthPlace: 'Belgrade' },
          { id: 912, name: 'Federico Chiesa',         position: 'Right Winger',        nationality: 'Italy',     dateOfBirth: '1997-10-25', height: '1.75 m', foot: 'Right', birthPlace: 'Genoa' },
          { id: 913, name: 'Arkadiusz Milik',         position: 'Centre-Forward',      nationality: 'Poland',    dateOfBirth: '1994-02-28', height: '1.87 m', foot: 'Right', birthPlace: 'Tychy' },
          { id: 914, name: 'Timothy Weah',            position: 'Right Winger',        nationality: 'USA',       dateOfBirth: '2000-02-22', height: '1.80 m', foot: 'Right', birthPlace: 'New York' },
        ],
      },

      squad:                 [],
      searchQuery:           '',
      selectedTeamId:        '',
      selectedPlayerDetails: null,
      playerPhotoUrl:        '',
      loading:               false,
      error:                 null,
      aiDescription:         '',
      aiLoading:             false,
    };
  },

  computed: {
    filteredSquad() {
      if (!this.searchQuery) return this.squad;
      return this.squad.filter(p =>
        p.name && p.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    },
  },

  methods: {
    async fetchTeamSquad() {
      if (!this.selectedTeamId) { this.squad = []; return; }
      this.loading               = true;
      this.error                 = null;
      this.searchQuery           = '';
      this.selectedPlayerDetails = null;
      this.aiDescription         = '';

      try {
        const proxyUrl  = 'https://api.allorigins.win/get?url=';
        const targetUrl = `https://api.football-data.org/v4/teams/${this.selectedTeamId}`;
        const response  = await fetch(proxyUrl + encodeURIComponent(targetUrl), {
          headers: { 'X-Auth-Token': this.footballDataToken },
        });
        const json = await response.json();
        const data = JSON.parse(json.contents);
        if (data && data.squad && data.squad.length > 0) {
          this.squad = data.squad;
        } else {
          this.loadFromLocalDB();
        }
      } catch {
        this.loadFromLocalDB();
      } finally {
        this.loading = false;
      }
    },

    loadFromLocalDB() {
      const tid  = parseInt(this.selectedTeamId);
      this.squad = this.databaseLocale[tid] || [];
      if (!this.squad.length) {
        this.error = 'Nessun dato disponibile per questa squadra.';
      }
    },

    async selectPlayer(player) {
      this.loading               = true;
      this.selectedPlayerDetails = null;
      this.aiDescription         = '';
      this.playerPhotoUrl        = '';

      const teamName = this.teams.find(t => t.id === this.selectedTeamId)?.name || 'Club';

      this.selectedPlayerDetails = {
        strPlayer:        player.name,
        strPosition:      player.position,
        dateBorn:         player.dateOfBirth || 'N/D',
        strTeam:          teamName,
        strHeight:        player.height    || 'N/D',
        strSide:          player.foot      || 'N/D',
        strBirthLocation: player.birthPlace || player.nationality || 'N/D',
        strThumb:         null,
        wikipediaText:    '',
        nationality:      player.nationality || '',
      };

      try {
        const sportsDbUrl = `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(player.name)}`;
        const res  = await fetch(sportsDbUrl);
        const data = await res.json();
        if (data.player && data.player.length > 0) {
          // Priorità: thumb, poi cutout, poi fanart
          const p = data.player[0];
          this.playerPhotoUrl = p.strThumb || p.strCutout || p.strFanart1 || '';
          this.selectedPlayerDetails.strThumb = this.playerPhotoUrl;
        }
      } catch { /* silenzioso */ }

      if (!this.playerPhotoUrl) {
        this.playerPhotoUrl = this.generateAvatarUrl(player.name);
      }

      try {
        const wikiUrl = `https://it.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(player.name)}&format=json&origin=*`;
        const res     = await fetch(wikiUrl);
        const data    = await res.json();
        const pages   = data.query.pages;
        const pageId  = Object.keys(pages)[0];
        if (pageId !== '-1') {
          this.selectedPlayerDetails.wikipediaText = pages[pageId].extract || '';
        } else {
          const searchUrl = `https://it.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(player.name + ' calciatore')}&format=json&origin=*`;
          const sr   = await fetch(searchUrl);
          const sj   = await sr.json();
          if (sj.query.search.length > 0) {
            const titolo     = sj.query.search[0].title;
            const contentUrl = `https://it.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(titolo)}&format=json&origin=*`;
            const cr   = await fetch(contentUrl);
            const cj   = await cr.json();
            const pg   = cj.query.pages;
            this.selectedPlayerDetails.wikipediaText = pg[Object.keys(pg)[0]].extract || '';
          }
        }
      } catch { /* silenzioso */ }

      this.loading = false;
    },

    generateAvatarUrl(name) {
      const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=1a2742&color=58a6ff&bold=true&font-size=0.45`;
    },

    closeModal() {
      this.selectedPlayerDetails = null;
      this.aiDescription         = '';
      this.playerPhotoUrl        = '';
    },

    onImgError(e) {
      const name = this.selectedPlayerDetails?.strPlayer || 'PL';
      e.target.src = this.generateAvatarUrl(name);
      e.target.onerror = null; // evita loop infiniti
    },

    formatDate(dateStr) {
      if (!dateStr || dateStr === 'N/D') return 'N/D';
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
      } catch { return dateStr; }
    },

    async generateAiAnalysis() {
      this.aiLoading     = true;
      this.aiDescription = '';

      const p    = this.selectedPlayerDetails;
      const wiki = (p.wikipediaText || '').substring(0, 1200);

      let eta = '';
      if (p.dateBorn && p.dateBorn !== 'N/D') {
        const anni = new Date().getFullYear() - new Date(p.dateBorn).getFullYear();
        eta = `${anni} anni`;
      }

      const prompt = `
Sei un commentatore calcistico professionista di Sky Sport Italia. Scrivi una scheda tecnica SPECIFICA e DETTAGLIATA su ${p.strPlayer}.

DATI CERTI DEL GIOCATORE (usali SEMPRE, non inventarne altri):
- Nome completo: ${p.strPlayer}
- Età: ${eta}
- Squadra attuale: ${p.strTeam}
- Ruolo principale: ${p.strPosition}
- Altezza REALE: ${p.strHeight} (cita questo valore esatto)
- Piede naturale: ${p.strSide}
- Nazionalità: ${p.nationality}
- Luogo di nascita: ${p.strBirthLocation}

TESTO DI ARCHIVIO WIKIPEDIA (usa queste informazioni reali per l'analisi):
${wiki || 'Non disponibile. Usa solo i dati certi sopra riportati.'}

ISTRUZIONI TASSATIVE:
1. Scrivi SOLO di ${p.strPlayer}, non di altri giocatori.
2. Usa obbligatoriamente l'altezza esatta "${p.strHeight}" nella scheda.
3. Traduci il ruolo in italiano: Right Winger=Ala Destra, Left Winger=Ala Sinistra, Centre-Forward=Centravanti, Attacking Midfield=Trequartista, Central Midfield=Centrocampista, Defensive Midfield=Mediano, Right Back=Terzino Destro, Left Back=Terzino Sinistro, Centre-Back=Difensore Centrale, Goalkeeper=Portiere.
4. Descrivi il suo stile di gioco SPECIFICO basandoti sui dati Wikipedia forniti.
5. Menziona la sua nazionalità e la squadra attuale.
6. NON inventare trasferimenti, premi o statistiche non presenti nei dati forniti.
7. Massimo 4 frasi. Separa ogni frase con il tag <br>.
8. Tono: appassionato e tecnico come un telecronista Sky.
`.trim();

      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model:      'claude-sonnet-4-20250514',
            max_tokens: 1000,
            system:     'Sei un esperto commentatore calcistico italiano. Rispondi SOLO con il testo della scheda tecnica, senza preamboli, senza asterischi e senza markdown. Usa <br> per separare le frasi.',
            messages:   [{ role: 'user', content: prompt }],
          }),
        });

        if (!response.ok) throw new Error(`API HTTP ${response.status}`);

        const json = await response.json();
        const text = json?.content?.[0]?.text || '';

        if (text && text.trim()) {
          this.aiDescription = text.trim();
        } else {
          throw new Error('Risposta vuota');
        }
      } catch (err) {
        console.error('AI error:', err);
        
        const ruolo = this.translateWord(p.strPosition);
        this.aiDescription =
          `<b>${p.strPlayer}</b> è un calciatore professionista di nazionalità <b>${this.translateWord(p.nationality)}</b>, attualmente in forza al <b>${p.strTeam}</b>.<br>` +
          `Gioca nel ruolo di <b>${ruolo}</b>, con un'altezza di <b>${p.strHeight}</b> e piede naturale <b>${this.translateWord(p.strSide).toLowerCase()}</b>.<br>` +
          `Nato a ${p.strBirthLocation}${eta ? `, ha ${eta}` : ''}, è considerato uno dei profili più interessanti nel suo ruolo.<br>` +
          `La sua tecnica individuale e la sua visione di gioco lo rendono un elemento fondamentale nel sistema tattico della squadra.`;
      } finally {
        this.aiLoading = false;
      }
    },

    translateWord(word) {
      if (!word || word === 'N/D') return 'N/D';
      const clean = word.trim().toLowerCase();
      const dict  = {
        // Ruoli
        'goalkeeper':         'Portiere',
        'centre-back':        'Difensore Centrale',
        'right back':         'Terzino Destro',
        'left back':          'Terzino Sinistro',
        'defender':           'Difensore',
        'central midfield':   'Centrocampista Centrale',
        'defensive midfield': 'Mediano',
        'attacking midfield': 'Trequartista',
        'right winger':       'Ala Destra',
        'left winger':        'Ala Sinistra',
        'winger':             'Ala',
        'forward':            'Attaccante',
        'centre-forward':     'Centravanti',
        'left':   'Sinistro',
        'right':  'Destro',
        'both':   'Entrambi',
        'england':      'Inghilterra',
        'portugal':     'Portogallo',
        'argentina':    'Argentina',
        'france':       'Francia',
        'brazil':       'Brasile',
        'spain':        'Spagna',
        'italy':        'Italia',
        'norway':       'Norvegia',
        'belgium':      'Belgio',
        'croatia':      'Croazia',
        'senegal':      'Senegal',
        'ecuador':      'Ecuador',
        'egypt':        'Egitto',
        'netherlands':  'Paesi Bassi',
        'poland':       'Polonia',
        'turkey':       'Turchia',
        'serbia':       'Serbia',
        'denmark':      'Danimarca',
        'uruguay':      'Uruguay',
        'colombia':     'Colombia',
        'south korea':  'Corea del Sud',
        'germany':      'Germania',
        'ghana':        'Ghana',
        'ukraine':      'Ucraina',
        'hungary':      'Ungheria',
        'scotland':     'Scozia',
        'wales':        'Galles',
        'austria':      'Austria',
        'armenia':      'Armenia',
        'switzerland':  'Svizzera',
        'algeria':      'Algeria',
        'nigeria':      'Nigeria',
        'cameroon':     'Camerun',
        'mali':         'Mali',
        'usa':          'USA',
      };
      return dict[clean] || word;
    },
  },
};
</script>

<style scoped>
.player-search-container {
  padding: 24px;
  font-family: 'Segoe UI', sans-serif;
  color: #fff;
  background-color: #0d1117;
  min-height: 100vh;
}

h2 {
  font-size: 22px;
  font-weight: 500;
  color: #58a6ff;
  margin-bottom: 20px;
}
.search-controls {
  display: flex;
  gap: 14px;
  margin-bottom: 26px;
  flex-wrap: wrap;
}
select, input[type='text'] {
  padding: 11px 14px;
  font-size: 15px;
  border: 1px solid #30363d;
  border-radius: 8px;
  background-color: #161b22;
  color: #fff;
  outline: none;
  transition: border-color 0.2s;
}

select { cursor: pointer; min-width: 220px; }
select:focus, input[type='text']:focus { border-color: #58a6ff; }
input[type='text'] { flex: 1; min-width: 180px; }
input[type='text']:disabled { background-color: #21262d; cursor: not-allowed; color: #555; }
.status-message { margin: 16px 0; font-size: 15px; color: #58a6ff; }
.status-message.error {
  color: #f85149;
  background: rgba(248,81,73,.1);
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid rgba(248,81,73,.25);
}
.text-muted { color: #8b949e; }

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 10px;
}

.player-card {
  border: 1px solid #30363d;
  padding: 16px 18px;
  border-radius: 12px;
  background: #161b22;
  cursor: pointer;
  transition: transform .18s, border-color .18s;
}
.player-card:hover { transform: translateY(-4px); border-color: #58a6ff; }
.player-card h3 { margin: 0 0 8px; font-size: 15px; font-weight: 500; color: #58a6ff; }
.player-card p  { font-size: 13px; color: #8b949e; margin: 3px 0; }
.player-card p strong { color: #c9d1d9; }

.player-detail-modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.modal-content {
  background: #161b22;
  border: 1px solid #30363d;
  color: #fff;
  padding: 28px;
  border-radius: 16px;
  max-width: 650px;
  width: 100%;
  position: relative;
  max-height: 88vh;
  overflow-y: auto;
}

.close-btn {
  position: absolute;
  top: 14px; right: 18px;
  font-size: 32px;
  background: none; border: none;
  color: #8b949e; cursor: pointer; line-height: 1;
}
.close-btn:hover { color: #fff; }

.modal-body { display: flex; gap: 24px; }
@media (max-width: 540px) { .modal-body { flex-direction: column; } }

.player-photo-container { flex: 0 0 auto; text-align: center; }
.player-photo {
  width: 160px;
  height: 200px;
  border-radius: 12px;
  border: 2px solid #30363d;
  object-fit: cover;
  background: #1a2742;
  display: block;
}

.player-info { flex: 1; }
.player-info h2 { margin-top: 0; margin-bottom: 12px; color: #58a6ff; font-size: 18px; }
.player-info p  { font-size: 14px; color: #c9d1d9; margin: 5px 0; }
.player-info p strong { color: #fff; }

.ai-bio-container {
  margin-top: 20px;
  background: #0d1117;
  border: 1px solid #30363d;
  padding: 14px 16px;
  border-radius: 10px;
}
.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.ai-header h3 { margin: 0; font-size: 14px; font-weight: 500; color: #58a6ff; }

.ai-btn {
  background: #238636; color: #fff;
  border: none; padding: 7px 14px;
  border-radius: 6px; cursor: pointer;
  font-size: 13px; font-weight: 600;
  white-space: nowrap; transition: background .2s;
}
.ai-btn:hover:not(:disabled) { background: #2ea043; }
.ai-btn:disabled { background: #21262d; color: #555; cursor: not-allowed; }

.ai-content    { font-size: 14px; line-height: 1.75; color: #c9d1d9; }
.ai-placeholder { font-size: 13px; color: #8b949e; font-style: italic; }
</style>  rimuovi i commenti