<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { useTerminalSocket } from '@/composables/useTerminalSocket'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000'

const terminalRef = ref<HTMLDivElement | null>(null)

const { isConnected, isServerRunning, sendInput, sendResize, onMessage } =
  useTerminalSocket(WS_URL)

let term: Terminal
let fitAddon: FitAddon
let resizeObserver: ResizeObserver

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

  term.onData((data) => sendInput(data))

  onMessage((msg) => {
    if (msg.type === 'output') {
      term.write(msg.data)
    }
  })

  resizeObserver = new ResizeObserver(() => {
    fitAddon.fit()
    sendResize(term.cols, term.rows)
  })
  resizeObserver.observe(terminalRef.value!)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  term?.dispose()
})
</script>

<template>
  <div class="flex flex-col h-full rounded-lg overflow-hidden" style="background: #1a1b1e; border: 1px solid #2e2f33;">
    <!-- 狀態列 -->
    <div class="flex items-center text-xs" style="gap: 6px; padding: 6px 12px; background: #25262b; border-bottom: 1px solid #2e2f33; color: #868e96;">
      <span
        class="inline-block w-2 h-2 rounded-full"
        :style="{ background: isConnected ? '#51cf66' : '#ff6b6b' }"
      />
      <span>{{ isConnected ? 'Connected' : 'Reconnecting...' }}</span>
      <span style="margin: 0 4px; color: #444;">|</span>
      <span
        class="inline-block w-2 h-2 rounded-full"
        :style="{ background: isServerRunning ? '#51cf66' : '#fcc419' }"
      />
      <span>PaperMC {{ isServerRunning ? 'Running' : 'Starting...' }}</span>
    </div>

    <!-- 終端機本體 -->
    <div ref="terminalRef" class="flex-1 overflow-hidden" style="padding: 8px;" />
  </div>
</template>