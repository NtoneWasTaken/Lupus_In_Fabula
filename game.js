// Game State
const gameState = {
  players: [],
  roles: [],
  currentPhase: "night",
  turnNumber: 1,
  currentPlayerIndex: 0,
  selectedPlayer: null,
  deadPlayers: [],
  gameHistory: [],
  nightActions: {
    wolvesTarget: null,
    seerTarget: null,
    guardTarget: null,
    witchSave: false,
    witchKill: null,
    witchSaveUsed: false,
    witchKillUsed: false,
  },
  // Nuovo: stato multiplayer
  gameMode: null, // 'locale' o 'multiplayer'
  roomCode: null,
  isHost: false,
  isNarrator: false, // Nuovo campo per identificare il narratore
  connectedPlayers: [],
  rolesConfig: {}, // Salvare la configurazione localmente
  playerName: null, // Nome del giocatore nella partita multiplayer
  lastNightDeaths: [], // Per memorizzare le morti della notte precedente
}

// Role definitions
const ROLES = {
  lupo: {
    name: "Lupo Mannaro",
    icon: "🐺",
    description: "Ogni notte scegli una vittima da eliminare. Vinci quando tutti i contadini sono morti.",
    team: "lupi",
    nightAction: true,
  },
  contadino: {
    name: "Contadino",
    icon: "👨‍🌾",
    description: "Non hai poteri speciali. Aiuta il villaggio a scoprire i lupi durante il giorno.",
    team: "villaggio",
    nightAction: false,
  },
  veggente: {
    name: "Veggente",
    icon: "🔮",
    description: "Ogni notte puoi scoprire il vero ruolo di un giocatore.",
    team: "villaggio",
    nightAction: true,
  },
  guardia: {
    name: "Guardia del Corpo",
    icon: "🛡️",
    description: "Ogni notte proteggi un giocatore dagli attacchi dei lupi.",
    team: "villaggio",
    nightAction: true,
  },
  strega: {
    name: "Strega",
    icon: "🧙‍♀️",
    description:
      "Hai due pozioni: una per salvare la vittima dei lupi, una per uccidere qualcuno. Puoi usare ognuna una sola volta.",
    team: "villaggio",
    nightAction: true,
  },
  cupido: {
    name: "Cupido",
    icon: "💘",
    description: "All'inizio del gioco, crea una coppia di innamorati. Se uno muore, muore anche l'altro.",
    team: "villaggio",
    nightAction: true,
  },
  cacciatore: {
    name: "Cacciatore",
    icon: "🏹",
    description: "Quando muori, puoi portare con te un altro giocatore.",
    team: "villaggio",
    nightAction: false,
  },
}

// CONFIGURA QUI L'URL DEL TUO WORKER (dopo il deploy con wrangler)
const WORKER_URL = "https://lupus-in-tabula.antonioserratore004.workers.dev"

// Initialize roles configuration
function initializeRolesConfig() {
  const rolesConfig = document.getElementById("roles-config")
  rolesConfig.innerHTML = ""

  Object.keys(ROLES).forEach((roleKey) => {
    const role = ROLES[roleKey]
    const roleItem = document.createElement("div")
    roleItem.className = "role-config-item"
    roleItem.innerHTML = `
            <div class="role-info">
                <span class="role-emoji">${role.icon}</span>
                <div class="role-details">
                    <h4>${role.name}</h4>
                    <p>${role.description.substring(0, 50)}...</p>
                </div>
            </div>
            <div class="role-counter">
                <button class="counter-btn" onclick="changeRoleCount('${roleKey}', -1)">−</button>
                <span class="counter-value" id="count-${roleKey}">0</span>
                <button class="counter-btn" onclick="changeRoleCount('${roleKey}', 1)">+</button>
            </div>
        `
    rolesConfig.appendChild(roleItem)
  })
}

function initializeRolesConfigMultiplayer() {
  const rolesConfig = document.getElementById("roles-config-multiplayer")
  rolesConfig.innerHTML = ""

  Object.keys(ROLES).forEach((roleKey) => {
    const role = ROLES[roleKey]
    const roleItem = document.createElement("div")
    roleItem.className = "role-config-item"
    roleItem.innerHTML = `
            <div class="role-info">
                <span class="role-emoji">${role.icon}</span>
                <div class="role-details">
                    <h4>${role.name}</h4>
                    <p>${role.description.substring(0, 50)}...</p>
                </div>
            </div>
            <div class="role-counter">
                <button class="counter-btn" onclick="updateRoleCountMultiplayer('${roleKey}', -1)">−</button>
                <span class="counter-value" id="count-mp-${roleKey}">0</span>
                <button class="counter-btn" onclick="updateRoleCountMultiplayer('${roleKey}', 1)">+</button>
            </div>
        `
    rolesConfig.appendChild(roleItem)
  })
}

// Navigation functions
function showHomeScreen() {
  document.getElementById("home-screen").classList.add("active")
  document.getElementById("local-mode-screen").classList.remove("active")
  document.getElementById("multiplayer-screen").classList.remove("active")
  document.getElementById("setup-screen").classList.remove("active")
  document.getElementById("game-screen").classList.remove("active")
  document.getElementById("rules-screen").classList.remove("active")
  document.getElementById("multiplayer-lobby-screen").classList.remove("active")
  document.getElementById("multiplayer-host-screen").classList.remove("active")
  document.getElementById("multiplayer-player-screen").classList.remove("active")
  document.getElementById("role-assignment-screen").classList.remove("active")
  document.getElementById("role-reveal-screen").classList.remove("active")
}

function showLocalModeScreen() {
  gameState.gameMode = "locale"
  document.getElementById("home-screen").classList.remove("active")
  document.getElementById("local-mode-screen").classList.add("active")
  initializeRolesConfig()
}

function showMultiplayerScreen() {
  gameState.gameMode = "multiplayer"
  document.getElementById("home-screen").classList.remove("active")
  document.getElementById("multiplayer-screen").classList.add("active")
}

function showRulesScreen() {
  document.getElementById("home-screen").classList.remove("active")
  document.getElementById("rules-screen").classList.add("active")
}

function showSetupScreen() {
  hideAllScreens()
  document.getElementById("setup-screen").classList.add("active")
  initializeRolesConfig()
  updatePlayersList()
  updateTotals()
}

function showMultiplayerLobby() {
  hideAllScreens()
  document.getElementById("multiplayer-lobby-screen").classList.add("active")
}

function showMultiplayerHostScreen() {
  hideAllScreens()
  document.getElementById("multiplayer-host-screen").classList.add("active")
  document.getElementById("room-code-display").textContent = gameState.roomCode

  initializeRolesConfigMultiplayer()
  updateConnectedPlayersList()
  updateTotalsMultiplayer()
  updateRolesDisplayForPlayers() // Aggiunto per mostrare i ruoli nell'host screen
}

function showMultiplayerPlayerScreen() {
  hideAllScreens()
  document.getElementById("multiplayer-player-screen").classList.add("active")
  document.getElementById("player-room-code").textContent = gameState.roomCode
  updateLobbyPlayersList() // Aggiorna la lista giocatori nella schermata player
}

function backToHome() {
  showHomeScreen()
  resetGame()
}

function hideAllScreens() {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active")
  })
}

// Player management
function addPlayer() {
  const input = document.getElementById("player-name-input")
  const name = input.value.trim()

  if (name === "") {
    alert("Inserisci un nome valido!")
    return
  }

  if (gameState.players.some((p) => p.name === name)) {
    alert("Questo nome è già stato usato!")
    return
  }

  if (gameState.players.length >= 15) {
    alert("Numero massimo di giocatori raggiunto (15)!")
    return
  }

  gameState.players.push({
    name: name,
    role: null,
    alive: true,
    protected: false,
    lover: null,
  })

  input.value = ""
  updatePlayersList()
  updateTotals()
}

function removePlayer(index) {
  gameState.players.splice(index, 1)
  updatePlayersList()
  updateTotals()
}

function updatePlayersList(players = gameState.players) {
  const playersList = document.getElementById("players-list")
  playersList.innerHTML = ""

  if (players.length === 0) {
    playersList.innerHTML =
      '<p style="color: var(--color-text-muted); padding: 1rem; text-align: center;">Nessun giocatore aggiunto</p>'
    return
  }

  players.forEach((player, index) => {
    const playerItem = document.createElement("div")
    playerItem.className = `player-item ${player.alive ? "" : "dead"}`
    playerItem.innerHTML = `
            <span>${player.name}</span>
            ${player.alive ? "💚" : "💀"}
            <button class="btn-remove" onclick="removePlayer(${index})">Rimuovi</button>
        `
    playersList.appendChild(playerItem)
  })
}

