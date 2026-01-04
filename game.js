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
  connectedPlayers: [],
  rolesConfig: {}, // Salvare la configurazione localmente
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
  hideAllScreens()
  document.getElementById("home-screen").classList.add("active")
}

function showSetupScreen() {
  hideAllScreens()
  document.getElementById("setup-screen").classList.add("active")
  initializeRolesConfig()
  updatePlayersList()
  updateTotals()
}

function showRulesScreen() {
  hideAllScreens()
  document.getElementById("rules-screen").classList.add("active")
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

  ws.send(
    JSON.stringify({
      type: "start-game",
      // rolesConfig: rolesConfig // Non è più necessario inviare qui, ma dal WebSocket
    }),
  )
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

function updateGameScreen() {
  const phaseIndicator = document.getElementById("phase-indicator")
  const phaseIcon = phaseIndicator.querySelector(".phase-icon")
  const phaseText = phaseIndicator.querySelector(".phase-text")

  const nextPhaseBtn = document.getElementById("next-phase-btn")

  if (gameState.currentPhase === "night") {
    phaseIcon.textContent = "🌙"
    phaseText.textContent = `Notte - Turno ${gameState.turnNumber}`
    if (nextPhaseBtn) nextPhaseBtn.textContent = "Concludi Notte"
  } else {
    phaseIcon.textContent = "☀️"
    phaseText.textContent = `Giorno - Turno ${gameState.turnNumber}`
    if (nextPhaseBtn) nextPhaseBtn.textContent = "Passa alla Notte"
  }

  const aliveCount = gameState.players.filter((p) => p.alive).length
  document.getElementById("alive-count").textContent = aliveCount

  updateGameContent()
}

function updateGameContent() {
  const gameContent = document.getElementById("game-content")

  if (gameState.currentPhase === "night") {
    gameContent.innerHTML = `
      <div class="phase-content">
        <h3>🌙 Fase Notturna - Turno ${gameState.turnNumber}</h3>
        <p>Il villaggio dorme. È tempo delle azioni notturne...</p>
        
        <div class="night-actions-container">
          ${generateNightActionsHTML()}
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
    gameContent.innerHTML = `
      <div class="phase-content">
        <h3>☀️ Fase Diurna - Turno ${gameState.turnNumber}</h3>
        ${generateDayPhaseHTML()}
      </div>
    `
  }
}

function generateNightActionsHTML() {
  let html = ""

  // Check which roles are in the game and alive
  const wolves = gameState.players.filter((p) => p.alive && p.role === "lupo")
  const seer = gameState.players.find((p) => p.alive && p.role === "veggente")
  const guard = gameState.players.find((p) => p.alive && p.role === "guardia")
  const witch = gameState.players.find((p) => p.alive && p.role === "strega")
  const cupid = gameState.players.find((p) => p.role === "cupido" && gameState.turnNumber === 1)

  // Cupid (first night only)
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

  // Wolves
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

  // Seer
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

  // Guard
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

  // Witch
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

  if (html === "") {
    html = '<p style="text-align: center; color: var(--color-text-muted);">Nessuna azione notturna disponibile.</p>'
  }

  return html
}

function generateDayPhaseHTML() {
  // Check night results
  const nightResult = resolveNightActions()

  let html = ""

  if (nightResult.deaths.length > 0) {
    html += '<div class="death-announcement">'
    html += '<h4 style="color: var(--color-danger); margin-bottom: 1rem;">💀 Questa notte...</h4>'
    nightResult.deaths.forEach((playerName) => {
      html += `<p style="font-size: 1.1rem; margin-bottom: 0.5rem;"><strong>${playerName}</strong> è stato trovato morto!</p>`
    })
    html += "</div>"
  } else {
    html += '<div class="death-announcement">'
    html += '<p style="color: var(--color-success); font-size: 1.1rem;">Nessuno è morto stanotte! 🎉</p>'
    html += "</div>"
  }

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

function resolveNightActions() {
  const deaths = []
  const actions = gameState.nightActions

  // Determine if wolves' target dies
  if (actions.wolvesTarget) {
    const target = gameState.players.find((p) => p.name === actions.wolvesTarget)

    if (target) {
      let dies = true

      // Check if protected by guard
      if (actions.guardTarget === target.name) {
        dies = false
      }

      // Check if saved by witch
      if (actions.witchSave) {
        dies = false
      }

      if (dies) {
        target.alive = false
        deaths.push(target.name)

        // Check if target has a lover
        if (target.lover) {
          const lover = gameState.players.find((p) => p.name === target.lover)
          if (lover && lover.alive) {
            lover.alive = false
            deaths.push(lover.name)
          }
        }
      }
    }
  }

  // Witch's kill potion
  if (actions.witchKill) {
    const target = gameState.players.find((p) => p.name === actions.witchKill)
    if (target && target.alive) {
      target.alive = false
      deaths.push(target.name)

      // Check lover
      if (target.lover) {
        const lover = gameState.players.find((p) => p.name === target.lover)
        if (lover && lover.alive) {
          lover.alive = false
          deaths.push(lover.name)
        }
      }
    }
  }

  // Reset night actions for next night
  gameState.nightActions = {
    wolvesTarget: null,
    seerTarget: null,
    guardTarget: null,
    witchSave: false,
    witchKill: null,
    witchSaveUsed: actions.witchSaveUsed,
    witchKillUsed: actions.witchKillUsed,
  }

  return { deaths }
}

function performWolvesAction() {
  showPlayerSelectionModal("Scegli la vittima dei lupi", (selectedPlayer) => {
    gameState.nightActions.wolvesTarget = selectedPlayer.name
    alert(`I lupi hanno scelto ${selectedPlayer.name}`)
    sendNightAction({ type: "wolves-target", target: selectedPlayer.name })
  })
}

function performSeerAction() {
  showPlayerSelectionModal("Scegli un giocatore di cui scoprire il ruolo", (selectedPlayer) => {
    const role = ROLES[selectedPlayer.role]
    alert(`${selectedPlayer.name} è: ${role.name} ${role.icon}`)
    sendNightAction({ type: "seer-target", target: selectedPlayer.name })
  })
}

function performGuardAction() {
  showPlayerSelectionModal("Scegli chi proteggere stanotte", (selectedPlayer) => {
    gameState.nightActions.guardTarget = selectedPlayer.name
    alert(`La guardia protegge ${selectedPlayer.name}`)
    sendNightAction({ type: "guard-target", target: selectedPlayer.name })
  })
}

function performWitchAction() {
  const target = gameState.nightActions.wolvesTarget
  let message = "Strega, ecco le tue opzioni:\n\n"

  if (!gameState.nightActions.witchSaveUsed && target) {
    message += `💚 Pozione di Salvataggio: La vittima dei lupi è ${target}. Vuoi salvarla?\n\n`
  }

  if (!gameState.nightActions.witchKillUsed) {
    message += "💀 Pozione Veleno: Vuoi uccidere qualcuno?\n\n"
  }

  if (gameState.nightActions.witchSaveUsed && gameState.nightActions.witchKillUsed) {
    alert("Hai già usato entrambe le pozioni!")
    return
  }

  const choice = prompt(message + 'Scrivi "salva" per salvare, "uccidi" per uccidere, o "niente" per non fare nulla:')

  if (choice === "salva" && !gameState.nightActions.witchSaveUsed && target) {
    gameState.nightActions.witchSave = true
    gameState.nightActions.witchSaveUsed = true
    alert(`Hai salvato ${target}!`)
    sendNightAction({ type: "witch-save", target: target })
  } else if (choice === "uccidi" && !gameState.nightActions.witchKillUsed) {
    showPlayerSelectionModal("Scegli chi uccidere con la pozione veleno", (selectedPlayer) => {
      gameState.nightActions.witchKill = selectedPlayer.name
      gameState.nightActions.witchKillUsed = true
      alert(`Hai avvelenato ${selectedPlayer.name}!`)
      sendNightAction({ type: "witch-kill", target: selectedPlayer.name })
    })
  }
}

function performCupidAction() {
  let firstLover = null

  showPlayerSelectionModal("Scegli il primo innamorato", (player1) => {
    firstLover = player1
    showPlayerSelectionModal(
      "Scegli il secondo innamorato",
      (player2) => {
        if (player1.name === player2.name) {
          alert("Devi scegliere due giocatori diversi!")
          return
        }

        player1.lover = player2.name
        player2.lover = player1.name
        alert(`${player1.name} e ${player2.name} sono ora innamorati! 💘`)
        sendNightAction({ type: "cupid-action", lovers: [player1.name, player2.name] })
      },
      [firstLover.name],
    )
  })
}

function showPlayerSelectionModal(title, callback, excludeNames = []) {
  const modal = document.getElementById("players-modal")
  const modalContent = modal.querySelector(".modal-content")

  const alivePlayers = gameState.players.filter((p) => p.alive && !excludeNames.includes(p.name))

  let html = `
    <div class="modal-header">
      <h3>${title}</h3>
      <button class="modal-close" onclick="closePlayersModal()">×</button>
    </div>
    <div class="players-selection" style="padding: 1.5rem;">
  `

  alivePlayers.forEach((player) => {
    html += `
      <div class="player-select-item" onclick="selectPlayerFromModal('${player.name}')">
        <span>${player.name}</span>
        <span>→</span>
      </div>
    `
  })

  html += "</div>"

  modalContent.innerHTML = html
  modal.classList.add("active")

  // Store callback
  window.currentPlayerSelectionCallback = callback
}

function selectPlayerFromModal(playerName) {
  const player = gameState.players.find((p) => p.name === playerName)
  closePlayersModal()

  if (window.currentPlayerSelectionCallback) {
    window.currentPlayerSelectionCallback(player)
    window.currentPlayerSelectionCallback = null
  }
}

function startDayVoting() {
  const gameContent = document.getElementById("game-content")

  let html = `
    <div class="phase-content">
      <h3>🗳️ Votazione</h3>
      <p style="margin-bottom: 1.5rem;">Seleziona il giocatore che vuoi eliminare. Puoi anche scegliere di non eliminare nessuno.</p>
      
      <div class="players-selection">
  `

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
      
      <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
        <button class="btn btn-secondary" style="flex: 1;" onclick="skipDayVoting()">Nessuno</button>
        <button class="btn btn-secondary" style="flex: 1;" onclick="updateGameContent()">Annulla</button>
      </div>
    </div>
  `

  gameContent.innerHTML = html
}

function skipDayVoting() {
  const confirm = window.confirm("Il villaggio ha deciso di non eliminare nessuno oggi. Passare alla fase notturna?")

  if (confirm) {
    proceedToNextPhase()
  }
}

function voteToEliminate(playerName) {
  const player = gameState.players.find((p) => p.name === playerName)

  if (!player) return

  const confirm = window.confirm(`Confermi di voler eliminare ${playerName}? Questa azione non può essere annullata.`)

  if (!confirm) return

  player.alive = false

  // Check if they're a hunter
  if (player.role === "cacciatore") {
    const takeDown = window.confirm(`${playerName} era il Cacciatore! Vuole portare qualcuno con sé?`)

    if (takeDown) {
      showPlayerSelectionModal(
        "Il cacciatore sceglie chi portare con sé",
        (targetPlayer) => {
          targetPlayer.alive = false
          alert(`${playerName} porta con sé ${targetPlayer.name}!`)

          // Check lover
          if (targetPlayer.lover) {
            const lover = gameState.players.find((p) => p.name === targetPlayer.lover)
            if (lover && lover.alive) {
              lover.alive = false
              alert(`${lover.name} muore insieme a ${targetPlayer.name} per amore! 💔`)
            }
          }

          proceedToNextPhase()
        },
        [playerName],
      )
      return
    }
  }

  // Check lover
  if (player.lover) {
    const lover = gameState.players.find((p) => p.name === player.lover)
    if (lover && lover.alive) {
      lover.alive = false
      alert(`${lover.name} muore insieme a ${playerName} per amore! 💔`)
    }
  }

  proceedToNextPhase()
}

function proceedToNextPhase() {
  // Check win conditions
  const alivePlayers = gameState.players.filter((p) => p.alive)
  const aliveWolves = alivePlayers.filter((p) => ROLES[p.role].team === "lupi")
  const aliveVillagers = alivePlayers.filter((p) => ROLES[p.role].team === "villaggio")

  if (aliveWolves.length === 0) {
    setTimeout(() => {
      alert("🎉 Il Villaggio ha vinto! Tutti i lupi sono stati eliminati!")
      showHomeScreen()
      resetGame()
    }, 500)
    return
  }

  if (aliveWolves.length >= aliveVillagers.length) {
    setTimeout(() => {
      alert("🐺 I Lupi hanno vinto! Il villaggio è caduto!")
      showHomeScreen()
      resetGame()
    }, 500)
    return
  }

  nextPhase()
}

function nextPhase() {
  if (gameState.currentPhase === "night") {
    gameState.currentPhase = "day"
  } else {
    gameState.currentPhase = "night"
    gameState.turnNumber++
  }

  updateGameScreen()
}

// Players modal
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

  gameState.players.forEach((player) => {
    const status = player.alive ? "Vivo" : "Morto"
    const statusClass = player.alive ? "alive" : "dead"

    html += `
      <div class="player-status-item ${player.alive ? "" : "dead"}">
        <div>
          <div style="font-size: 1.1rem; margin-bottom: 0.25rem;">${player.name}</div>
          ${player.lover && player.alive ? `<div style="font-size: 0.85rem; color: var(--color-text-muted);">💘 Innamorato di ${player.lover}</div>` : ""}
        </div>
        <span class="status-badge ${statusClass}">
          ${status}
        </span>
      </div>
    `
  })

  html += "</div>"

  modalContent.innerHTML = html
  modal.classList.add("active")

  updatePlayersStatusList() // Ensure the list is updated when modal opens
}

function closePlayersModal() {
  const modal = document.getElementById("players-modal")
  modal.classList.remove("active")
}

function updatePlayersStatusList() {
  const list = document.getElementById("players-status-list")
  if (!list) return // Exit if the element doesn't exist

  list.innerHTML = ""

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

// Reset game
function resetGame() {
  gameState.players = []
  gameState.roles = []
  gameState.currentPhase = "night"
  gameState.turnNumber = 1
  gameState.currentPlayerIndex = 0
  gameState.selectedPlayer = null
  gameState.deadPlayers = []
  gameState.gameHistory = []
  gameState.nightActions = {
    wolvesTarget: null,
    seerTarget: null,
    guardTarget: null,
    witchSave: false,
    witchKill: null,
    witchSaveUsed: false,
    witchKillUsed: false,
  }
  gameState.rolesConfig = {} // Salvare la configurazione localmente
  gameState.gameMode = null
  gameState.roomCode = null
  gameState.isHost = false
  gameState.connectedPlayers = []
}

// Close modal on outside click
document.getElementById("players-modal").addEventListener("click", function (e) {
  if (e.target === this) {
    closePlayersModal()
  }
})

// Enter key for adding players
document.getElementById("player-name-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addPlayer()
  }
})

