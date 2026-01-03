# Guida Deploy Lupus in Tabula su Cloudflare

## OPZIONE 1: Solo Modalità Locale (PIÙ SEMPLICE)

### Cosa serve:
- `index.html`
- `styles.css`
- `game.js`

### Come fare:
1. Vai su [Cloudflare Pages](https://dash.cloudflare.com/)
2. Clicca "Create a project" → "Direct Upload"
3. Trascina i 3 file sopra nella cartella
4. Clicca "Deploy"
5. Finito! Il tuo gioco è online

**IMPORTANTE**: In "Build settings", lascia vuoto "Build command" e "Build output directory"

---

## OPZIONE 2: Con Multiplayer (PIÙ COMPLESSA)

### Parte A - Frontend (Cloudflare Pages)

1. Vai su Cloudflare Pages → "Create a project" → "Direct Upload"
2. Carica i 3 file: `index.html`, `styles.css`, `game.js`
3. **Build Settings**: lascia tutto vuoto
4. Deploy
5. Copia l'URL del sito (es: `lupus-game.pages.dev`)

### Parte B - Backend (Cloudflare Workers)

Serve il CLI Wrangler. Nel terminale del tuo PC:

```bash
# Installa Wrangler
npm install -g wrangler

# Login a Cloudflare
wrangler login

# Nella cartella con worker.js e wrangler.toml
wrangler deploy
```

### Parte C - Collegare Frontend e Backend

Nel file `game.js`, trova questa riga (circa linea 26):
```javascript
const WORKER_URL = 'http://localhost:8787';
```

Cambiala con l'URL del tuo worker:
```javascript
const WORKER_URL = 'https://lupus-game-worker.TUO-ACCOUNT.workers.dev';
```

Poi ri-carica il `game.js` su Cloudflare Pages.

---

## RISOLUZIONE ERRORE ATTUALE

L'errore che vedi è perché hai collegato un repository GitHub che Cloudflare pensa sia Next.js.

**Soluzione rapida:**
1. Vai nelle impostazioni del progetto su Cloudflare Pages
2. Vai in "Build & deployment" → "Build configuration"
3. **Build command**: lascia VUOTO o metti `echo "No build needed"`
4. **Build output directory**: lascia VUOTO o metti `/`
5. Salva e rifai il deploy

Oppure usa "Direct Upload" invece di GitHub (più semplice per questo progetto).