function addConnectedPlayer() {
  const input = document.getElementById("player-name-lobby-input")
  const name = input.value.trim()

  if (name === "") {
    alert("Inserisci un nome valido!")
    return
  }

  if (gameState.connectedPlayers.some((p) => p.name === name)) {
    alert("Questo nome è già stato usato!")
    return
  }

  gameState.connectedPlayers.push({
    name: name,
    role: null,
    alive: true,
    protected: false,
    lover: null,
  })

  input.value = ""
  updateConnectedPlayersList()
  updateTotalsMultiplayer()
}

function removeConnectedPlayer(index) {
  gameState.connectedPlayers.splice(index, 1)
  updateConnectedPlayersList()
  updateTotalsMultiplayer()
}

function updateConnectedPlayersList() {
  const list = document.getElementById("connected-players-list")
  list.innerHTML = ""

  if (gameState.connectedPlayers.length === 0) {
    list.innerHTML =
      '<p style="color: var(--color-text-muted); text-align: center; padding: 2rem;">Nessun giocatore connesso. Condividi il codice stanza!</p>'
    return
  }

  gameState.connectedPlayers.forEach((player, index) => {
    const playerItem = document.createElement("div")
    playerItem.className = "player-item"
    playerItem.innerHTML = `
      <span>${player.name}</span>
      ${gameState.isHost ? `<button class="btn-remove" onclick="removeConnectedPlayer(${index})">Rimuovi</button>` : ""}
    `
    list.appendChild(playerItem)
  })

  const countElement = document.getElementById("connected-players-count")
  if (countElement) {
    countElement.textContent = gameState.connectedPlayers.length
  }

  updateLobbyPlayersList()
}

// Role count management
function changeRoleCount(roleKey, delta) {
  const countElement = document.getElementById(`count-${roleKey}`)
  let currentCount = Number.parseInt(countElement.textContent)
  currentCount = Math.max(0, currentCount + delta)
  countElement.textContent = currentCount
  updateTotals()
}

function updateRoleCountMultiplayer(role, change) {
  if (!gameState.isHost) {
    alert("Solo l'host può modificare i ruoli!")
    return
  }

  const currentCount = gameState.rolesConfig[role] || 0
  const newCount = Math.max(0, currentCount + change)

  gameState.rolesConfig[role] = newCount
  document.getElementById(`count-mp-${role}`).textContent = newCount
  updateTotalsMultiplayer()

  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log("[v0] Invio update-roles:", gameState.rolesConfig)
    ws.send(
      JSON.stringify({
        type: "update-roles",
        rolesConfig: gameState.rolesConfig,
      }),
    )
  }
}

function getRoleCount(roleKey) {
  const countElement = document.getElementById(`count-${roleKey}`)
  return Number.parseInt(countElement.textContent)
}

function getTotalRolesCountMultiplayer() {
  let total = 0
  Object.keys(ROLES).forEach((roleKey) => {
    const countElement = document.getElementById(`count-mp-${roleKey}`)
    if (countElement) {
      total += Number.parseInt(countElement.textContent)
    }
  })
  return total
}

function updateTotals() {
  const totalPlayers = gameState.players.length
  let totalRoles = 0

  Object.keys(ROLES).forEach((roleKey) => {
    totalRoles += getRoleCount(roleKey)
  })

  document.getElementById("total-players").textContent = totalPlayers
  document.getElementById("total-roles").textContent = totalRoles

  const startBtn = document.getElementById("start-game-btn")
  const canStart = totalPlayers > 0 && totalPlayers === totalRoles && totalPlayers >= 4

  startBtn.disabled = !canStart

  if (totalPlayers > 0 && totalPlayers !== totalRoles) {
    const diff = totalPlayers - totalRoles
    if (diff > 0) {
      startBtn.textContent = `Aggiungi ${diff} ruolo${diff > 1 ? "i" : ""}`
    } else {
      startBtn.textContent = `Rimuovi ${Math.abs(diff)} ruolo${Math.abs(diff) > 1 ? "i" : ""}`
    }
  } else if (totalPlayers < 4 && totalPlayers > 0) {
    startBtn.textContent = `Servono almeno 4 giocatori`
  } else {
    startBtn.textContent = "Inizia Partita"
  }
}

function updateTotalsMultiplayer() {
  const totalRoles = getTotalRolesCountMultiplayer()
  const connectedCount = gameState.connectedPlayers.length

  document.getElementById("total-players-multiplayer").textContent = connectedCount
  document.getElementById("total-roles-multiplayer").textContent = totalRoles

  const startBtn = document.getElementById("start-multiplayer-btn")
  const diff = connectedCount - totalRoles

  if (connectedCount === 0) {
    startBtn.disabled = true
    startBtn.textContent = "In attesa di giocatori..."
  } else if (diff === 0 && connectedCount >= 4) {
    startBtn.disabled = false
    startBtn.textContent = "Inizia Partita"
  } else if (diff !== 0) {
    startBtn.disabled = true
    if (diff > 0) {
      startBtn.textContent = `Aggiungi ${diff} ruolo${diff > 1 ? "i" : ""}`
    } else {
      startBtn.textContent = `Rimuovi ${Math.abs(diff)} ruolo${Math.abs(diff) > 1 ? "i" : ""}`
    }
  } else if (connectedCount < 4) {
    startBtn.disabled = true
    startBtn.textContent = "Servono almeno 4 giocatori"
  }
}

// Start game and assign roles
function startGame() {
  if (gameState.players.length !== getTotalRolesCount()) {
    alert("Il numero di ruoli deve essere uguale al numero di giocatori!")
    return
  }

  if (gameState.players.length < 4) {
    alert("Servono almeno 4 giocatori per iniziare!")
    return
  }

  // Create roles array
  gameState.roles = []
  Object.keys(ROLES).forEach((roleKey) => {
    const count = getRoleCount(roleKey)
    for (let i = 0; i < count; i++) {
      gameState.roles.push(roleKey)
    }
  })

  // Shuffle roles
  gameState.roles = shuffleArray(gameState.roles)

  // Start role assignment
  gameState.currentPlayerIndex = 0
  showRoleAssignmentScreen()
}

function startLocalGame() {
  if (gameState.players.length !== getTotalRolesCount()) {
    alert("Il numero di ruoli deve essere uguale al numero di giocatori!")
    return
  }

  if (gameState.players.length < 4) {
    alert("Servono almeno 4 giocatori per iniziare!")
    return
  }

  // Create roles array
  gameState.roles = []
  Object.keys(ROLES).forEach((roleKey) => {
    const count = getRoleCount(roleKey)
    for (let i = 0; i < count; i++) {
      gameState.roles.push(roleKey)
    }
  })

  // Shuffle roles
  gameState.roles = shuffleArray(gameState.roles)

  // Assign roles to players
  gameState.players.forEach((player, index) => {
    player.role = gameState.roles[index]
  })

  // Start role assignment screen
  gameState.currentPlayerIndex = 0
  showRoleAssignmentScreen()
}

function startMultiplayerGame() {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    alert("Connessione non attiva. Riprova.")
    return
  }

  // Raccogli configurazione ruoli
  const rolesConfig = {}
  Object.keys(ROLES).forEach((roleKey) => {
    const count = Number.parseInt(document.getElementById(`count-mp-${roleKey}`).textContent)
    if (count > 0) {
      rolesConfig[roleKey] = count
    }
  })

  // Controlla che il numero di ruoli corrisponda al numero di giocatori
  const totalRoles = Object.values(rolesConfig).reduce((sum, count) => sum + count, 0)
  if (totalRoles !== gameState.connectedPlayers.length) {
    alert(
      `Il numero di ruoli (${totalRoles}) deve essere uguale al numero di giocatori (${gameState.connectedPlayers.length})!`,
    )
    return
  }

  if (gameState.connectedPlayers.length < 4) {
    alert("Servono almeno 4 giocatori per iniziare!")
    return
  }

  // Invia prima l'aggiornamento dei ruoli, poi il comando di avvio
  ws.send(
    JSON.stringify({
      type: "update-roles",
      rolesConfig: rolesConfig,
    }),
  )

  // Piccolo delay per assicurare che l'aggiornamento ruoli arrivi prima
  setTimeout(() => {
    ws.send(
      JSON.stringify({
        type: "start-game",
      }),
    )
  }, 100)
}

function getTotalRolesCount() {
  let total = 0
  Object.keys(ROLES).forEach((roleKey) => {
    total += getRoleCount(roleKey)
  })
  return total
}