// Multiplayer lobby functions
async function createRoom() {
  try {
    const response = await fetch(`${WORKER_URL}/api/create-room`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })

    const data = await response.json()
    gameState.roomCode = data.roomCode
    gameState.isHost = true // Set host flag
    showMultiplayerHostScreen()
    connectWebSocket()
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

  if (!roomCode) {
    alert("Inserisci il codice della stanza!")
    return
  }

  if (!playerName) {
    alert("Inserisci il tuo nome!")
    return
  }

  gameState.roomCode = roomCode
  gameState.isHost = false // Not the host

  showMultiplayerPlayerScreen()
  connectWebSocket(playerName)
}

let ws = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5

function connectWebSocket(playerName = null) {
  // Construct WebSocket URL based on WORKER_URL
  const wsUrl = `${WORKER_URL.replace("https://", "wss://")}/api/room/${gameState.roomCode}`

  console.log("[v0] Connessione a:", wsUrl)
  console.log("[v0] Nome giocatore:", playerName)
  console.log("[v0] È host:", gameState.isHost)

  ws = new WebSocket(wsUrl)

  ws.onopen = () => {
    console.log("[v0] WebSocket connesso")
    reconnectAttempts = 0 // Reset reconnect attempts on successful connection

    if (gameState.isHost) {
      console.log("[v0] Invio create-host")
      // If host, send a message to establish host role
      ws.send(
        JSON.stringify({
          type: "create-host",
          playerName: "Host", // Host name can be generic or configurable
        }),
      )
    } else if (playerName) {
      console.log("[v0] Invio join con nome:", playerName)
      // If player, send join message with player name
      ws.send(
        JSON.stringify({
          type: "join",
          playerName: playerName,
        }),
      )
    }
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    handleWebSocketMessage(data)
  }

  ws.onerror = (error) => {
    console.error("[v0] WebSocket errore:", error)
  }

  ws.onclose = () => {
    console.log("[v0] WebSocket chiuso")

    // Attempt to reconnect if connection is lost and within limits
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++
      console.log(`[v0] Tentativo riconnessione ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`)
      setTimeout(() => {
        connectWebSocket(playerName) // Re-attempt connection
      }, 2000 * reconnectAttempts) // Exponential backoff
    } else {
      alert("Connessione persa. Ricarica la pagina per riconnetterti.")
    }
  }
}

