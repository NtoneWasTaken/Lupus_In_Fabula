# Struttura File del Progetto

```
lupus-game/
├── index.html           ← Pagina principale
├── styles.css           ← Tutti gli stili
├── game.js              ← Logica del gioco
├── worker.js            ← Backend per multiplayer (opzionale)
├── wrangler.toml        ← Config Cloudflare Worker (opzionale)
├── ISTRUZIONI-DEPLOY.md ← Questa guida
└── STRUTTURA-FILE.md    ← Questo file
```

## Per Modalità Locale (senza multiplayer)
Carica su Cloudflare Pages SOLO:
- index.html
- styles.css
- game.js

## Per Multiplayer
1. Carica su Cloudflare Pages:
   - index.html
   - styles.css
   - game.js (modificato con URL del worker)

2. Deploy separato su Cloudflare Workers:
   - worker.js
   - wrangler.toml