function shuffleArray(array) {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

function showRoleAssignmentScreen() {
  hideAllScreens()
  document.getElementById("role-assignment-screen").classList.add("active")

  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  document.getElementById("current-player-name").textContent = currentPlayer.name
}

function revealRole() {
  hideAllScreens()
  document.getElementById("role-reveal-screen").classList.add("active")

  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  const roleKey = gameState.roles[gameState.currentPlayerIndex]
  const role = ROLES[roleKey]

  currentPlayer.role = roleKey

  document.getElementById("role-icon").textContent = role.icon
  document.getElementById("revealed-role-name").textContent = role.name
  document.getElementById("revealed-role-description").textContent = role.description
}

function nextPlayerAssignment() {
  gameState.currentPlayerIndex++

  if (gameState.currentPlayerIndex < gameState.players.length) {
    showRoleAssignmentScreen()
  } else {
    // All roles assigned, start game
    startGamePhases()
  }
}

// Game phases
function startGamePhases() {
  hideAllScreens()
  document.getElementById("game-screen").classList.add("active")
  gameState.currentPhase = "night"
  gameState.turnNumber = 1
  updateGameScreen()
}

// Update the game screen based on the current phase and turn
function updateGameScreen() {
  const phaseIndicator = document.getElementById("phase-indicator")
  const phaseIcon = phaseIndicator.querySelector(".phase-icon")
  const phaseText = phaseIndicator.querySelector(".phase-text")
  const nextPhaseBtn = document.getElementById("next-phase-btn") // Bottone per avanzare fase (solo host)

  // Aggiorna l'indicatore di fase
  if (gameState.currentPhase === "night") {
    phaseIcon.textContent = "🌙"
    phaseText.textContent = `Notte - Turno ${gameState.turnNumber}`
    if (nextPhaseBtn) nextPhaseBtn.textContent = "Concludi Notte"
  } else {
    // Giorno
    phaseIcon.textContent = "☀️"
    phaseText.textContent = `Giorno - Turno ${gameState.turnNumber}`
    if (nextPhaseBtn) nextPhaseBtn.textContent = "Passa alla Notte"
  }

  if (nextPhaseBtn) {
    if (gameState.gameMode === "multiplayer" && !gameState.isNarrator) {
      nextPhaseBtn.style.display = "none"
    } else {
      nextPhaseBtn.style.display = "block"
    }
  }

  // Aggiorna il conteggio dei giocatori vivi
  const aliveCount = gameState.players.filter((p) => p.alive).length
  document.getElementById("alive-count").textContent = aliveCount

  // Aggiorna il contenuto specifico della fase
  updateGameContent()
}

// Aggiorna il contenuto principale della schermata di gioco in base alla fase
function updateGameContent() {
  const gameContent = document.getElementById("game-content")

  if (gameState.currentPhase === "night") {
    // Genera il contenuto per la fase notturna
    gameContent.innerHTML = `
      <div class="phase-content">
        <h3>🌙 Fase Notturna - Turno ${gameState.turnNumber}</h3>
        <p>Il villaggio dorme. È tempo delle azioni notturne...</p>
        
        <div class="night-actions-container">
          ${generateNightActionsHTML()} <!-- Genera le azioni disponibili per l'host -->
        </div>
        
        <div class="night-instructions">
          <p style="font-style: italic; color: var(--color-text-muted); margin-top: 1.5rem;">
            Gestisci le azioni notturne di ciascun ruolo nell'ordine mostrato. 
            Clicca "Concludi Notte" quando tutte le azioni sono state completate.
          </p>
        </div>
      </div>
    `
  } else {
    // Fase diurna
    // Genera il contenuto per la fase diurna
    gameContent.innerHTML = `
      <div class="phase-content">
        <h3>☀️ Fase Diurna - Turno ${gameState.turnNumber}</h3>
        ${generateDayPhaseHTML()} <!-- Genera l'annuncio delle morti e il pulsante di votazione -->
      </div>
    `
  }
}

// Genera l'HTML per le azioni notturne (mostrato all'host)
function generateNightActionsHTML() {
  let html = ""

  // Identifica i ruoli presenti e vivi nel gioco
  const wolves = gameState.players.filter((p) => p.alive && p.role === "lupo")
  const seer = gameState.players.find((p) => p.alive && p.role === "veggente")
  const guard = gameState.players.find((p) => p.alive && p.role === "guardia")
  const witch = gameState.players.find((p) => p.alive && p.role === "strega")
  // Cupido agisce solo la prima notte
  const cupid = gameState.players.find((p) => p.role === "cupido" && gameState.turnNumber === 1)

  // Aggiunge le azioni disponibili se i ruoli corrispondenti sono presenti e vivi
  if (cupid && gameState.turnNumber === 1) {
    html += `
      <div class="night-action-card">
        <div class="action-header">
          <span class="action-icon">💘</span>
          <h4>Cupido</h4>
        </div>
        <p>Cupido, svegliati e scegli due giocatori che diventeranno innamorati.</p>
        <button class="btn btn-secondary btn-small" onclick="performCupidAction()">Scegli Innamorati</button>
      </div>
    `
  }

  if (wolves.length > 0) {
    html += `
      <div class="night-action-card">
        <div class="action-header">
          <span class="action-icon">🐺</span>
          <h4>Lupi Mannari</h4>
        </div>
        <p>Lupi, svegliatevi e scegliete la vostra vittima.</p>
        <button class="btn btn-secondary btn-small" onclick="performWolvesAction()">Scegli Vittima</button>
      </div>
    `
  }

  if (seer) {
    html += `
      <div class="night-action-card">
        <div class="action-header">
          <span class="action-icon">🔮</span>
          <h4>Veggente</h4>
        </div>
        <p>Veggente, svegliati e scegli un giocatore di cui scoprire il ruolo.</p>
        <button class="btn btn-secondary btn-small" onclick="performSeerAction()">Scopri Ruolo</button>
      </div>
    `
  }

  if (guard) {
    html += `
      <div class="night-action-card">
        <div class="action-header">
          <span class="action-icon">🛡️</span>
          <h4>Guardia del Corpo</h4>
        </div>
        <p>Guardia, svegliati e scegli chi proteggere stanotte.</p>
        <button class="btn btn-secondary btn-small" onclick="performGuardAction()">Proteggi Giocatore</button>
      </div>
    `
  }

  if (witch) {
    html += `
      <div class="night-action-card">
        <div class="action-header">
          <span class="action-icon">🧙‍♀️</span>
          <h4>Strega</h4>
        </div>
        <p>Strega, svegliati. Vuoi usare le tue pozioni?</p>
        <button class="btn btn-secondary btn-small" onclick="performWitchAction()">Usa Pozioni</button>
      </div>
    `
  }

  // Messaggio se non ci sono azioni disponibili
  if (html === "") {
    html = '<p style="text-align: center; color: var(--color-text-muted);">Nessuna azione notturna disponibile.</p>'
  }

  return html
}

// Genera l'HTML per la fase diurna, inclusi i risultati della notte
function generateDayPhaseHTML() {
  // Risolve le azioni notturne per determinare le morti
  const nightResult = resolveNightActions()

  let html = ""

  // Annuncia i giocatori morti stanotte
  if (nightResult.deaths.length > 0) {
    html += '<div class="death-announcement">'
    html += '<h4 style="color: var(--color-danger); margin-bottom: 1rem;">💀 Questa notte...</h4>'
    nightResult.deaths.forEach((playerName) => {
      html += `<p style="font-size: 1.1rem; margin-bottom: 0.5rem;"><strong>${playerName}</strong> è stato trovato morto!</p>`
    })
    html += "</div>"
  } else {
    // Annuncia che nessuno è morto
    html += '<div class="death-announcement">'
    html += '<p style="color: var(--color-success); font-size: 1.1rem;">Nessuno è morto stanotte! 🎉</p>'
    html += "</div>"
  }

  // Pulsante per iniziare la votazione diurna
  html += `
    <div style="margin-top: 2rem;">
      <p style="font-size: 1.1rem; line-height: 1.8; margin-bottom: 1.5rem;">
        È tempo di discutere e votare. Chi sembra sospetto? Decidete insieme chi eliminare.
      </p>
      <button class="btn btn-secondary" onclick="startDayVoting()">Inizia Votazione</button>
    </div>
  `

  return html
}

// Funzione per risolvere le azioni notturne e determinare le morti
function resolveNightActions() {
  const deaths = []
  const actions = gameState.nightActions

  // Verifica se il bersaglio dei lupi muore
  if (actions.wolvesTarget) {
    const target = gameState.players.find((p) => p.name === actions.wolvesTarget)

    if (target) {
      let dies = true

      // Controlla se il bersaglio è stato protetto dalla guardia
      if (actions.guardTarget === target.name) {
        dies = false
      }

      // Controlla se il bersaglio è stato salvato dalla strega
      if (actions.witchSave) {
        dies = false
      }

      // Se il giocatore deve morire
      if (dies) {
        target.alive = false
        deaths.push(target.name)

        // Controlla se la vittima ha un innamorato vivo
        if (target.lover) {
          const lover = gameState.players.find((p) => p.name === target.lover)
          if (lover && lover.alive) {
            lover.alive = false
            deaths.push(lover.name) // Anche l'innamorato muore
          }
        }
      }
    }
  }

  // Gestisce la pozione veleno della strega
  if (actions.witchKill) {
    const target = gameState.players.find((p) => p.name === actions.witchKill)
    if (target && target.alive) {
      // Assicurati che il bersaglio sia vivo
      target.alive = false
      deaths.push(target.name)

      // Controlla se anche l'innamorato muore
      if (target.lover) {
        const lover = gameState.players.find((p) => p.name === target.lover)
        if (lover && lover.alive) {
          lover.alive = false
          deaths.push(lover.name)
        }
      }
    }
  }

  // Resetta le azioni notturne per la notte successiva
  gameState.nightActions = {
    wolvesTarget: null,
    seerTarget: null,
    guardTarget: null,
    witchSave: false,
    witchKill: null,
    witchSaveUsed: actions.witchSaveUsed, // Mantiene lo stato di uso delle pozioni
    witchKillUsed: actions.witchKillUsed,
  }

  return { deaths }
}

// Esegue l'azione dei lupi (host)
function performWolvesAction() {
  showPlayerSelectionModal("Scegli la vittima dei lupi", (selectedPlayer) => {
    gameState.nightActions.wolvesTarget = selectedPlayer.name // Aggiorna lo stato locale
    alert(`I lupi hanno scelto ${selectedPlayer.name}`)
    // Invia l'azione al server
    sendNightAction({ type: "wolves-target", target: selectedPlayer.name })
  })
}

// Esegue l'azione della veggente (host)
function performSeerAction() {
  showPlayerSelectionModal("Scegli un giocatore di cui scoprire il ruolo", (selectedPlayer) => {
    const role = ROLES[selectedPlayer.role]
    alert(`${selectedPlayer.name} è: ${role.name} ${role.icon}`)
    // Invia l'azione al server (anche se il risultato viene mostrato qui, è buona pratica inviarla)
    sendNightAction({ type: "seer-target", target: selectedPlayer.name })
  })
}

// Esegue l'azione della guardia (host)
function performGuardAction() {
  showPlayerSelectionModal("Scegli chi proteggere stanotte", (selectedPlayer) => {
    gameState.nightActions.guardTarget = selectedPlayer.name // Aggiorna lo stato locale
    alert(`La guardia protegge ${selectedPlayer.name}`)
    // Invia l'azione al server
    sendNightAction({ type: "guard-target", target: selectedPlayer.name })
  })
}

// Esegue l'azione della strega (host)
function performWitchAction() {
  const target = gameState.nightActions.wolvesTarget // Vittima dei lupi
  let message = "Strega, ecco le tue opzioni:\n\n"

  // Opzione di salvataggio
  if (!gameState.nightActions.witchSaveUsed && target) {
    message += `💚 Pozione di Salvataggio: La vittima dei lupi è ${target}. Vuoi salvarla?\n\n`
  }

  // Opzione di veleno
  if (!gameState.nightActions.witchKillUsed) {
    message += "💀 Pozione Veleno: Vuoi uccidere qualcuno?\n\n"
  }

  // Se entrambe le pozioni sono state usate
  if (gameState.nightActions.witchSaveUsed && gameState.nightActions.witchKillUsed) {
    alert("Hai già usato entrambe le pozioni!")
    return
  }

  const choice = prompt(message + 'Scrivi "salva" per salvare, "uccidi" per uccidere, o "niente" per non fare nulla:')

  if (choice === "salva" && !gameState.nightActions.witchSaveUsed && target) {
    gameState.nightActions.witchSave = true // Aggiorna stato locale
    gameState.nightActions.witchSaveUsed = true
    alert(`Hai salvato ${target}!`)
    // Invia l'azione al server
    sendNightAction({ type: "witch-save", target: target })
  } else if (choice === "uccidi" && !gameState.nightActions.witchKillUsed) {
    // Se sceglie di uccidere, apre la modale per selezionare il bersaglio
    showPlayerSelectionModal("Scegli chi uccidere con la pozione veleno", (selectedPlayer) => {
      gameState.nightActions.witchKill = selectedPlayer.name // Aggiorna stato locale
      gameState.nightActions.witchKillUsed = true
      alert(`Hai avvelenato ${selectedPlayer.name}!`)
      // Invia l'azione al server
      sendNightAction({ type: "witch-kill", target: selectedPlayer.name })
    })
  } else if (choice !== "niente") {
    alert("Azione non valida.")
  }
}

// Esegue l'azione di Cupido (host)
function performCupidAction() {
  let firstLover = null

  // Seleziona il primo innamorato
  showPlayerSelectionModal("Scegli il primo innamorato", (player1) => {
    firstLover = player1
    // Seleziona il secondo innamorato, escludendo il primo
    showPlayerSelectionModal(
      "Scegli il secondo innamorato",
      (player2) => {
        // Verifica che i giocatori siano diversi
        if (player1.name === player2.name) {
          alert("Devi scegliere due giocatori diversi!")
          return
        }

        // Aggiorna lo stato locale degli innamorati
        player1.lover = player2.name
        player2.lover = player1.name
        alert(`${player1.name} e ${player2.name} sono ora innamorati! 💘`)
        // Invia l'azione al server
        sendNightAction({ type: "cupid-action", lovers: [player1.name, player2.name] })
      },
      [firstLover.name], // Esclude il primo giocatore dalla selezione del secondo
    )
  })
}

// Mostra la modale per la selezione dei giocatori
function showPlayerSelectionModal(title, callback, excludeNames = []) {
  const modal = document.getElementById("players-modal")
  const modalContent = modal.querySelector(".modal-content")

  // Filtra i giocatori vivi e non esclusi
  const alivePlayers = gameState.players.filter((p) => p.alive && !excludeNames.includes(p.name))

  let html = `
    <div class="modal-header">
      <h3>${title}</h3>
      <button class="modal-close" onclick="closePlayersModal()">×</button>
    </div>
    <div class="players-selection" style="padding: 1.5rem;">
  `

  // Genera l'HTML per ogni giocatore selezionabile
  alivePlayers.forEach((player) => {
    html += `
      <div class="player-select-item" onclick="selectPlayerFromModal('${player.name}')">
        <span>${player.name}</span>
        <span>→</span>
      </div>
    `
  })

  html += "</div>" // Chiude players-selection

  modalContent.innerHTML = html
  modal.classList.add("active") // Mostra la modale

  // Salva la callback per essere eseguita quando un giocatore viene selezionato
  window.currentPlayerSelectionCallback = callback
}

// Gestisce la selezione di un giocatore dalla modale
function selectPlayerFromModal(playerName) {
  const player = gameState.players.find((p) => p.name === playerName)
  closePlayersModal() // Chiude la modale

  // Esegue la callback salvata con il giocatore selezionato
  if (window.currentPlayerSelectionCallback) {
    window.currentPlayerSelectionCallback(player)
    window.currentPlayerSelectionCallback = null // Resetta la callback
  }
}

// Avvia la fase di votazione diurna
function startDayVoting() {
  const gameContent = document.getElementById("game-content")

  let html = `
    <div class="phase-content">
      <h3>🗳️ Votazione</h3>
      <p style="margin-bottom: 1.5rem;">Seleziona il giocatore che vuoi eliminare. Puoi anche scegliere di non eliminare nessuno.</p>
      
      <div class="players-selection">
  `

  // Mostra tutti i giocatori vivi per la votazione
  const alivePlayers = gameState.players.filter((p) => p.alive)

  alivePlayers.forEach((player) => {
    html += `
      <div class="player-select-item" onclick="voteToEliminate('${player.name}')">
        <span>${player.name}</span>
        <span style="color: var(--color-accent);">Vota →</span>
      </div>
    `
  })

  html += `
      </div>
      
      <!-- Opzioni per annullare o saltare la votazione -->
      <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
        <button class="btn btn-secondary" style="flex: 1;" onclick="skipDayVoting()">Nessuno</button>
        <button class="btn btn-secondary" style="flex: 1;" onclick="updateGameContent()">Annulla</button>
      </div>
    </div>
  `

  gameContent.innerHTML = html // Aggiorna il contenuto della fase diurna
}

// Gestisce il caso in cui il villaggio decide di non votare
function skipDayVoting() {
  const confirm = window.confirm("Il villaggio ha deciso di non eliminare nessuno oggi. Passare alla fase notturna?")

  if (confirm) {
    proceedToNextPhase() // Avanza alla fase successiva
  }
}

// Gestisce il voto per eliminare un giocatore
function voteToEliminate(playerName) {
  const player = gameState.players.find((p) => p.name === playerName)

  if (!player && playerName !== null) return // Sicurezza

  const confirm = window.confirm(`Confermi di voler eliminare ${playerName}? Questa azione non può essere annullata.`)

  if (!confirm && playerName !== null) return // Se l'utente annulla

  if (playerName) {
    player.alive = false // Il giocatore viene segnato come morto
  }

  // Gestione del Cacciatore: se il giocatore eliminato è un cacciatore, può portare qualcuno con sé
  if (playerName && player.role === "cacciatore") {
    const takeDown = window.confirm(`${playerName} era il Cacciatore! Vuole portare qualcuno con sé?`)

    if (takeDown) {
      // Mostra la modale per selezionare chi il cacciatore vuole portare con sé
      showPlayerSelectionModal(
        "Il cacciatore sceglie chi portare con sé",
        (targetPlayer) => {
          targetPlayer.alive = false // Il bersaglio del cacciatore muore
          alert(`${playerName} porta con sé ${targetPlayer.name}!`)

          // Controlla se anche l'innamorato del bersaglio muore
          if (targetPlayer.lover) {
            const lover = gameState.players.find((p) => p.name === targetPlayer.lover)
            if (lover && lover.alive) {
              lover.alive = false
              alert(`${lover.name} muore insieme a ${targetPlayer.name} per amore! 💔`)
            }
          }

          proceedToNextPhase() // Avanza alla fase successiva
        },
        [playerName], // Esclude il cacciatore stesso dalla selezione
      )
      return // Esci dalla funzione per evitare di eseguire il resto del codice
    }
  }

  // Gestione degli innamorati: se il giocatore eliminato ha un innamorato vivo, anche lui muore
  if (playerName && player.lover) {
    const lover = gameState.players.find((p) => p.name === player.lover)
    if (lover && lover.alive) {
      lover.alive = false
      alert(`${lover.name} muore insieme a ${playerName} per amore! 💔`)
    }
  }

  proceedToNextPhase() // Avanza alla fase successiva
}

// Controlla le condizioni di vittoria e avanza alla fase successiva
function proceedToNextPhase() {
  // Controlla le condizioni di vittoria per lupi e villaggio
  const alivePlayers = gameState.players.filter((p) => p.alive).length
  const aliveWolves = gameState.players.filter((p) => p.alive && ROLES[p.role].team === "lupi").length
  const aliveVillagers = gameState.players.filter((p) => p.alive && ROLES[p.role].team === "villaggio").length

  // Vittoria del Villaggio: nessun lupo rimasto
  if (aliveWolves === 0) {
    setTimeout(() => {
      alert("🎉 Il Villaggio ha vinto! Tutti i lupi sono stati eliminati!")
      showHomeScreen() // Ritorna alla schermata principale
      resetGame() // Resetta lo stato del gioco
    }, 500) // Piccolo ritardo per permettere la visualizzazione dei messaggi
    return
  }

  // Vittoria dei Lupi: i lupi sono tanti quanti o più dei villici
  if (aliveWolves >= aliveVillagers) {
    setTimeout(() => {
      alert("🐺 I Lupi hanno vinto! Il villaggio è caduto!")
      showHomeScreen() // Ritorna alla schermata principale
      resetGame() // Resetta lo stato del gioco
    }, 500) // Piccolo ritardo
    return
  }

  // Se nessuna condizione di vittoria è soddisfatta, avanza alla fase successiva
  nextPhase()
}

// Passa alla fase successiva del gioco (Notte -> Giorno, Giorno -> Notte)
function nextPhase() {
  if (gameState.gameMode === "multiplayer") {
    if (!gameState.isNarrator) {
      // Solo il narratore può avanzare le fasi in multiplayer
      alert("Solo il narratore può avanzare le fasi!")
      return
    }

    // Invia il comando al server
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "next-phase",
        }),
      )
    }
    return
  }

  // Modalità locale: gestisce le fasi localmente
  if (gameState.currentPhase === "night") {
    gameState.currentPhase = "day" // Passa al giorno
  } else {
    gameState.currentPhase = "night" // Passa alla notte
    gameState.turnNumber++ // Incrementa il numero del turno
  }

  updateGameScreen() // Aggiorna la schermata di gioco
}