function handleWebSocketMessage(data) {
  console.log("[v0] Messaggio ricevuto:", data)

  switch (data.type) {
    case "connected":
      console.log("[v0] Connesso al server, giocatori attuali:", data.players)
      gameState.connectedPlayers = data.players
      updateConnectedPlayersList()
      updateTotalsMultiplayer()
      break

    case "player-joined":
      console.log("[v0] Giocatore entrato:", data.playerName, "Lista completa:", data.players)
      gameState.connectedPlayers = data.players
      updateConnectedPlayersList()
      updateTotalsMultiplayer()

      const notification = document.createElement("div")
      notification.style.cssText =
        "position: fixed; top: 20px; right: 20px; background: var(--color-success); color: white; padding: 1rem 1.5rem; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"
      notification.textContent = `${data.playerName} si è unito alla stanza`
      document.body.appendChild(notification)
      setTimeout(() => notification.remove(), 3000)
      break

    case "player-left":
      console.log("[v0] Giocatore uscito:", data.playerName)
      gameState.connectedPlayers = data.players
      updateConnectedPlayersList()
      updateTotalsMultiplayer()
      break

    case "roles-updated":
      console.log("[v0] Ruoli aggiornati:", data.rolesConfig)
      gameState.rolesConfig = data.rolesConfig

      // Aggiorna l'interfaccia con la nuova configurazione ruoli
      Object.keys(ROLES).forEach((roleKey) => {
        const element = document.getElementById(`count-mp-${roleKey}`)
        if (element) {
          element.textContent = data.rolesConfig[roleKey] || 0
        }
      })
      updateTotalsMultiplayer()

      updateRolesDisplayForPlayers()

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
      // Il gioco è iniziato, mostra il ruolo al giocatore
      const role = ROLES[data.yourRole]
      alert(`Il tuo ruolo è: ${role.icon} ${role.name}\n\n${role.description}`)

      // Nascondi schermata lobby, mostra game screen
      hideAllScreens()
      document.getElementById("game-screen").classList.add("active")

      // Aggiorna lista giocatori
      updatePlayersList(data.players)
      break

    case "phase-changed":
      gameState.currentPhase = data.phase
      if (data.phase === "night") {
        gameState.currentNight = data.night
        showNightPhase()
      } else {
        showDayPhase()
      }
      break

    case "night-results":
      showNightResults(data.deaths)
      updatePlayersList(data.players)
      break

    case "day-results":
      showDayResults(data.eliminated, data.votes)
      updatePlayersList(data.players)
      break

    case "game-over":
      showGameOver(data.winner, data.players)
      break

    case "error":
      alert(data.message)
      break
  }
}

