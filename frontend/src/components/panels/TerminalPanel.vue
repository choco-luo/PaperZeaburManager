<script setup lang="ts">
import McTerminal from '@/components/McTerminal.vue'
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- 卡片頂部標題列 -->
    <div class="flex items-center px-5 shrink-0" style="height: 48px; border-bottom: 1px solid #f0f0f0;">
      <span class="text-sm font-medium" style="color: #444;">終端機</span>
    </div>
    <!-- 終端機本體 -->
    <div class="flex-1 overflow-hidden" style="background: #1a1b1e; border-radius: 0 0 12px 12px;">
      <McTerminal />
    </div>
  </div>
</template>