// Mostra la modale con la lista completa dei giocatori e il loro stato
function showPlayersList() {
  const modal = document.getElementById("players-modal")
  const modalContent = modal.querySelector(".modal-content")

  let html = `
    <div class="modal-header">
      <h3>Lista Giocatori</h3>
      <button class="modal-close" onclick="closePlayersModal()">×</button>
    </div>
    <div class="players-status-list">
  `

  // Genera l'HTML per ogni giocatore
  gameState.players.forEach((player) => {
    const status = player.alive ? "Vivo" : "Morto"
    const statusClass = player.alive ? "alive" : "dead"

    html += `
      <div class="player-status-item ${player.alive ? "" : "dead"}">
        <div>
          <div style="font-size: 1.1rem; margin-bottom: 0.25rem;">${player.name}</div>
          <!-- Mostra l'innamorato se presente e vivo -->
          ${player.lover && player.alive ? `<div style="font-size: 0.85rem; color: var(--color-text-muted);">💘 Innamorato di ${player.lover}</div>` : ""}
        </div>
        <span class="status-badge ${statusClass}">
          ${status}
        </span>
      </div>
    `
  })

  html += "</div>" // Chiude players-status-list

  modalContent.innerHTML = html
  modal.classList.add("active") // Mostra la modale

  updatePlayersStatusList() // Assicura che la lista sia aggiornata
}