function sendNightAction(action) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    alert("Connessione non attiva")
    return
  }

  ws.send(
    JSON.stringify({
      type: "night-action",
      action: action,
    }),
  )
}

function sendDayVote(target) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    alert("Connessione non attiva")
    return
  }

  ws.send(
    JSON.stringify({
      type: "day-vote",
      target: target,
    }),
  )
}

function leaveRoom() {
  if (ws) {
    ws.close()
    ws = null
  }

  gameState.roomCode = null
  gameState.isHost = false
  gameState.connectedPlayers = []
  showHomeScreen()
}

// Game mode selection
function selectGameMode(mode) {
  gameState.gameMode = mode

  if (mode === "locale") {
    showSetupScreen()
  } else if (mode === "multiplayer") {
    showMultiplayerLobby()
  }
}

// Preset functions
function applyPreset(playerCount) {
  // Reset all roles
  Object.keys(ROLES).forEach((roleKey) => {
    document.getElementById(`count-${roleKey}`).textContent = "0"
  })

  // Apply preset based on player count
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

  updateTotals()
}

function applyPresetMultiplayer(playerCount) {
  // Reset all roles
  Object.keys(ROLES).forEach((roleKey) => {
    const element = document.getElementById(`count-mp-${roleKey}`)
    if (element) {
      element.textContent = "0"
    }
  })

  // Apply preset based on player count
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

  updateTotalsMultiplayer()
}

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  showHomeScreen()
})

