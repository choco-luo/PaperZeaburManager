<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  playerList: string[]
  players: string
}>()

function getAvatarUrl(name: string) {
  return `https://mc-heads.net/avatar/${name}/40`
}

const isEmpty = computed(() => props.playerList.length === 0)
</script>

<template>
  <div class="h-full flex flex-col p-6">
    <!-- 標題 -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-base font-medium" style="color: #4F5158;">玩家列表</h2>
      <span class="text-sm px-3 py-1 rounded-full" style="background: #DEE3E2; color: #7B8791;">
        {{ players }} 在線
      </span>
    </div>

    <!-- 空狀態 -->
    <div v-if="isEmpty" class="flex-1 flex flex-col items-center justify-center gap-2">
      <span class="text-4xl">🌙</span>
      <span class="text-sm" style="color: #B6C8CF;">目前沒有玩家在線</span>
    </div>

    <!-- 玩家列表 -->
    <div v-else class="flex flex-col gap-2 overflow-y-auto">
      <div
        v-for="name in playerList"
        :key="name"
        class="flex items-center gap-3 px-4 py-3 rounded-xl"
        style="background: #F8F9F9; border: 1px solid #DEE3E2;"
      >
        <img
          :src="getAvatarUrl(name)"
          :alt="name"
          class="w-10 h-10 rounded-lg"
          style="image-rendering: pixelated;"
        />
        <span class="text-sm font-medium" style="color: #4F5158;">{{ name }}</span>
      </div>
    </div>
  </div>
</template>