// Chiude la modale dei giocatori
function closePlayersModal() {
  const modal = document.getElementById("players-modal")
  modal.classList.remove("active")
}

// Aggiorna dinamicamente la lista dei giocatori nella modale
function updatePlayersStatusList() {
  const list = document.getElementById("players-status-list")
  if (!list) return // Se l'elemento non esiste, esci

  list.innerHTML = "" // Pulisce la lista esistente

  // Ricrea la lista dei giocatori
  gameState.players.forEach((player) => {
    const item = document.createElement("div")
    item.className = `player-status-item ${player.alive ? "" : "dead"}`
    item.innerHTML = `
      <div>
        <div style="font-size: 1.1rem; margin-bottom: 0.25rem;">${player.name}</div>
        ${player.lover && player.alive ? `<div style="font-size: 0.85rem; color: var(--color-text-muted);">💘 Innamorato di ${player.lover}</div>` : ""}
      </div>
      <span class="status-badge ${player.alive ? "alive" : "dead"}">
        ${player.alive ? "Vivo" : "Morto"}
      </span>
    `
    list.appendChild(item)
  })
}

// Resetta lo stato del gioco ai valori iniziali
function resetGame() {
  gameState.players = []
  gameState.roles = []
  gameState.currentPhase = "night"
  gameState.turnNumber = 1
  gameState.currentPlayerIndex = 0
  gameState.selectedPlayer = null
  gameState.deadPlayers = []
  gameState.gameHistory = []
  // Resetta le azioni notturne
  gameState.nightActions = {
    wolvesTarget: null,
    seerTarget: null,
    guardTarget: null,
    witchSave: false,
    witchKill: null,
    witchSaveUsed: false,
    witchKillUsed: false,
  }
  gameState.rolesConfig = {} // Resetta la configurazione dei ruoli
  gameState.gameMode = null
  gameState.roomCode = null
  gameState.isHost = false
  gameState.isNarrator = false // Resetta il narratore
  gameState.connectedPlayers = []
  gameState.playerName = null // Resetta il nome del giocatore
  gameState.lastNightDeaths = [] // Resetta le morti della notte precedente
}

// Chiude la modale se si clicca al di fuori di essa
document.getElementById("players-modal").addEventListener("click", function (e) {
  if (e.target === this) {
    // Se il target del click è la modale stessa
    closePlayersModal()
  }
})

// Permette di aggiungere un giocatore premendo Invio nel campo nome
document.getElementById("player-name-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addPlayer()
  }
})

// Funzioni per la gestione delle stanze multiplayer
async function createRoom() {
  try {
    // Richiesta POST per creare una nuova stanza sul server
    const response = await fetch(`${WORKER_URL}/api/create-room`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })

    const data = await response.json()
    gameState.roomCode = data.roomCode // Salva il codice della stanza
    gameState.isHost = true // Imposta il flag dell'host
    // Imposta anche il flag isNarrator per l'host
    gameState.isNarrator = true
    showMultiplayerHostScreen() // Mostra la schermata dell'host
    connectWebSocket() // Stabilisce la connessione WebSocket
  } catch (error) {
    console.error("[v0] Errore creazione stanza:", error)
    alert("Errore nella creazione della stanza. Verifica che il backend sia configurato.")
  }
}

function joinRoom() {
  const roomCodeInput = document.getElementById("room-code-input")
  const playerNameInput = document.getElementById("player-name-lobby-input")

  const roomCode = roomCodeInput.value.trim().toUpperCase()
  const playerName = playerNameInput.value.trim()

  // Validazione input
  if (!roomCode) {
    alert("Inserisci il codice della stanza!")
    return
  }
  if (!playerName) {
    alert("Inserisci il tuo nome!")
    return
  }

  gameState.roomCode = roomCode
  gameState.isHost = false // Non è l'host
  gameState.playerName = playerName // Salva il nome del giocatore

  showMultiplayerPlayerScreen() // Mostra la schermata del giocatore nella lobby
  connectWebSocket(playerName) // Stabilisce la connessione WebSocket
}

let ws = null // Variabile per l'istanza WebSocket
let reconnectAttempts = 0 // Conteggio tentativi di riconnessione
const MAX_RECONNECT_ATTEMPTS = 5 // Massimo numero di tentativi di riconnessione

