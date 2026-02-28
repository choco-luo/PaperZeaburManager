<script setup lang="ts">
import McTerminal from '@/components/McTerminal.vue'
import type { WsMessage } from '@/composables/useTerminalSocket'

defineProps<{
  isConnected: boolean
  isServerRunning: boolean
  sendInput: (data: string) => void
  sendResize: (cols: number, rows: number) => void
  onMessage: (fn: (msg: WsMessage) => void) => () => void
}>()
</script>

<template>
  <div class="h-full">
    <McTerminal
      :isConnected="isConnected"
      :isServerRunning="isServerRunning"
      :sendInput="sendInput"
      :sendResize="sendResize"
      :onMessage="onMessage"
    />
  </div>
</template>