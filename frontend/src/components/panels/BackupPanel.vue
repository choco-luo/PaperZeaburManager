<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Download, Trash2, Plus, Loader2, HardDrive } from 'lucide-vue-next'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface Backup {
  name: string
  size: number
  createdAt: string
}

const backups = ref<Backup[]>([])
const loading = ref(false)
const creating = ref(false)
const deletingName = ref<string | null>(null)
const feedback = ref<{ type: 'ok' | 'err'; msg: string } | null>(null)

const token = () => localStorage.getItem('token') || ''

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('zh-TW', { hour12: false })
}

async function loadBackups() {
  loading.value = true
  feedback.value = null
  try {
    const res = await fetch(`${API_URL}/api/backups`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
    backups.value = await res.json()
  } catch {
    feedback.value = { type: 'err', msg: '無法載入備份清單' }
  } finally {
    loading.value = false
  }
}

async function createBackup() {
  creating.value = true
  feedback.value = null
  try {
    const res = await fetch(`${API_URL}/api/backups`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}` },
    })
    const data = await res.json()
    if (!res.ok) {
      feedback.value = { type: 'err', msg: data.error || '備份失敗' }
    } else {
      feedback.value = { type: 'ok', msg: `已建立：${data.name}` }
      await loadBackups()
    }
  } catch {
    feedback.value = { type: 'err', msg: '網路錯誤' }
  } finally {
    creating.value = false
  }
}

async function deleteBackup(name: string) {
  deletingName.value = name
  feedback.value = null
  try {
    const res = await fetch(`${API_URL}/api/backups/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token()}` },
    })
    const data = await res.json()
    if (!res.ok) {
      feedback.value = { type: 'err', msg: data.error || '刪除失敗' }
    } else {
      await loadBackups()
    }
  } catch {
    feedback.value = { type: 'err', msg: '網路錯誤' }
  } finally {
    deletingName.value = null
  }
}

function downloadBackup(name: string) {
  const url = `${API_URL}/api/backups/${encodeURIComponent(name)}`
  const a = document.createElement('a')
  a.href = url
  a.download = name
  // 需要帶 token；用帶 Authorization header 的 fetch + blob 下載
  fetch(url, { headers: { Authorization: `Bearer ${token()}` } })
    .then((res) => res.blob())
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob)
      a.href = blobUrl
      a.click()
      URL.revokeObjectURL(blobUrl)
    })
    .catch(() => {
      feedback.value = { type: 'err', msg: '下載失敗' }
    })
}

onMounted(() => loadBackups())
</script>

<template>
  <div class="h-full flex flex-col p-6 overflow-hidden">

    <!-- 頂部工具列 -->
    <div class="flex items-center justify-between mb-4 shrink-0">
      <h2 class="text-base font-semibold" style="color: #4F5158;">備份管理</h2>
      <button
        @click="createBackup"
        :disabled="creating"
        class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
        style="background: #4F5158; color: #F8F9F9;"
      >
        <Loader2 v-if="creating" :size="14" class="animate-spin" />
        <Plus v-else :size="14" />
        <span>{{ creating ? '備份中...' : '建立備份' }}</span>
      </button>
    </div>

    <!-- 回饋訊息 -->
    <div
      v-if="feedback"
      class="mb-4 px-4 py-3 rounded-xl text-sm shrink-0"
      :style="feedback.type === 'ok'
        ? 'background: #d1f7e0; color: #2f9e44; border: 1px solid #51cf66;'
        : 'background: #ffe0e0; color: #c92a2a; border: 1px solid #ff6b6b;'"
    >
      {{ feedback.msg }}
    </div>

    <!-- 載入中 -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <Loader2 :size="24" class="animate-spin" style="color: #B6C8CF;" />
    </div>

    <!-- 空狀態 -->
    <div
      v-else-if="backups.length === 0"
      class="flex-1 flex flex-col items-center justify-center gap-3"
    >
      <HardDrive :size="40" style="color: #B6C8CF;" />
      <p class="text-sm" style="color: #7B8791;">尚無備份</p>
    </div>

    <!-- 備份清單 -->
    <div v-else class="flex-1 overflow-y-auto flex flex-col gap-2">
      <div
        v-for="backup in backups"
        :key="backup.name"
        class="flex items-center gap-4 px-4 py-3 rounded-xl"
        style="border: 1px solid #DEE3E2; background: #ffffff;"
      >
        <HardDrive :size="18" style="color: #7B8791; shrink: 0;" />

        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate" style="color: #4F5158;">{{ backup.name }}</p>
          <p class="text-xs mt-0.5" style="color: #7B8791;">
            {{ formatBytes(backup.size) }} · {{ formatDate(backup.createdAt) }}
          </p>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button
            @click="downloadBackup(backup.name)"
            class="p-2 rounded-lg transition-all hover:opacity-70"
            style="color: #4F5158;"
            title="下載"
          >
            <Download :size="16" />
          </button>
          <button
            @click="deleteBackup(backup.name)"
            :disabled="deletingName === backup.name"
            class="p-2 rounded-lg transition-all hover:opacity-70 disabled:opacity-40"
            style="color: #c92a2a;"
            title="刪除"
          >
            <Loader2 v-if="deletingName === backup.name" :size="16" class="animate-spin" />
            <Trash2 v-else :size="16" />
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
