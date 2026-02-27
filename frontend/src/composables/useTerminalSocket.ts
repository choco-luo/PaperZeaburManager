import { ref, onUnmounted } from 'vue'

export type WsMessage =
  | { type: 'output'; data: string }
  | { type: 'status'; running: boolean }

export function useTerminalSocket(url: string) {
  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const isServerRunning = ref(false)
  const listeners = new Set<(msg: WsMessage) => void>()

  function connect() {
    const token = localStorage.getItem('token') || ''
    ws.value = new WebSocket(`${url}?token=${token}`)

    ws.value.onopen = () => {
      isConnected.value = true
      console.log('WebSocket connected')
    }

    ws.value.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data)
        if (msg.type === 'status') {
          isServerRunning.value = msg.running
        }
        listeners.forEach((fn) => fn(msg))
      } catch (e) {
        console.error('Parse error:', e)
      }
    }

    ws.value.onclose = () => {
      isConnected.value = false
      // 3 秒後自動重連
      setTimeout(connect, 3000)
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
    ws.value?.close()
  })

  connect()

  return { isConnected, isServerRunning, sendInput, sendResize, onMessage }
}