// Placeholder functions for multiplayer game flow
function showNightPhase() {
  console.log("showNightPhase called (multiplayer)")
  // Implement logic to display night phase in multiplayer
  updateGameScreen() // Or a dedicated multiplayer update function
}

function showDayPhase() {
  console.log("showDayPhase called (multiplayer)")
  // Implement logic to display day phase in multiplayer
  updateGameScreen() // Or a dedicated multiplayer update function
}

function showNightResults(deaths) {
  console.log("showNightResults called (multiplayer):", deaths)
  // Implement logic to display night results in multiplayer
  // This might involve updating the game screen based on received data
  updateGameScreen()
}

function showDayResults(eliminated, votes) {
  console.log("showDayResults called (multiplayer):", eliminated, votes)
  // Implement logic to display day results in multiplayer
  updateGameScreen()
}

function showGameOver(winner, players) {
  console.log("showGameOver called (multiplayer):", winner, players)
  // Implement logic to display game over screen in multiplayer
  hideAllScreens()
  document.getElementById("game-over-screen").classList.add("active") // Assuming you have a game-over screen
  document.getElementById("winner-message").textContent = `${winner} ha vinto!`
  // Optionally display player statuses
}

// New function to update the player list in the player's lobby screen
function updateLobbyPlayersList() {
  const lobbyList = document.getElementById("lobby-players-list")
  if (!lobbyList) return

  lobbyList.innerHTML = ""

  if (gameState.connectedPlayers.length === 0) {
    lobbyList.innerHTML =
      '<p style="color: var(--color-text-muted); text-align: center; padding: 1rem;">Nessun giocatore nella stanza</p>'
    return
  }

  gameState.connectedPlayers.forEach((player) => {
    const playerItem = document.createElement("div")
    playerItem.className = "player-item"
    playerItem.innerHTML = `
      <span>${player.name}</span>
      <span style="color: var(--color-success);">✓</span>
    `
    lobbyList.appendChild(playerItem)
  })

  const countElement = document.getElementById("lobby-players-count")
  if (countElement) {
    countElement.textContent = gameState.connectedPlayers.length
  }
}

