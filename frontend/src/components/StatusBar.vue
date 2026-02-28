<script setup lang="ts">
defineEmits(['logout'])
</script>

<template>
  <header class="flex items-center justify-between px-4 shrink-0" style="height: 48px; background: #1a1b1e; border-bottom: 1px solid #2e2f33;">
    <div class="flex items-center gap-4">
      <span class="text-white font-bold text-sm">PZM</span>
      <div class="flex items-center gap-2 text-xs" style="color: #868e96;">
        <span class="inline-block w-2 h-2 rounded-full" style="background: #51cf66;"></span>
        <span>Running</span>
      </div>
    </div>

    <div class="flex items-center gap-4 text-xs" style="color: #868e96;">
      <span>TPS: --</span>
      <span>玩家: --</span>
      <span>記憶體: --</span>
      <button
        @click="$emit('logout')"
        class="px-3 py-1 rounded text-xs"
        style="background: #25262b; color: #868e96; border: 1px solid #2e2f33;"
      >
        登出
      </button>
    </div>
  </header>
</template>