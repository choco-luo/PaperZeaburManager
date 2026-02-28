<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Server, Terminal, Users, FolderOpen, Plug, Download, Upload, LogOut } from 'lucide-vue-next'
import TerminalPanel from '@/components/panels/TerminalPanel.vue'
import PlayersPanel from '@/components/panels/PlayersPanel.vue'
import FilesPanel from '@/components/panels/FilesPanel.vue'
import PluginsPanel from '@/components/panels/PluginsPanel.vue'
import BackupPanel from '@/components/panels/BackupPanel.vue'
import UploadPanel from '@/components/panels/UploadPanel.vue'

const router = useRouter()
const activePanel = ref('terminal')

const navItems = [
  { id: 'terminal', label: '終端機', icon: Terminal },
  { id: 'players', label: '玩家列表', icon: Users },
  { id: 'files', label: '檔案管理', icon: FolderOpen },
  { id: 'plugins', label: 'Plugin 設定', icon: Plug },
  { id: 'backup', label: '備份下載', icon: Download },
  { id: 'upload', label: '上傳伺服器包', icon: Upload },
]

function logout() {
  localStorage.removeItem('token')
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4" style="background: #B6C8CF;">
    <div class="w-full flex overflow-hidden rounded-2xl shadow-2xl" style="max-width: 1280px; height: 90vh;">

      <!-- 側邊欄 -->
      <aside class="flex flex-col w-56 shrink-0" style="background: #4F5158;">
        <!-- Logo -->
        <div class="p-6" style="border-bottom: 1px solid #7B8791;">
          <div class="flex items-center gap-3 mb-4">
            <Server :size="24" style="color: #F8F9F9;" />
            <h1 class="text-xl tracking-wide" style="color: #F8F9F9;">PZM</h1>
          </div>
          <div class="flex items-center gap-2">
            <span class="inline-block w-2 h-2 rounded-full bg-green-400"></span>
            <span class="text-sm" style="color: #DEE3E2;">Running</span>
          </div>
        </div>

        <!-- 導航 -->
        <nav class="flex-1 p-4 flex flex-col gap-1">
          <button
            v-for="item in navItems"
            :key="item.id"
            @click="activePanel = item.id"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm text-left"
            :style="{
              background: activePanel === item.id ? '#7B8791' : 'transparent',
              color: activePanel === item.id ? '#F8F9F9' : '#DEE3E2',
            }"
          >
            <component :is="item.icon" :size="20" />
            <span>{{ item.label }}</span>
          </button>
        </nav>
      </aside>

      <!-- 主內容 -->
      <main class="flex-1 flex flex-col overflow-hidden" style="background: #DEE3E2;">
        <!-- 頂部狀態列 -->
        <header class="flex items-center justify-between px-8 py-4 shrink-0" style="border-bottom: 1px solid #B6C8CF;">
          <div class="flex gap-6">
            <div class="flex items-center gap-2">
              <span class="text-sm" style="color: #4F5158;">TPS:</span>
              <span class="text-sm" style="color: #7B8791;">--</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm" style="color: #4F5158;">玩家:</span>
              <span class="text-sm" style="color: #7B8791;">--</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm" style="color: #4F5158;">記憶體:</span>
              <span class="text-sm" style="color: #7B8791;">--</span>
            </div>
          </div>
          <button
            @click="logout"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
            style="background: #7B8791; color: #F8F9F9;"
          >
            <LogOut :size="16" />
            <span>登出</span>
          </button>
        </header>

        <!-- 內容區 -->
        <div class="flex-1 overflow-hidden p-8">
          <div class="h-full rounded-xl overflow-hidden shadow-inner" style="background: #F8F9F9;">
            <TerminalPanel v-if="activePanel === 'terminal'" />
            <PlayersPanel v-else-if="activePanel === 'players'" />
            <FilesPanel v-else-if="activePanel === 'files'" />
            <PluginsPanel v-else-if="activePanel === 'plugins'" />
            <BackupPanel v-else-if="activePanel === 'backup'" />
            <UploadPanel v-else-if="activePanel === 'upload'" />
          </div>
        </div>
      </main>

    </div>
  </div>
</template>