// New function to copy room code
function copyRoomCode() {
  const roomCode = gameState.roomCode
  if (!roomCode) return

  // Try with the modern Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(roomCode)
      .then(() => {
        showCopyNotification("Codice copiato!")
      })
      .catch(() => {
        fallbackCopyTextToClipboard(roomCode) // Fallback if API fails
      })
  } else {
    fallbackCopyTextToClipboard(roomCode) // Fallback if API is not supported
  }
}

// Fallback function for copying text if Clipboard API is not available or fails
function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement("textarea")
  textArea.value = text
  // Make textarea invisible and out of the way
  textArea.style.position = "fixed"
  textArea.style.top = "0"
  textArea.style.left = "0"
  textArea.style.opacity = "0"
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  try {
    document.execCommand("copy")
    showCopyNotification("Codice copiato!")
  } catch (err) {
    showCopyNotification("Errore nella copia")
  }

  document.body.removeChild(textArea)
}

// Function to display a temporary notification for copy action
function showCopyNotification(message) {
  const notification = document.createElement("div")
  notification.style.cssText =
    "position: fixed; top: 20px; right: 20px; background: var(--color-success); color: white; padding: 1rem 1.5rem; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"
  notification.textContent = message
  document.body.appendChild(notification)
  setTimeout(() => notification.remove(), 2000) // Remove after 2 seconds
}

function updateRolesDisplayForPlayers() {
  const rolesDisplay = document.getElementById("roles-display-player")
  if (!rolesDisplay) return

  rolesDisplay.innerHTML = ""

  let totalRoles = 0

  Object.keys(ROLES).forEach((roleKey) => {
    const count = gameState.rolesConfig[roleKey] || 0
    if (count > 0) {
      totalRoles += count
      const role = ROLES[roleKey]
      const roleItem = document.createElement("div")
      roleItem.className = "role-display-item"
      roleItem.innerHTML = `
        <span>
          <span style="font-size: 1.2rem;">${role.icon}</span>
          <span>${role.name}</span>
        </span>
        <span class="role-count">×${count}</span>
      `
      rolesDisplay.appendChild(roleItem)
    }
  })

  const totalElement = document.getElementById("total-roles-player")
  if (totalElement) {
    totalElement.textContent = totalRoles
  }

  if (totalRoles === 0) {
    rolesDisplay.innerHTML =
      '<p style="color: var(--color-text-muted); text-align: center; padding: 1rem;">L\'host non ha ancora configurato i ruoli</p>'
  }
}
