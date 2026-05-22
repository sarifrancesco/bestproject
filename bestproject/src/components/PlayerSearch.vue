<template>
  <div class="contenitore-ricerca">
    <h2>⚽ Cerca Giocatori e Dettagli</h2>

    <div class="controlli-ricerca">
      <select v-model="squadraSelezionataId" @change="caricaRosa">
        <option value="">Seleziona una squadra...</option>
        <option v-for="squadra in squadre" :key="squadra.id" :value="squadra.id">
          {{ squadra.nome }}
        </option>
      </select>
      <input
        type="text"
        v-model="testoRicerca"
        placeholder="Digita il nome del giocatore..."
        :disabled="!squadraSelezionataId"
      />
    </div>

    <div v-if="caricamento" class="messaggio-stato">Caricamento rosa in corso...</div>
    <div v-if="errore" class="messaggio-stato errore">{{ errore }}</div>

    <div v-if="rosaFiltrata.length > 0" class="griglia-giocatori">
      <div
        v-for="giocatore in rosaFiltrata"
        :key="giocatore.id"
        class="scheda-giocatore"
        @click="apriDettaglioGiocatore(giocatore)"
      >
        <h3>{{ giocatore.nome }}</h3>
        <p><strong>Ruolo:</strong> {{ traduci(giocatore.ruolo) }}</p>
        <p><strong>Nazionalità:</strong> {{ traduci(giocatore.nazionalita) }}</p>
      </div>
    </div>
    <div v-else-if="squadraSelezionataId && !caricamento" class="messaggio-stato testo-attenuato">
      Nessun giocatore trovato. Modifica i criteri di ricerca.
    </div>

    <div v-if="giocatoreAperto" class="modale-dettaglio">
      <div class="contenuto-modale">
        <button class="pulsante-chiudi" @click="chiudiModale">×</button>
        <div class="corpo-modale">

          <div class="contenitore-foto">
            <img
              :src="urlFotoGiocatore"
              :alt="giocatoreAperto.nomeCompleto"
              class="foto-giocatore"
            />
          </div>

          <div class="info-giocatore">
            <h2>{{ giocatoreAperto.nomeCompleto }}</h2>
            <p><strong>Squadra:</strong> {{ giocatoreAperto.squadra }}</p>
            <p><strong>Data di Nascita:</strong> {{ formattaData(giocatoreAperto.dataNascita) }}</p>
            <p><strong>Luogo di Nascita:</strong> {{ giocatoreAperto.luogoNascita || 'N/D' }}</p>
            <p><strong>Altezza:</strong> {{ giocatoreAperto.altezza || 'N/D' }}</p>
            <p><strong>Piede Preferito:</strong> {{ traduci(giocatoreAperto.piede) }}</p>
            <p><strong>Ruolo:</strong> {{ traduci(giocatoreAperto.ruolo) }}</p>

            <div class="contenitore-analisi-ai">
              <div class="intestazione-ai">
                <h3>Scheda Tecnica AI</h3>
                <button
                  @click="generaAnalisiAi"
                  :disabled="analisiInCorso"
                  class="pulsante-ai"
                >
                  {{ analisiInCorso ? 'Elaborazione...' : 'Genera Analisi' }}
                </button>
              </div>
              <div v-if="testoAnalisiAi" class="testo-analisi">
                <p v-html="testoAnalisiAi"></p>
              </div>
              <div v-else-if="!analisiInCorso" class="segnaposto-ai">
                Clicca per interrogare Wikipedia e generare il resoconto con l'AI.
              </div>
              <div v-else class="segnaposto-ai">
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
  name: 'RicercaGiocatori',

  data() {
    return {
      tokenFootballData: '6459fc74fc754feb958eaec98f888338',

      squadre: [
        { id: 57,  nome: 'Arsenal FC' },
        { id: 61,  nome: 'Chelsea FC' },
        { id: 64,  nome: 'Liverpool FC' },
        { id: 65,  nome: 'Manchester City FC' },
        { id: 66,  nome: 'Manchester United FC' },
        { id: 73,  nome: 'Tottenham Hotspur FC' },
        { id: 81,  nome: 'FC Barcelona' },
        { id: 86,  nome: 'Real Madrid CF' },
        { id: 98,  nome: 'AC Milan' },
        { id: 108, nome: 'FC Internazionale Milano' },
        { id: 109, nome: 'Juventus FC' },
      ],

      rosa:                 [],
      testoRicerca:         '',
      squadraSelezionataId: '',
      giocatoreAperto:      null,
      urlFotoGiocatore:     '',
      caricamento:          false,
      errore:               null,
      testoAnalisiAi:       '',
      analisiInCorso:       false,
    };
  },

  computed: {
    rosaFiltrata() {
      if (!this.testoRicerca) return this.rosa;
      return this.rosa.filter(g =>
        g.nome && g.nome.toLowerCase().includes(this.testoRicerca.toLowerCase())
      );
    },
  },

  methods: {
    async caricaRosa() {
      if (!this.squadraSelezionataId) { this.rosa = []; return; }
      this.caricamento     = true;
      this.errore          = null;
      this.testoRicerca    = '';
      this.giocatoreAperto = null;
      this.testoAnalisiAi  = '';

      const urlProxy  = 'https://api.allorigins.win/get?url=';
      const urlTarget = `https://api.football-data.org/v4/teams/${this.squadraSelezionataId}`;
      const risposta  = await fetch(urlProxy + encodeURIComponent(urlTarget), {
        headers: { 'X-Auth-Token': this.tokenFootballData },
      });
      const json = await risposta.json();
      const dati = JSON.parse(json.contents);

      this.rosa = dati.squad.map(g => ({
        id:           g.id,
        nome:         g.name,
        ruolo:        g.position,
        nazionalita:  g.nationality,
        dataNascita:  g.dateOfBirth,
        altezza:      g.height     || 'N/D',
        piede:        g.foot       || 'N/D',
        luogoNascita: g.birthPlace || g.nationality || 'N/D',
      }));

      this.caricamento = false;
    },

    async apriDettaglioGiocatore(giocatore) {
      this.caricamento      = true;
      this.giocatoreAperto  = null;
      this.testoAnalisiAi   = '';
      this.urlFotoGiocatore = '';

      const nomeSquadra = this.squadre.find(s => s.id === this.squadraSelezionataId)?.nome || 'Club';

      this.giocatoreAperto = {
        nomeCompleto: giocatore.nome,
        ruolo:        giocatore.ruolo,
        dataNascita:  giocatore.dataNascita  || 'N/D',
        squadra:      nomeSquadra,
        altezza:      giocatore.altezza      || 'N/D',
        piede:        giocatore.piede        || 'N/D',
        luogoNascita: giocatore.luogoNascita || giocatore.nazionalita || 'N/D',
        nazionalita:  giocatore.nazionalita  || '',
        testoWikipedia: '',
      };

      const urlSportsDb = `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(giocatore.nome)}`;
      const risp  = await fetch(urlSportsDb);
      const dati  = await risp.json();
      if (dati.player && dati.player.length > 0) {
        const p = dati.player[0];
        this.urlFotoGiocatore = p.strThumb || p.strCutout || p.strFanart1 || '';
      }

      const urlWiki = `https://it.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(giocatore.nome)}&format=json&origin=*`;
      const rispostaWiki = await fetch(urlWiki);
      const datiWiki     = await rispostaWiki.json();
      const pagine       = datiWiki.query.pages;
      const idPagina     = Object.keys(pagine)[0];
      if (idPagina !== '-1') {
        this.giocatoreAperto.testoWikipedia = pagine[idPagina].extract || '';
      }

      this.caricamento = false;
    },

    chiudiModale() {
      this.giocatoreAperto  = null;
      this.testoAnalisiAi   = '';
      this.urlFotoGiocatore = '';
    },

    formattaData(strData) {
      if (!strData || strData === 'N/D') return 'N/D';
      const d = new Date(strData);
      return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
    },

    async generaAnalisiAi() {
      this.analisiInCorso = true;
      this.testoAnalisiAi = '';

      const g    = this.giocatoreAperto;
      const wiki = (g.testoWikipedia || '').substring(0, 1200);

      let etaCalcolata = '';
      if (g.dataNascita && g.dataNascita !== 'N/D') {
        const anni = new Date().getFullYear() - new Date(g.dataNascita).getFullYear();
        etaCalcolata = `${anni} anni`;
      }

      const prompt = `
Sei un commentatore calcistico professionista di Sky Sport Italia. Scrivi una scheda tecnica SPECIFICA e DETTAGLIATA su ${g.nomeCompleto}.

DATI CERTI DEL GIOCATORE (usali SEMPRE, non inventarne altri):
- Nome completo: ${g.nomeCompleto}
- Età: ${etaCalcolata}
- Squadra attuale: ${g.squadra}
- Ruolo principale: ${g.ruolo}
- Altezza REALE: ${g.altezza} (cita questo valore esatto)
- Piede naturale: ${g.piede}
- Nazionalità: ${g.nazionalita}
- Luogo di nascita: ${g.luogoNascita}

TESTO DI ARCHIVIO WIKIPEDIA (usa queste informazioni reali per l'analisi):
${wiki || 'Non disponibile. Usa solo i dati certi sopra riportati.'}

ISTRUZIONI TASSATIVE:
1. Scrivi SOLO di ${g.nomeCompleto}, non di altri giocatori.
2. Usa obbligatoriamente l'altezza esatta "${g.altezza}" nella scheda.
3. Traduci il ruolo in italiano: Right Winger=Ala Destra, Left Winger=Ala Sinistra, Centre-Forward=Centravanti, Attacking Midfield=Trequartista, Central Midfield=Centrocampista, Defensive Midfield=Mediano, Right Back=Terzino Destro, Left Back=Terzino Sinistro, Centre-Back=Difensore Centrale, Goalkeeper=Portiere.
4. Descrivi il suo stile di gioco SPECIFICO basandoti sui dati Wikipedia forniti.
5. Menziona la sua nazionalità e la squadra attuale.
6. NON inventare trasferimenti, premi o statistiche non presenti nei dati forniti.
7. Massimo 4 frasi. Separa ogni frase con il tag <br>.
8. Tono: appassionato e tecnico come un telecronista Sky.
`.trim();

      const risposta = await fetch('https://api.anthropic.com/v1/messages', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system:     'Sei un esperto commentatore calcistico italiano. Rispondi SOLO con il testo della scheda tecnica, senza preamboli, senza asterischi e senza markdown. Usa <br> per separare le frasi.',
          messages:   [{ role: 'user', content: prompt }],
        }),
      });

      const json = await risposta.json();
      this.testoAnalisiAi = json.content[0].text.trim();
      this.analisiInCorso = false;
    },

    traduci(parola) {
      if (!parola || parola === 'N/D') return 'N/D';
      const chiave = parola.trim().toLowerCase();
      const vocabolario = {
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
        'left':               'Sinistro',
        'right':              'Destro',
        'both':               'Entrambi',
        'england':            'Inghilterra',
        'portugal':           'Portogallo',
        'argentina':          'Argentina',
        'france':             'Francia',
        'brazil':             'Brasile',
        'spain':              'Spagna',
        'italy':              'Italia',
        'norway':             'Norvegia',
        'belgium':            'Belgio',
        'croatia':            'Croazia',
        'senegal':            'Senegal',
        'ecuador':            'Ecuador',
        'egypt':              'Egitto',
        'netherlands':        'Paesi Bassi',
        'poland':             'Polonia',
        'turkey':             'Turchia',
        'serbia':             'Serbia',
        'denmark':            'Danimarca',
        'uruguay':            'Uruguay',
        'colombia':           'Colombia',
        'south korea':        'Corea del Sud',
        'germany':            'Germania',
        'ghana':              'Ghana',
        'ukraine':            'Ucraina',
        'hungary':            'Ungheria',
        'scotland':           'Scozia',
        'wales':              'Galles',
        'austria':            'Austria',
        'armenia':            'Armenia',
        'switzerland':        'Svizzera',
        'algeria':            'Algeria',
        'nigeria':            'Nigeria',
        'cameroon':           'Camerun',
        'mali':               'Mali',
        'usa':                'USA',
      };
      return vocabolario[chiave] || parola;
    },
  },
};
</script>

