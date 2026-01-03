// Cloudflare Worker per gestire il multiplayer di Lupus in Tabula

import { WebSocketPair } from "@cloudflare/workers"

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // Abilita CORS
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders })
    }

    // Crea una nuova stanza
    if (url.pathname === "/api/create-room" && request.method === "POST") {
      const roomCode = generateRoomCode()
      const id = env.GAME_ROOMS.idFromName(roomCode)
      const room = env.GAME_ROOMS.get(id)

      await room.fetch(request)

      return new Response(JSON.stringify({ roomCode }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // WebSocket per connessione alla stanza
    if (url.pathname.startsWith("/api/room/")) {
      const roomCode = url.pathname.split("/")[3]
      const id = env.GAME_ROOMS.idFromName(roomCode)
      const room = env.GAME_ROOMS.get(id)

      return room.fetch(request)
    }

    return new Response("Lupus in Tabula API", {
      headers: corsHeaders,
    })
  },
}

function generateRoomCode() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return code
}

// Durable Object per gestire lo stato di ogni stanza
export class GameRoom {
  constructor(state, env) {
    this.state = state
    this.env = env
    this.sessions = []
    this.gameState = {
      host: null,
      players: [],
      rolesConfig: {},
      gameStarted: false,
      currentPhase: null,
      currentNight: 0,
      currentRoleIndex: 0,
      nightActions: {},
      eliminated: [],
    }
  }

