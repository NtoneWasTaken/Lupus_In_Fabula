# Lupus in Tabula - Gioco Online

Un gioco multiplayer online di Lupus in Tabula (Werewolf/Mafia) con supporto sia per modalità locale che multiplayer.

## Caratteristiche

- **Modalità Locale**: Gioca offline passando il dispositivo tra i giocatori
- **Modalità Multiplayer**: Gioca online con amici su dispositivi diversi
- **7 Ruoli**: Lupo Mannaro, Contadino, Veggente, Guardia del Corpo, Strega, Cupido, Cacciatore
- **Configurazione Personalizzata**: L'host decide quanti giocatori per ogni ruolo
- **8-15 Giocatori**: Supporto per partite da 8 a 15 giocatori
- **Preset Rapidi**: Configurazioni bilanciate preimpostate

## Deploy su Cloudflare

### Prerequisiti

1. Account Cloudflare (gratuito)
2. Node.js installato
3. Wrangler CLI installato: `npm install -g wrangler`

### Istruzioni per il Deploy

#### 1. Deploy del Backend (Cloudflare Workers)

```bash
# Login a Cloudflare
wrangler login

# Deploy del worker
wrangler deploy
```

Dopo il deploy, Wrangler ti fornirà l'URL del tuo worker, qualcosa tipo:
`https://lupus-in-tabula.YOUR_SUBDOMAIN.workers.dev`

#### 2. Configura il Frontend

Apri `game.js` e sostituisci `YOUR_WORKER_URL` con l'URL del tuo worker:

```javascript
// Cerca queste righe e sostituisci YOUR_WORKER_URL
fetch('https://YOUR_WORKER_URL.workers.dev/api/create-room', {
  // ...
})

const wsUrl = `wss://YOUR_WORKER_URL.workers.dev/api/room/${gameState.roomCode}`
```

#### 3. Deploy del Frontend (Cloudflare Pages)

```bash
# Dalla cartella del progetto
npx wrangler pages deploy . --project-name=lupus-in-tabula
```

Oppure tramite interfaccia web:
1. Vai su https://dash.cloudflare.com
2. Seleziona "Pages"
3. Clicca "Create a project"
4. Carica i file: `index.html`, `styles.css`, `game.js`
5. Deploy!

## Sviluppo Locale

Per testare in locale:

```bash
# Avvia il worker in locale
wrangler dev

# Apri index.html nel browser
# Modifica game.js per usare localhost:8787 invece dell'URL di produzione
```

## Struttura del Progetto

```
.
├── index.html          # Interfaccia principale
├── styles.css          # Stili e design
├── game.js            # Logica del gioco (frontend)
├── worker.js          # Backend API (Cloudflare Worker)
├── wrangler.toml      # Configurazione Cloudflare
└── README.md          # Questa guida
```

## Come Giocare

### Modalità Locale
1. Seleziona "Gioco Locale"
2. Aggiungi i nomi dei giocatori
3. Configura i ruoli
4. Inizia la partita
5. Passa il dispositivo per ogni fase

### Modalità Multiplayer
1. L'host seleziona "Gioco Multiplayer"
2. Clicca "Crea Stanza" e condividi il codice
3. Gli altri giocatori cliccano "Unisciti" e inseriscono il codice
4. L'host configura i ruoli e avvia la partita
5. Ogni giocatore riceve il proprio ruolo sul proprio dispositivo

## Supporto

Per problemi o domande, crea un issue su GitHub o contattami.

## Licenza

MIT License - Libero di usare e modificare!
