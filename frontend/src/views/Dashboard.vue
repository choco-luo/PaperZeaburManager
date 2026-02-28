<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import TerminalPanel from '@/components/panels/TerminalPanel.vue'
import PlayersPanel from '@/components/panels/PlayersPanel.vue'
import FilesPanel from '@/components/panels/FilesPanel.vue'
import PluginsPanel from '@/components/panels/PluginsPanel.vue'
import BackupPanel from '@/components/panels/BackupPanel.vue'
import UploadPanel from '@/components/panels/UploadPanel.vue'
import StatusBar from '@/components/StatusBar.vue'

const router = useRouter()
const activePanel = ref('terminal')

const navItems = [
  { id: 'terminal', label: '終端機'},
  { id: 'players', label: '玩家列表'},
  { id: 'files', label: '檔案管理'},
  { id: 'plugins', label: 'Plugin 設定'},
  { id: 'backup', label: '備份下載'},
  { id: 'upload', label: '上傳伺服器包'},
]

function logout() {
  localStorage.removeItem('token')
  router.push('/login')
}
</script>

<template>
  <div class="w-screen h-screen flex flex-col" style="background: #141517;">
    <!-- 頂部狀態列 -->
    <StatusBar @logout="logout" />

    <div class="flex flex-1 overflow-hidden">
      <!-- 側邊欄 -->
      <aside class="flex flex-col w-48 shrink-0" style="background: #1a1b1e; border-right: 1px solid #2e2f33;">
        <nav class="flex flex-col gap-1 p-2 flex-1">
          <button
            v-for="item in navItems"
            :key="item.id"
            @click="activePanel = item.id"
            class="flex items-center gap-2 px-3 py-2 rounded text-sm text-left transition-colors"
            :style="{
              background: activePanel === item.id ? '#25262b' : 'transparent',
              color: activePanel === item.id ? '#ffffff' : '#868e96',
            }"
          >
            <span>{{ item.label }}</span>
          </button>
        </nav>
      </aside>

      <!-- 主內容區 -->
      <main class="flex-1 overflow-hidden p-4">
        <TerminalPanel v-if="activePanel === 'terminal'" />
        <PlayersPanel v-else-if="activePanel === 'players'" />
        <FilesPanel v-else-if="activePanel === 'files'" />
        <PluginsPanel v-else-if="activePanel === 'plugins'" />
        <BackupPanel v-else-if="activePanel === 'backup'" />
        <UploadPanel v-else-if="activePanel === 'upload'" />
      </main>
    </div>
  </div>
</template>