// Funzione per connettersi al server WebSocket
function connectWebSocket(playerName = null) {
  // Costruisce l'URL WebSocket basato sull'URL del worker
  const wsUrl = `${WORKER_URL.replace("https://", "wss://")}/api/room/${gameState.roomCode}`

  console.log("[v0] Connessione a:", wsUrl)
  console.log("[v0] Nome giocatore:", playerName)
  console.log("[v0] È host:", gameState.isHost)

  ws = new WebSocket(wsUrl) // Crea una nuova istanza WebSocket

  // Evento onopen: quando la connessione è stabilita
  ws.onopen = () => {
    console.log("[v0] WebSocket connesso")
    reconnectAttempts = 0 // Resetta i tentativi di riconnessione

    // Se è l'host, invia un messaggio per stabilire il ruolo di host
    if (gameState.isHost) {
      console.log("[v0] Invio create-host")
      ws.send(
        JSON.stringify({
          type: "create-host",
          playerName: "Host", // Il nome dell'host può essere generico o configurabile
        }),
      )
    } else if (playerName) {
      // Se è un giocatore, invia il messaggio di join con il nome
      console.log("[v0] Invio join con nome:", playerName)
      ws.send(
        JSON.stringify({
          type: "join",
          playerName: playerName,
        }),
      )
    }
  }

  // Evento onmessage: quando viene ricevuto un messaggio dal server
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data) // Parsifica il messaggio JSON
    handleWebSocketMessage(data) // Gestisce il messaggio
  }

  // Evento onerror: quando si verifica un errore nella connessione
  ws.onerror = (error) => {
    console.error("[v0] WebSocket errore:", error)
  }

  // Evento onclose: quando la connessione viene chiusa
  ws.onclose = () => {
    console.log("[v0] WebSocket chiuso")

    // Tenta la riconnessione se la connessione è persa e i tentativi sono entro i limiti
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++
      console.log(`[v0] Tentativo riconnessione ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`)
      // Backoff esponenziale: attesa crescente tra i tentativi
      setTimeout(() => {
        connectWebSocket(playerName) // Ritenta la connessione
      }, 2000 * reconnectAttempts)
    } else {
      alert("Connessione persa. Ricarica la pagina per riconnetterti.")
    }
  }
}

// Gestisce i messaggi ricevuti dal server WebSocket
function handleWebSocketMessage(data) {
  console.log("[v0] Messaggio ricevuto:", data)

  switch (data.type) {
    case "connected": // Messaggio di connessione iniziale
      console.log("[v0] Connesso al server, giocatori attuali:", data.players)
      gameState.connectedPlayers = data.players
      gameState.players = data.players // Aggiorna la lista principale dei giocatori per la coerenza
      updateConnectedPlayersList() // Aggiorna la lista dei giocatori nella lobby host
      updateTotalsMultiplayer() // Aggiorna i conteggi nella lobby host
      break

    case "player-joined": // Un nuovo giocatore si è unito alla stanza
      console.log("[v0] Giocatore entrato:", data.playerName, "Lista completa:", data.players)
      gameState.connectedPlayers = data.players
      gameState.players = data.players // Aggiorna la lista principale dei giocatori
      updateConnectedPlayersList() // Aggiorna la lista host
      updateTotalsMultiplayer() // Aggiorna i conteggi host

      // Mostra una notifica di benvenuto
      const notification = document.createElement("div")
      notification.style.cssText =
        "position: fixed; top: 20px; right: 20px; background: var(--color-success); color: white; padding: 1rem 1.5rem; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"
      notification.textContent = `${data.playerName} si è unito alla stanza`
      document.body.appendChild(notification)
      setTimeout(() => notification.remove(), 3000) // Rimuovi la notifica dopo 3 secondi
      break

    case "player-left": // Un giocatore ha lasciato la stanza
      console.log("[v0] Giocatore uscito:", data.playerName)
      gameState.connectedPlayers = data.players
      gameState.players = data.players // Aggiorna la lista principale dei giocatori
      updateConnectedPlayersList() // Aggiorna la lista host
      updateTotalsMultiplayer() // Aggiorna i conteggi host
      break

    case "roles-updated": // L'host ha aggiornato la configurazione dei ruoli
      console.log("[v0] Ruoli aggiornati:", data.rolesConfig)
      gameState.rolesConfig = data.rolesConfig // Salva la configurazione dei ruoli

      // Aggiorna l'interfaccia multiplayer con la nuova configurazione
      Object.keys(ROLES).forEach((roleKey) => {
        const element = document.getElementById(`count-mp-${roleKey}`)
        if (element) {
          element.textContent = data.rolesConfig[roleKey] || 0
        }
      })
      updateTotalsMultiplayer() // Aggiorna i totali nella lobby host
      updateRolesDisplayForPlayers() // Aggiorna la visualizzazione dei ruoli nella lobby giocatore

      // Se non si è l'host, mostra una notifica dell'aggiornamento dei ruoli
      if (!gameState.isHost) {
        const notification = document.createElement("div")
        notification.style.cssText =
          "position: fixed; top: 20px; right: 20px; background: var(--color-primary); color: white; padding: 1rem 1.5rem; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"
        notification.textContent = "L'host ha aggiornato i ruoli"
        document.body.appendChild(notification)
        setTimeout(() => notification.remove(), 3000)
      }
      break

    case "game-started":
      console.log("[v0] Gioco iniziato, ruolo ricevuto:", data.yourRole)

      gameState.players = data.players
      gameState.playerName = data.playerName || gameState.playerName
      gameState.currentPhase = data.phase || "night"
      gameState.turnNumber = data.turnNumber || 1
      gameState.isNarrator = data.isNarrator || false // Riceve se questo giocatore è il narratore

      // Trova il giocatore corrente e salva il suo ruolo
      const myPlayer = gameState.players.find((p) => p.name === gameState.playerName)
      if (myPlayer && data.yourRole) {
        myPlayer.role = data.yourRole
        console.log("[v0] Il tuo ruolo è:", ROLES[data.yourRole].name)
      }

      hideAllScreens()
      document.getElementById("game-screen").classList.add("active")

      // Aggiorna l'indicatore di fase
      updateGameScreen()

      // Inizia con la fase notturna
      showNightPhase()
      break

    case "phase-changed":
      console.log("[v0] Fase cambiata:", data.phase)
      gameState.currentPhase = data.phase
      gameState.turnNumber = data.turnNumber || gameState.turnNumber
      gameState.players = data.players || gameState.players

      if (data.phase === "night") {
        showNightPhase()
      } else {
        gameState.lastNightDeaths = data.deaths || []
        showDayPhase()
      }
      break

    case "night-results":
      showNightResults(data.deaths)
      gameState.players = data.players
      updatePlayersList(data.players)
      break

    case "day-results":
      showDayResults(data.eliminated, data.votes)
      gameState.players = data.players
      updatePlayersList(data.players)
      break

    case "action-result":
      // Risultato di un'azione specifica (es. Veggente scopre ruolo)
      if (data.result && data.result.role) {
        const role = ROLES[data.result.role]
        alert(`${data.result.target} è: ${role.icon} ${role.name}`)
      }
      break

    case "game-over":
      showGameOver(data.winner, data.players)
      break

    case "error": // Messaggio di errore dal server
      alert(data.message)
      break
  }
}

// Invia un'azione notturna al server
function sendNightAction(action) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    alert("Connessione non attiva")
    return
  }

  ws.send(
    JSON.stringify({
      type: "night-action",
      action: action, // L'azione da inviare
    }),
  )
}

// Invia un voto diurno al server
function sendDayVote(target) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    alert("Connessione non attiva")
    return
  }

  ws.send(
    JSON.stringify({
      type: "day-vote",
      target: target, // Il giocatore votato
    }),
  )
}

// Lascia la stanza attuale
function leaveRoom() {
  if (ws) {
    ws.close() // Chiude la connessione WebSocket
    ws = null
  }

  // Resetta lo stato relativo alla stanza
  gameState.roomCode = null
  gameState.isHost = false
  gameState.isNarrator = false // Resetta il narratore
  gameState.connectedPlayers = []
  gameState.playerName = null
  showHomeScreen() // Torna alla schermata principale
}

// Selezione della modalità di gioco
function selectGameMode(mode) {
  gameState.gameMode = mode

  if (mode === "locale") {
    showSetupScreen() // Mostra la schermata di setup per il gioco locale
  } else if (mode === "multiplayer") {
    showMultiplayerLobby() // Mostra la lobby multiplayer
  }
}

