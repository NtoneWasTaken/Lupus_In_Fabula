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
                <button class="counter-btn" onclick="changeRoleCountMultiplayer('${roleKey}', -1)">−</button>
                <span class="counter-value" id="count-mp-${roleKey}">0</span>
                <button class="counter-btn" onclick="changeRoleCountMultiplayer('${roleKey}', 1)">+</button>
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
  updateConnectedPlayersList()
  updateTotalsMultiplayer()
}

function showMultiplayerPlayerScreen() {
  hideAllScreens()
  document.getElementById("multiplayer-player-screen").classList.add("active")
  document.getElementById("player-room-code").textContent = gameState.roomCode
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

function updatePlayersList() {
  const playersList = document.getElementById("players-list")
  playersList.innerHTML = ""

  if (gameState.players.length === 0) {
    playersList.innerHTML =
      '<p style="color: var(--color-text-muted); padding: 1rem; text-align: center;">Nessun giocatore aggiunto</p>'
    return
  }

  gameState.players.forEach((player, index) => {
    const playerItem = document.createElement("div")
    playerItem.className = "player-item"
    playerItem.innerHTML = `
            <span>${player.name}</span>
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
      <button class="btn-remove" onclick="removeConnectedPlayer(${index})">Rimuovi</button>
    `
    list.appendChild(playerItem)
  })
}

// Role count management
function changeRoleCount(roleKey, delta) {
  const countElement = document.getElementById(`count-${roleKey}`)
  let currentCount = Number.parseInt(countElement.textContent)
  currentCount = Math.max(0, currentCount + delta)
  countElement.textContent = currentCount
  updateTotals()
}

function changeRoleCountMultiplayer(roleKey, change) {
  const countElement = document.getElementById(`count-mp-${roleKey}`)
  let currentCount = Number.parseInt(countElement.textContent)
  currentCount = Math.max(0, currentCount + change)
  countElement.textContent = currentCount
  updateTotalsMultiplayer()
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
  alert("La modalità multiplayer richiede un backend con Cloudflare Workers.\n\nPer ora usa la Modalità Locale!")
  // In futuro qui ci sarà la logica per iniziare la partita multiplayer
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
  })
}

function performSeerAction() {
  showPlayerSelectionModal("Scegli un giocatore di cui scoprire il ruolo", (selectedPlayer) => {
    const role = ROLES[selectedPlayer.role]
    alert(`${selectedPlayer.name} è: ${role.name} ${role.icon}`)
  })
}

function performGuardAction() {
  showPlayerSelectionModal("Scegli chi proteggere stanotte", (selectedPlayer) => {
    gameState.nightActions.guardTarget = selectedPlayer.name
    alert(`La guardia protegge ${selectedPlayer.name}`)
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
  } else if (choice === "uccidi" && !gameState.nightActions.witchKillUsed) {
    showPlayerSelectionModal("Scegli chi uccidere con la pozione veleno", (selectedPlayer) => {
      gameState.nightActions.witchKill = selectedPlayer.name
      gameState.nightActions.witchKillUsed = true
      alert(`Hai avvelenato ${selectedPlayer.name}!`)
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
}

function closePlayersModal() {
  const modal = document.getElementById("players-modal")
  modal.classList.remove("active")
}

function updatePlayersStatusList() {
  const list = document.getElementById("players-status-list")
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
function createRoom() {
  // Genera un codice stanza casuale di 6 caratteri
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let roomCode = ""
  for (let i = 0; i < 6; i++) {
    roomCode += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  gameState.roomCode = roomCode
  gameState.isHost = true
  gameState.connectedPlayers = []

  // Mostra schermata host
  showMultiplayerHostScreen()

  // Nota: In una vera implementazione multiplayer, qui ci sarebbe la chiamata
  // al backend (Cloudflare Workers) per creare la stanza
  console.log("[v0] Stanza creata (simulazione locale):", roomCode)
  alert(
    "Modalità Multiplayer richiede un backend.\n\nPer ora, usa la Modalità Locale che funziona completamente offline.\n\nSe vuoi il vero multiplayer, dovrai configurare Cloudflare Workers (ti posso aiutare dopo!).",
  )
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
  gameState.isHost = false

  // Mostra schermata giocatore in attesa
  showMultiplayerPlayerScreen()

  // Nota: In una vera implementazione multiplayer, qui ci sarebbe la chiamata
  // al backend per unirsi alla stanza
  console.log("[v0] Tentativo di unirsi alla stanza (simulazione locale):", roomCode, "come", playerName)
  alert(
    "Modalità Multiplayer richiede un backend.\n\nPer ora, usa la Modalità Locale che funziona completamente offline.",
  )
}

function copyRoomCode() {
  const roomCode = document.getElementById("room-code-display").textContent
  navigator.clipboard.writeText(roomCode).then(() => {
    const btn = document.querySelector(".btn-copy")
    const originalText = btn.textContent
    btn.textContent = "✓ Copiato!"
    setTimeout(() => {
      btn.textContent = originalText
    }, 2000)
  })
}

function leaveRoom() {
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
