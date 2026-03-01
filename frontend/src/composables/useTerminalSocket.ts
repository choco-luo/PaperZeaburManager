import { ref, onUnmounted } from 'vue'

export type WsMessage =
  | { type: 'output'; data: string }
  | { type: 'status'; running: boolean }
  | { type: 'stats'; data: { players: string; playerList: string[] } }
  | { type: 'error'; message: string }

export function useTerminalSocket(url: string) {
  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const isServerRunning = ref(false)
  const stats = ref({ players: '--', playerList: [] as string[] })
  const listeners = new Set<(msg: WsMessage) => void>()
  let shouldReconnect = true

  function connect() {
    const token = localStorage.getItem('token') || ''
    ws.value = new WebSocket(`${url}?token=${token}`)

    ws.value.onopen = () => {
      isConnected.value = true
    }

    ws.value.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data)
        if (msg.type === 'status') {
          isServerRunning.value = msg.running
        }
        if (msg.type === 'stats') {
          stats.value = msg.data
        }
        if (msg.type === 'error' && msg.message === '未授權') {
          shouldReconnect = false
          localStorage.removeItem('token')
          window.location.href = '/login'
          return
        }
        listeners.forEach((fn) => fn(msg))
      } catch (e) {
        console.error('Parse error:', e)
      }
    }

    ws.value.onclose = () => {
      isConnected.value = false
      if (shouldReconnect) {
        setTimeout(connect, 3000)
      }
    }

    ws.value.onerror = (err) => {
      console.error('WebSocket error:', err)
    }
  }

  function sendInput(data: string) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: 'input', data }))
    }
  }

  function sendResize(cols: number, rows: number) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: 'resize', cols, rows }))
    }
  }

  function onMessage(fn: (msg: WsMessage) => void) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  }

  onUnmounted(() => {
    shouldReconnect = false
    ws.value?.close()
  })

  connect()

  return { isConnected, isServerRunning, stats, sendInput, sendResize, onMessage }
}