  async fetch(request) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders })
    }

    // Upgrade to WebSocket
    const upgradeHeader = request.headers.get("Upgrade")
    if (upgradeHeader === "websocket") {
      const pair = new WebSocketPair()
      const [client, server] = Object.values(pair)

      await this.handleSession(server)

      return new Response(null, {
        status: 101,
        webSocket: client,
        headers: corsHeaders,
      })
    }

    return new Response("WebSocket expected", {
      status: 400,
      headers: corsHeaders,
    })
  }

  async handleSession(webSocket) {
    webSocket.accept()

    const session = { webSocket, playerName: null, isHost: false }
    this.sessions.push(session)

    webSocket.addEventListener("message", async (event) => {
      try {
        const data = JSON.parse(event.data)
        await this.handleMessage(session, data)
      } catch (error) {
        console.error("Error handling message:", error)
        webSocket.send(
          JSON.stringify({
            type: "error",
            message: "Errore del server",
          }),
        )
      }
    })

    webSocket.addEventListener("close", () => {
      this.sessions = this.sessions.filter((s) => s !== session)
      if (session.playerName) {
        this.gameState.players = this.gameState.players.filter((p) => p.name !== session.playerName)
        this.broadcast({
          type: "player-left",
          playerName: session.playerName,
          players: this.gameState.players,
        })
      }
    })

    // Invia stato iniziale
    webSocket.send(
      JSON.stringify({
        type: "connected",
        players: this.gameState.players,
        gameStarted: this.gameState.gameStarted,
      }),
    )
  }

  async handleMessage(session, data) {
    switch (data.type) {
      case "create-host":
        session.isHost = true
        session.playerName = data.playerName
        this.gameState.host = data.playerName
        this.broadcast({
          type: "host-created",
          host: data.playerName,
        })
        break

      case "join":
        if (this.gameState.gameStarted) {
          session.webSocket.send(
            JSON.stringify({
              type: "error",
              message: "La partita è già iniziata",
            }),
          )
          return
        }

        const existingPlayer = this.gameState.players.find((p) => p.name === data.playerName)
        if (existingPlayer) {
          session.webSocket.send(
            JSON.stringify({
              type: "error",
              message: "Nome già in uso",
            }),
          )
          return
        }

        session.playerName = data.playerName
        this.gameState.players.push({
          name: data.playerName,
          role: null,
          alive: true,
          protectedStatus: false,
          lover: null,
        })

        this.broadcast({
          type: "player-joined",
          playerName: data.playerName,
          players: this.gameState.players,
        })
        break

      case "update-roles":
        if (!session.isHost) {
          session.webSocket.send(
            JSON.stringify({
              type: "error",
              message: "Solo l'host può modificare i ruoli",
            }),
          )
          return
        }
        this.gameState.rolesConfig = data.rolesConfig
        this.broadcast({
          type: "roles-updated",
          rolesConfig: data.rolesConfig,
        })
        break

      case "start-game":
        if (!session.isHost) {
          session.webSocket.send(
            JSON.stringify({
              type: "error",
              message: "Solo l'host può iniziare la partita",
            }),
          )
          return
        }

        // Assegna ruoli ai giocatori
        const roles = []
        Object.entries(this.gameState.rolesConfig).forEach(([roleKey, count]) => {
          for (let i = 0; i < count; i++) {
            roles.push(roleKey)
          }
        })

        // Mescola i ruoli
        for (let i = roles.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[roles[i], roles[j]] = [roles[j], roles[i]]
        }

        // Assegna ai giocatori
        this.gameState.players.forEach((player, index) => {
          player.role = roles[index]
        })

        this.gameState.gameStarted = true
        this.gameState.currentPhase = "night"
        this.gameState.currentNight = 1

        // Invia a ogni giocatore il proprio ruolo in privato
        this.sessions.forEach((session) => {
          const player = this.gameState.players.find((p) => p.name === session.playerName)
          if (player) {
            session.webSocket.send(
              JSON.stringify({
                type: "game-started",
                yourRole: player.role,
                players: this.gameState.players.map((p) => ({
                  name: p.name,
                  alive: p.alive,
                })),
              }),
            )
          }
        })
        break

      case "night-action":
        // Gestisce le azioni notturne
        this.gameState.nightActions[session.playerName] = data.action

        this.broadcast(
          {
            type: "action-received",
            playerName: session.playerName,
          },
          session,
        )

        // Controlla se tutti hanno agito
        const activeRoles = this.getActiveNightRoles()
        const allActionsReceived = activeRoles.every((role) => {
          const player = this.gameState.players.find((p) => p.role === role && p.alive)
          return !player || this.gameState.nightActions[player.name]
        })

        if (allActionsReceived) {
          this.processNightActions()
        }
        break

      case "day-vote":
        this.gameState.nightActions[session.playerName] = {
          type: "vote",
          target: data.target,
        }

        this.broadcast(
          {
            type: "vote-received",
            playerName: session.playerName,
          },
          session,
        )

        // Controlla se tutti hanno votato
        const alivePlayers = this.gameState.players.filter((p) => p.alive)
        const allVoted = alivePlayers.every((p) => this.gameState.nightActions[p.name])

        if (allVoted) {
          this.processDayVotes()
        }
        break

      case "next-phase":
        if (!session.isHost) return
        this.nextPhase()
        break
    }
  }

  getActiveNightRoles() {
    const roles = ["cupido", "lupo", "veggente", "guardia", "strega"]
    return roles.filter((role) => this.gameState.players.some((p) => p.role === role && p.alive))
  }

  processNightActions() {
    const actions = this.gameState.nightActions
    let victim = null
    let protectedPlayer = null
    let savedByPotion = false
    let killedByPotion = null

    // Elabora le azioni
    Object.entries(actions).forEach(([playerName, action]) => {
      const player = this.gameState.players.find((p) => p.name === playerName)

      if (action.type === "wolves-kill") {
        victim = action.target
      } else if (action.type === "guard-protect") {
        protectedPlayer = action.target
      } else if (action.type === "witch-save" && action.target) {
        savedByPotion = true
      } else if (action.type === "witch-kill" && action.target) {
        killedByPotion = action.target
      } else if (action.type === "cupid-pair") {
        const [lover1, lover2] = action.targets
        const p1 = this.gameState.players.find((p) => p.name === lover1)
        const p2 = this.gameState.players.find((p) => p.name === lover2)
        if (p1 && p2) {
          p1.lover = lover2
          p2.lover = lover1
        }
      }
    })

    const deaths = []

    // Determina chi muore
    if (victim && victim !== protectedPlayer && !savedByPotion) {
      const victimPlayer = this.gameState.players.find((p) => p.name === victim)
      if (victimPlayer) {
        victimPlayer.alive = false
        deaths.push(victim)

        // Se muore un innamorato, muore anche l'altro
        if (victimPlayer.lover) {
          const lover = this.gameState.players.find((p) => p.name === victimPlayer.lover)
          if (lover && lover.alive) {
            lover.alive = false
            deaths.push(lover.name)
          }
        }
      }
    }

    if (killedByPotion) {
      const poisonedPlayer = this.gameState.players.find((p) => p.name === killedByPotion)
      if (poisonedPlayer) {
        poisonedPlayer.alive = false
        deaths.push(killedByPotion)
      }
    }

    // Reset azioni
    this.gameState.nightActions = {}

    // Invia risultati
    this.broadcast({
      type: "night-results",
      deaths: deaths,
      players: this.gameState.players.map((p) => ({
        name: p.name,
        alive: p.alive,
      })),
    })

    // Controlla vittoria
    this.checkVictory()
  }

  processDayVotes() {
    const votes = {}

    Object.values(this.gameState.nightActions).forEach((action) => {
      if (action.type === "vote" && action.target) {
        votes[action.target] = (votes[action.target] || 0) + 1
      }
    })

    // Trova il più votato
    let maxVotes = 0
    let eliminated = null
    Object.entries(votes).forEach(([name, count]) => {
      if (count > maxVotes) {
        maxVotes = count
        eliminated = name
      }
    })

    if (eliminated) {
      const player = this.gameState.players.find((p) => p.name === eliminated)
      if (player) {
        player.alive = false

        // Se muore un innamorato, muore anche l'altro
        if (player.lover) {
          const lover = this.gameState.players.find((p) => p.name === player.lover)
          if (lover && lover.alive) {
            lover.alive = false
          }
        }
      }
    }

    this.gameState.nightActions = {}

    this.broadcast({
      type: "day-results",
      eliminated: eliminated,
      votes: votes,
      players: this.gameState.players.map((p) => ({
        name: p.name,
        alive: p.alive,
      })),
    })

    this.checkVictory()
  }

  checkVictory() {
    const alivePlayers = this.gameState.players.filter((p) => p.alive)
    const aliveWolves = alivePlayers.filter((p) => p.role === "lupo")
    const aliveVillagers = alivePlayers.filter((p) => p.role !== "lupo")

    if (aliveWolves.length === 0) {
      this.broadcast({
        type: "game-over",
        winner: "villagers",
        players: this.gameState.players,
      })
    } else if (aliveWolves.length >= aliveVillagers.length) {
      this.broadcast({
        type: "game-over",
        winner: "wolves",
        players: this.gameState.players,
      })
    }
  }

  nextPhase() {
    if (this.gameState.currentPhase === "night") {
      this.gameState.currentPhase = "day"
    } else {
      this.gameState.currentPhase = "night"
      this.gameState.currentNight++
    }

    this.broadcast({
      type: "phase-changed",
      phase: this.gameState.currentPhase,
      night: this.gameState.currentNight,
    })
  }

  broadcast(message, except = null) {
    const messageStr = JSON.stringify(message)
    this.sessions.forEach((session) => {
      if (session !== except && session.webSocket.readyState === 1) {
        session.webSocket.send(messageStr)
      }
    })
  }
}