// Applica un preset di ruoli in base al numero di giocatori (gioco locale)
function applyPreset(playerCount) {
  // Resetta tutti i conteggi dei ruoli
  Object.keys(ROLES).forEach((roleKey) => {
    document.getElementById(`count-${roleKey}`).textContent = "0"
  })

  // Applica il preset basato sul numero di giocatori
  switch (playerCount) {
    case 8:
      document.getElementById("count-lupo").textContent = "2"
      document.getElementById("count-contadino").textContent = "4"
      document.getElementById("count-veggente").textContent = "1"
      document.getElementById("count-guardia").textContent = "1"
      break
    case 10:
      document.getElementById("count-lupo").textContent = "2"
      document.getElementById("count-contadino").textContent = "5"
      document.getElementById("count-veggente").textContent = "1"
      document.getElementById("count-guardia").textContent = "1"
      document.getElementById("count-cupido").textContent = "1"
      break
    case 12:
      document.getElementById("count-lupo").textContent = "3"
      document.getElementById("count-contadino").textContent = "5"
      document.getElementById("count-veggente").textContent = "1"
      document.getElementById("count-guardia").textContent = "1"
      document.getElementById("count-strega").textContent = "1"
      document.getElementById("count-cacciatore").textContent = "1"
      break
    case 15:
      document.getElementById("count-lupo").textContent = "4"
      document.getElementById("count-contadino").textContent = "6"
      document.getElementById("count-veggente").textContent = "1"
      document.getElementById("count-guardia").textContent = "1"
      document.getElementById("count-strega").textContent = "1"
      document.getElementById("count-cupido").textContent = "1"
      document.getElementById("count-cacciatore").textContent = "1"
      break
  }

  updateTotals() // Aggiorna i totali visualizzati
}

// Applica un preset di ruoli in base al numero di giocatori (lobby multiplayer)
function applyPresetMultiplayer(playerCount) {
  // Resetta tutti i conteggi dei ruoli
  Object.keys(ROLES).forEach((roleKey) => {
    const element = document.getElementById(`count-mp-${roleKey}`)
    if (element) {
      element.textContent = "0"
    }
  })

  // Applica il preset basato sul numero di giocatori
  switch (playerCount) {
    case 8:
      document.getElementById("count-mp-lupo").textContent = "2"
      document.getElementById("count-mp-contadino").textContent = "4"
      document.getElementById("count-mp-veggente").textContent = "1"
      document.getElementById("count-mp-guardia").textContent = "1"
      break
    case 10:
      document.getElementById("count-mp-lupo").textContent = "2"
      document.getElementById("count-mp-contadino").textContent = "5"
      document.getElementById("count-mp-veggente").textContent = "1"
      document.getElementById("count-mp-guardia").textContent = "1"
      document.getElementById("count-mp-cupido").textContent = "1"
      break
    case 12:
      document.getElementById("count-mp-lupo").textContent = "3"
      document.getElementById("count-mp-contadino").textContent = "5"
      document.getElementById("count-mp-veggente").textContent = "1"
      document.getElementById("count-mp-guardia").textContent = "1"
      document.getElementById("count-mp-strega").textContent = "1"
      document.getElementById("count-mp-cacciatore").textContent = "1"
      break
    case 15:
      document.getElementById("count-mp-lupo").textContent = "4"
      document.getElementById("count-mp-contadino").textContent = "6"
      document.getElementById("count-mp-veggente").textContent = "1"
      document.getElementById("count-mp-guardia").textContent = "1"
      document.getElementById("count-mp-strega").textContent = "1"
      document.getElementById("count-mp-cupido").textContent = "1"
      document.getElementById("count-mp-cacciatore").textContent = "1"
      break
  }

  updateTotalsMultiplayer() // Aggiorna i totali visualizzati nella lobby multiplayer
}

// Aggiorna la lista dei giocatori nella schermata della lobby del giocatore
function updateLobbyPlayersList() {
  const lobbyList = document.getElementById("lobby-players-list")
  if (!lobbyList) return // Esci se l'elemento non esiste

  lobbyList.innerHTML = "" // Pulisce la lista esistente

  // Se non ci sono giocatori nella stanza
  if (gameState.connectedPlayers.length === 0) {
    lobbyList.innerHTML =
      '<p style="color: var(--color-text-muted); text-align: center; padding: 1rem;">Nessun giocatore nella stanza</p>'
    return
  }

  // Aggiunge ogni giocatore connesso alla lista
  gameState.connectedPlayers.forEach((player) => {
    const playerItem = document.createElement("div")
    playerItem.className = "player-item"
    playerItem.innerHTML = `
      <span>${player.name}</span>
      <span style="color: var(--color-success);">✓</span> <!-- Segno di spunta per indicare la connessione -->
    `
    lobbyList.appendChild(playerItem)
  })

  // Aggiorna il conteggio dei giocatori nella lobby
  const countElement = document.getElementById("lobby-players-count")
  if (countElement) {
    countElement.textContent = gameState.connectedPlayers.length
  }
}

// Funzione per copiare il codice della stanza negli appunti
function copyRoomCode() {
  const roomCode = gameState.roomCode
  if (!roomCode) return // Se non c'è un codice stanza, esci

  // Prova con la moderna Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(roomCode)
      .then(() => {
        showCopyNotification("Codice copiato!") // Mostra notifica di successo
      })
      .catch(() => {
        fallbackCopyTextToClipboard(roomCode) // Fallback se l'API fallisce
      })
  } else {
    fallbackCopyTextToClipboard(roomCode) // Fallback se l'API non è supportata
  }
}

// Funzione di fallback per copiare testo negli appunti se Clipboard API non è disponibile o fallisce
function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement("textarea")
  textArea.value = text
  // Rende l'area di testo invisibile e fuori posto
  textArea.style.position = "fixed"
  textArea.style.top = "0"
  textArea.style.left = "0"
  textArea.style.opacity = "0"
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  try {
    document.execCommand("copy") // Comando obsoleto ma ancora supportato
    showCopyNotification("Codice copiato!")
  } catch (err) {
    showCopyNotification("Errore nella copia")
  }

  document.body.removeChild(textArea) // Rimuove l'elemento temporaneo
}

// Funzione per mostrare una notifica temporanea per l'azione di copia
function showCopyNotification(message) {
  const notification = document.createElement("div")
  notification.style.cssText =
    "position: fixed; top: 20px; right: 20px; background: var(--color-success); color: white; padding: 1rem 1.5rem; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"
  notification.textContent = message
  document.body.appendChild(notification)
  setTimeout(() => notification.remove(), 2000) // Rimuove la notifica dopo 2 secondi
}

// Aggiorna la visualizzazione dei ruoli nella lobby del giocatore
function updateRolesDisplayForPlayers() {
  const rolesDisplay = document.getElementById("roles-display-player")
  if (!rolesDisplay) return // Esci se l'elemento non esiste

  rolesDisplay.innerHTML = "" // Pulisce la visualizzazione esistente

  let totalRoles = 0

  // Itera su tutti i ruoli definiti
  Object.keys(ROLES).forEach((roleKey) => {
    const count = gameState.rolesConfig[roleKey] || 0 // Ottiene il conteggio del ruolo dalla configurazione
    if (count > 0) {
      // Se il conteggio è maggiore di zero, mostra il ruolo
      totalRoles += count
      const role = ROLES[roleKey]
      const roleItem = document.createElement("div")
      roleItem.className = "role-display-item"
      roleItem.innerHTML = `
        <span>
          <span style="font-size: 1.2rem;">${role.icon}</span>
          <span>${role.name}</span>
        </span>
        <span class="role-count">×${count}</span> <!-- Mostra il conteggio -->
      `
      rolesDisplay.appendChild(roleItem)
    }
  })

  // Aggiorna il totale dei ruoli visualizzati
  const totalElement = document.getElementById("total-roles-player")
  if (totalElement) {
    totalElement.textContent = totalRoles
  }

  // Messaggio se l'host non ha ancora configurato i ruoli
  if (totalRoles === 0) {
    rolesDisplay.innerHTML =
      '<p style="color: var(--color-text-muted); text-align: center; padding: 1rem;">L\'host non ha ancora configurato i ruoli</p>'
  }
}

// Le seguenti funzioni sono placeholders per il flusso del gioco multiplayer.
// Il server gestirà la logica principale e comunicherà gli aggiornamenti.

