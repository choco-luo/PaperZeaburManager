<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Folder, File, ChevronRight, Home } from 'lucide-vue-next'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface FileItem {
  name: string
  isDir: boolean
  size: number | null
}

const currentPath = ref('/')
const items = ref<FileItem[]>([])
const loading = ref(false)
const breadcrumbs = ref<string[]>([])

async function loadFiles(path: string) {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    console.log('token:', token)
    const res = await fetch(`${API_URL}/api/files?path=${encodeURIComponent(path)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    console.log('status:', res.status)
    const data = await res.json()
    console.log('data:', data)
    items.value = data.items
    currentPath.value = path
    breadcrumbs.value = path === '/' ? [] : path.split('/').filter(Boolean)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function navigateTo(dir: string) {
  const newPath = currentPath.value === '/'
    ? `/${dir}`
    : `${currentPath.value}/${dir}`
  loadFiles(newPath)
}

function navigateToCrumb(index: number) {
  if (index === -1) {
    loadFiles('/')
    return
  }
  const path = '/' + breadcrumbs.value.slice(0, index + 1).join('/')
  loadFiles(path)
}

function formatSize(size: number | null) {
  if (size === null) return ''
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

onMounted(() => loadFiles('/'))
</script>

<template>
  <div class="h-full flex flex-col p-6">
    <div class="flex items-center gap-2 mb-6">
      <button @click="navigateToCrumb(-1)" class="hover:opacity-70 transition-opacity">
        <Home :size="16" style="color: #7B8791;" />
      </button>
      <template v-for="(crumb, index) in breadcrumbs" :key="index">
        <ChevronRight :size="14" style="color: #B6C8CF;" />
        <button
          @click="navigateToCrumb(index)"
          class="text-sm hover:opacity-70 transition-opacity"
          style="color: #4F5158;"
        >
          {{ crumb }}
        </button>
      </template>
    </div>

    <!-- 載入中 -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <span class="text-sm" style="color: #B6C8CF;">載入中...</span>
    </div>

    <!-- 檔案列表 -->
    <div v-else class="flex flex-col gap-1 overflow-y-auto">
      <div
        v-for="item in items"
        :key="item.name"
        class="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors"
        style="border: 1px solid #DEE3E2;"
        :style="{ background: item.isDir ? '#F8F9F9' : '#ffffff' }"
        @click="item.isDir ? navigateTo(item.name) : null"
      >
        <Folder v-if="item.isDir" :size="18" style="color: #B6C8CF;" />
        <File v-else :size="18" style="color: #7B8791;" />
        <span class="flex-1 text-sm" style="color: #4F5158;">{{ item.name }}</span>
        <span v-if="!item.isDir" class="text-xs" style="color: #B6C8CF;">{{ formatSize(item.size) }}</span>
        <ChevronRight v-if="item.isDir" :size="14" style="color: #B6C8CF;" />
      </div>
    </div>
  </div>
</template>