<style scoped>
.contenitore-ricerca {
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

.controlli-ricerca {
  display: flex;
  gap: 14px;
  margin-bottom: 26px;
  flex-wrap: wrap;
}

select,
input[type='text'] {
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
select:focus,
input[type='text']:focus { border-color: #58a6ff; }
input[type='text'] { flex: 1; min-width: 180px; }
input[type='text']:disabled { background-color: #21262d; cursor: not-allowed; color: #555; }

.messaggio-stato { margin: 16px 0; font-size: 15px; color: #58a6ff; }
.messaggio-stato.errore {
  color: #f85149;
  background: rgba(248, 81, 73, .1);
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid rgba(248, 81, 73, .25);
}
.testo-attenuato { color: #8b949e; }

.griglia-giocatori {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 10px;
}

.scheda-giocatore {
  border: 1px solid #30363d;
  padding: 16px 18px;
  border-radius: 12px;
  background: #161b22;
  cursor: pointer;
  transition: transform .18s, border-color .18s;
}
.scheda-giocatore:hover { transform: translateY(-4px); border-color: #58a6ff; }
.scheda-giocatore h3 { margin: 0 0 8px; font-size: 15px; font-weight: 500; color: #58a6ff; }
.scheda-giocatore p  { font-size: 13px; color: #8b949e; margin: 3px 0; }
.scheda-giocatore p strong { color: #c9d1d9; }

.modale-dettaglio {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.contenuto-modale {
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

.pulsante-chiudi {
  position: absolute;
  top: 14px;
  right: 18px;
  font-size: 32px;
  background: none;
  border: none;
  color: #8b949e;
  cursor: pointer;
  line-height: 1;
}
.pulsante-chiudi:hover { color: #fff; }

.corpo-modale { display: flex; gap: 24px; }
@media (max-width: 540px) { .corpo-modale { flex-direction: column; } }

.contenitore-foto { flex: 0 0 auto; text-align: center; }
.foto-giocatore {
  width: 160px;
  height: 200px;
  border-radius: 12px;
  border: 2px solid #30363d;
  object-fit: cover;
  background: #1a2742;
  display: block;
}

.info-giocatore { flex: 1; }
.info-giocatore h2 { margin-top: 0; margin-bottom: 12px; color: #58a6ff; font-size: 18px; }
.info-giocatore p  { font-size: 14px; color: #c9d1d9; margin: 5px 0; }
.info-giocatore p strong { color: #fff; }

.contenitore-analisi-ai {
  margin-top: 20px;
  background: #0d1117;
  border: 1px solid #30363d;
  padding: 14px 16px;
  border-radius: 10px;
}

.intestazione-ai {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.intestazione-ai h3 { margin: 0; font-size: 14px; font-weight: 500; color: #58a6ff; }

.pulsante-ai {
  background: #238636;
  color: #fff;
  border: none;
  padding: 7px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  transition: background .2s;
}
.pulsante-ai:hover:not(:disabled) { background: #2ea043; }
.pulsante-ai:disabled { background: #21262d; color: #555; cursor: not-allowed; }

.testo-analisi   { font-size: 14px; line-height: 1.75; color: #c9d1d9; }
.segnaposto-ai   { font-size: 13px; color: #8b949e; font-style: italic; }
</style>