// Mostra la fase notturna nel gioco multiplayer
function showNightPhase() {
  console.log("[v0] showNightPhase called (multiplayer)")

  const gameContent = document.getElementById("game-content")
  if (!gameContent) return

  // Trova il giocatore corrente basato sul nome memorizzato
  const myPlayer = gameState.players.find((p) => p.name === gameState.playerName)
  if (!myPlayer && !gameState.isNarrator) {
    console.error("Giocatore corrente non trovato per la fase notturna!")
    return
  }

  const myRole = myPlayer && myPlayer.role ? ROLES[myPlayer.role] : null

  let html = `
    <div class="phase-content">
      <h3>🌙 Fase Notturna - Turno ${gameState.turnNumber}</h3>
      <div class="narrative-text">
        <p>Il villaggio si addormenta. Durante la notte, i lupi mannari escono dalle ombre...</p>
      </div>
  `

  if (gameState.isNarrator) {
    html += `
      <div class="your-action-card">
        <h4>📖 Sei il Narratore</h4>
        <p>Gestisci le fasi di gioco e assicurati che tutti i giocatori eseguano le loro azioni.</p>
        <p><strong>Giocatori in vita:</strong> ${gameState.players.filter((p) => p.alive).length}</p>
      </div>
    `
  } else if (!myPlayer || !myPlayer.alive) {
    html += `
      <div class="your-action-card">
        <p>Sei morto. Riposa in pace e attendi la fine della partita.</p>
      </div>
    `
  } else if (myRole && myRole.nightAction) {
    html += generateMyNightActionHTML(myPlayer, myRole)
  } else {
    html += `
      <div class="your-action-card">
        <p>Non hai azioni durante la notte. Attendi che il narratore avanzi alla fase diurna.</p>
      </div>
    `
  }

  html += `</div>`
  gameContent.innerHTML = html

  const nextPhaseBtn = document.getElementById("next-phase-btn")
  if (nextPhaseBtn) {
    nextPhaseBtn.style.display = gameState.isNarrator ? "block" : "none"
    nextPhaseBtn.textContent = "Passa al Giorno"
  }
}

function generateMyNightActionHTML(player, role) {
  const alivePlayers = gameState.players.filter((p) => p.alive && p.name !== player.name)

  let html = `
    <div class="your-action-card">
      <h4>${role.icon} ${role.name}</h4>
      <p>${role.description}</p> <!-- Utilizza la descrizione del ruolo per le istruzioni -->
  `

  // Controlla se il ruolo ha un'azione notturna e se il giocatore è vivo
  if (role.nightAction && player.alive) {
    if (role.key === "cupido" && gameState.turnNumber > 1) {
      html += `<p>Cupido agisce solo al primo turno.</p>`
    } else if (role.key === "cupido") {
      html += `<p>Scegli due giocatori da far innamorare:</p>
      <div id="cupid-selection-area"></div>
      <div class="player-selection">
      ${alivePlayers
        .map(
          (p) => `
        <button class="player-btn" onclick="selectForCupid('${p.name}')">${p.name}</button>
      `,
        )
        .join("")}
      </div>
      `
    } else if (alivePlayers.length > 0) {
      html += `<div class="player-selection">`
      alivePlayers.forEach((p) => {
        // Determina il testo del pulsante in base al ruolo
        let buttonText = p.name
        if (role.key === "strega") {
          buttonText = `Salva ${p.name}` // Default: salva
        } else if (role.key === "lupo") {
          buttonText = `Attacca ${p.name}`
        } else if (role.key === "veggente") {
          buttonText = `Indovina ${p.name}`
        } else if (role.key === "guardia") {
          buttonText = `Proteggi ${p.name}`
        }

        html += `<button class="player-btn" onclick="performNightAction('${role.key}', '${p.name}')">${buttonText}</button>`
      })
      // Aggiungi opzione "Salta" per ruoli che possono scegliere di non agire
      if (role.key === "strega" || role.key === "veggente" || role.key === "guardia") {
        html += `<button class="player-btn" onclick="performNightAction('${role.key}', null)">Salta</button>`
      }
      html += `</div>`
    } else {
      html += `<p>Non ci sono altri giocatori da scegliere.</p>`
    }
  } else if (!player.alive) {
    html += `<p>Sei morto e non puoi agire.</p>`
  } else {
    html += `<p>Non hai azioni da compiere durante la notte.</p>`
  }

  html += `</div>`
  return html
}

let cupidSelections = []
function selectForCupid(playerName) {
  const selectionArea = document.getElementById("cupid-selection-area")
  if (!selectionArea) return

  if (cupidSelections.includes(playerName)) {
    // Rimuovi se già selezionato
    cupidSelections = cupidSelections.filter((p) => p !== playerName)
  } else if (cupidSelections.length < 2) {
    // Aggiungi se meno di 2 selezionati
    cupidSelections.push(playerName)
  }

  if (cupidSelections.length === 2) {
    selectionArea.innerHTML = `
      <p>Selezionati: ${cupidSelections.join(" e ")}</p>
      <button class="action-btn" onclick="performCupidAction()">Conferma Amore</button>
    `
  } else {
    selectionArea.innerHTML = `<p>Selezionati: ${cupidSelections.join(", ")} (${cupidSelections.length}/2)</p>`
  }
}

function performCupidAction() {
  if (cupidSelections.length === 2) {
    sendNightAction({
      action: "cupid-link",
      targets: cupidSelections,
    })
    cupidSelections = [] // Resetta le selezioni
    const selectionArea = document.getElementById("cupid-selection-area")
    if (selectionArea) {
      selectionArea.innerHTML = `<p>✅ Amore creato! Attendi il narratore.</p>`
    }
  } else {
    alert("Devi selezionare esattamente due giocatori!")
  }
}

function performNightAction(roleKey, targetName) {
  // Mappa le chiavi dei ruoli alle azioni del server
  const actionMap = {
    lupo: "wolf-kill",
    veggente: "seer-check",
    guardia: "guard-protect",
    strega: "witch-use", // Azione generica per la strega, il server deciderà cosa fare
    cupido: "cupid-link", // Già gestito sopra, ma per completezza
  }

  const actionType = actionMap[roleKey]

  if (!actionType) {
    console.error("Azione non definita per il ruolo:", roleKey)
    return
  }

  // Invia solo se c'è un bersaglio o se l'azione è esplicita (come skip o salvo)
  if (targetName !== null || actionType === "witch-use" || actionType === "skip") {
    // Aggiungi skip se serve
    sendNightAction({
      action: actionType,
      target: targetName, // Può essere null se l'azione non richiede un bersaglio diretto
    })
    alert(`Azione inviata!`)
    // Potrebbe essere utile aggiornare l'UI qui per mostrare che l'azione è stata inviata
  } else {
    alert("Seleziona un bersaglio o scegli di saltare.")
  }
}

function showDayPhase() {
  console.log("[v0] showDayPhase called (multiplayer)")

  const gameContent = document.getElementById("game-content")
  if (!gameContent) return

  const myPlayer = gameState.players.find((p) => p.name === gameState.playerName)

  let html = `
    <div class="phase-content">
      <h3>☀️ Fase Diurna - Turno ${gameState.turnNumber}</h3>
      <div class="narrative-text">
  `

  if (gameState.lastNightDeaths && gameState.lastNightDeaths.length > 0) {
    html += `<p><strong>⚰️ Durante la notte sono morti:</strong></p><ul>`
    gameState.lastNightDeaths.forEach((name) => {
      html += `<li>${name}</li>`
    })
    html += `</ul>`
  } else {
    html += `<p>🎉 Nessuno è morto durante la notte!</p>`
  }

  html += `
      <p>Il villaggio si riunisce per discutere e votare chi eliminare.</p>
      </div>
  `

  if (gameState.isNarrator) {
    html += `
      <div class="your-action-card">
        <h4>📖 Narratore</h4>
        <p>I giocatori devono votare chi eliminare. Quando tutti hanno votato, passa alla fase notturna.</p>
      </div>
    `
  } else if (myPlayer && myPlayer.alive) {
    // Filtra i giocatori vivi, escludendo se stesso per il voto (opzionale, ma comune)
    const alivePlayers = gameState.players.filter((p) => p.alive && p.name !== myPlayer.name)

    html += `
      <div class="your-action-card">
        <h4>Vota chi eliminare</h4>
        <p>Scegli un giocatore da eliminare o salta il turno:</p>
        <div class="player-selection">
          <button class="player-btn" onclick="voteToEliminate(null)">⏭️ Salta (nessuno)</button>
    `

    alivePlayers.forEach((p) => {
      html += `<button class="player-btn" onclick="voteToEliminate('${p.name}')">${p.name}</button>`
    })

    html += `
        </div>
      </div>
    `
  } else {
    html += `
      <div class="your-action-card">
        <p>Sei morto. Osserva in silenzio.</p>
      </div>
    `
  }

  html += `</div>`
  gameContent.innerHTML = html

  const nextPhaseBtn = document.getElementById("next-phase-btn")
  if (nextPhaseBtn) {
    nextPhaseBtn.style.display = gameState.isNarrator ? "block" : "none"
    nextPhaseBtn.textContent = "Passa alla Notte"
  }
}

function voteToEliminate(targetName) {
  sendDayVote(targetName)
  alert(targetName ? `Hai votato per eliminare ${targetName}` : "Hai scelto di non eliminare nessuno")
}

// Dummy functions for undeclared variables to fix linting errors.
// These should be implemented properly as part of the game logic.
function showNightResults(deaths) {
  console.log("showNightResults called with:", deaths)
  // Implement the actual logic for displaying night results
}

function showDayResults(eliminated, votes) {
  console.log("showDayResults called with:", eliminated, votes)
  // Implement the actual logic for displaying day results
}

function showGameOver(winner, players) {
  console.log("showGameOver called with:", winner, players)
  // Implement the actual logic for displaying game over screen
}
