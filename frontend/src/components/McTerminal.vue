<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import type { WsMessage } from '@/composables/useTerminalSocket'

const props = defineProps<{
  isConnected: boolean
  isServerRunning: boolean
  sendInput: (data: string) => void
  sendResize: (cols: number, rows: number) => void
  onMessage: (fn: (msg: WsMessage) => void) => () => void
}>()

const terminalRef = ref<HTMLDivElement | null>(null)

let term: Terminal
let fitAddon: FitAddon
let resizeObserver: ResizeObserver
let unsubscribe: (() => void) | null = null

onMounted(() => {
  term = new Terminal({
    theme: {
      background: '#1a1b1e',
      foreground: '#d4d4d4',
      cursor: '#ffffff',
      selectionBackground: '#264f78',
    },
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    fontSize: 14,
    lineHeight: 1.2,
    cursorBlink: true,
    scrollback: 5000,
  })

  fitAddon = new FitAddon()
  term.loadAddon(fitAddon)
  term.loadAddon(new WebLinksAddon())

  term.open(terminalRef.value!)
  fitAddon.fit()

  term.onData((data) => {
    if (data === '\x03') return
    props.sendInput(data)
  })

  unsubscribe = props.onMessage((msg) => {
    if (msg.type === 'output') {
      term.write(msg.data)
    }
  })

  resizeObserver = new ResizeObserver(() => {
    fitAddon.fit()
    props.sendResize(term.cols, term.rows)
  })
  resizeObserver.observe(terminalRef.value!)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  term?.dispose()
  unsubscribe?.()
})
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- 狀態列 -->
    <div class="flex items-center gap-2 px-4 py-3" style="border-bottom: 1px solid #DEE3E2;">
      <span
        class="inline-block w-2 h-2 rounded-full"
        :style="{ background: isConnected ? '#51cf66' : '#ff6b6b' }"
      />
      <span class="text-xs" style="color: #7B8791;">{{ isConnected ? 'Connected' : 'Reconnecting...' }}</span>
      <span class="text-xs" style="color: #B6C8CF;">|</span>
      <span
        class="inline-block w-2 h-2 rounded-full"
        :style="{ background: isServerRunning ? '#51cf66' : '#fcc419' }"
      />
      <span class="text-xs" style="color: #7B8791;">PaperMC {{ isServerRunning ? 'Running' : 'Stopped' }}</span>
    </div>

    <!-- 終端機本體 -->
    <div ref="terminalRef" class="flex-1 overflow-hidden rounded-b-xl" style="padding: 12px; background: white;" />
  </div>
</template>