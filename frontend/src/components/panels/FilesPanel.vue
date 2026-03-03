<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Folder, File as FileIcon, ChevronRight, Home, Trash2, Edit2, Download, Upload, FolderPlus, Save, X, Loader2 } from 'lucide-vue-next'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const token = () => localStorage.getItem('token') || ''

interface FileItem {
  name: string
  isDir: boolean
  size: number | null
}

const currentPath = ref('/')
const items = ref<FileItem[]>([])
const loading = ref(false)
const breadcrumbs = ref<string[]>([])

// 操作狀態
const feedback = ref<{ type: 'ok' | 'err'; msg: string } | null>(null)
const actionLoading = ref(false)

// 編輯器狀態
const isEditorOpen = ref(false)
const editingFilePath = ref('')
const editingFileContent = ref('')
const editorLoading = ref(false)
const editorSaving = ref(false)

async function loadFiles(path: string) {
  loading.value = true
  feedback.value = null
  try {
    const res = await fetch(`${API_URL}/api/files?path=${encodeURIComponent(path)}`, {
      headers: { Authorization: `Bearer ${token()}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '載入失敗')
    items.value = data.items
    currentPath.value = path
    breadcrumbs.value = path === '/' ? [] : path.split('/').filter(Boolean)
  } catch (e: any) {
    showFeedback('err', e.message)
  } finally {
    loading.value = false
  }
}

function showFeedback(type: 'ok' | 'err', msg: string) {
  feedback.value = { type, msg }
  setTimeout(() => { if (feedback.value?.msg === msg) feedback.value = null }, 3000)
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

function getFullPath(name: string) {
  return currentPath.value === '/' ? `/${name}` : `${currentPath.value}/${name}`
}

// 檔案操作
async function createFolder() {
  const name = prompt('請輸入新資料夾名稱：')
  if (!name) return
  actionLoading.value = true
  try {
    const res = await fetch(`${API_URL}/api/file/folder`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path: currentPath.value, name })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '建立失敗')
    showFeedback('ok', '資料夾已建立')
    loadFiles(currentPath.value)
  } catch (e: any) {
    showFeedback('err', e.message)
  } finally {
    actionLoading.value = false
  }
}

async function renameItem(item: FileItem) {
  const newName = prompt(`將 ${item.name} 重新命名為：`, item.name)
  if (!newName || newName === item.name) return
  actionLoading.value = true
  try {
    const res = await fetch(`${API_URL}/api/file/rename`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path: getFullPath(item.name), newName })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '重新命名失敗')
    showFeedback('ok', '已重新命名')
    loadFiles(currentPath.value)
  } catch (e: any) {
    showFeedback('err', e.message)
  } finally {
    actionLoading.value = false
  }
}

async function deleteItem(item: FileItem) {
  if (!confirm(`確定要刪除 ${item.isDir ? '資料夾' : '檔案'} ${item.name} 嗎？\n此操作無法復原！`)) return
  actionLoading.value = true
  try {
    const res = await fetch(`${API_URL}/api/file?path=${encodeURIComponent(getFullPath(item.name))}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token()}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '刪除失敗')
    showFeedback('ok', '已刪除')
    loadFiles(currentPath.value)
  } catch (e: any) {
    showFeedback('err', e.message)
  } finally {
    actionLoading.value = false
  }
}

function downloadFile(item: FileItem) {
  const url = `${API_URL}/api/file/download?path=${encodeURIComponent(getFullPath(item.name))}`
  fetch(url, { headers: { Authorization: `Bearer ${token()}` } })
    .then((res) => res.blob())
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = item.name
      a.click()
      URL.revokeObjectURL(blobUrl)
    })
    .catch(() => {
      showFeedback('err', '下載失敗')
    })
}

function onUploadClick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  const formData = new FormData()
  formData.append('file', file)
  
  actionLoading.value = true
  const xhr = new XMLHttpRequest()
  xhr.open('POST', `${API_URL}/api/file/upload?path=${encodeURIComponent(currentPath.value)}`)
  xhr.setRequestHeader('Authorization', `Bearer ${token()}`)
  xhr.onload = () => {
    actionLoading.value = false
    if (xhr.status >= 200 && xhr.status < 300) {
      showFeedback('ok', '上傳成功')
      loadFiles(currentPath.value)
    } else {
      try {
        const res = JSON.parse(xhr.responseText)
        showFeedback('err', res.error || '上傳失敗')
      } catch {
        showFeedback('err', '上傳失敗')
      }
    }
  }
  xhr.onerror = () => {
    actionLoading.value = false
    showFeedback('err', '上傳發生網路錯誤')
  }
  xhr.send(formData)
  
  ;(e.target as HTMLInputElement).value = ''
}

// 檔案編輯
async function openFile(item: FileItem) {
  if (item.isDir) {
    navigateTo(item.name)
    return
  }
  
  // 檢查副檔名是否適合編輯，不適合的就跳過或直接讓使用者下載
  const ext = item.name.split('.').pop()?.toLowerCase() || ''
  const binaryExts = ['jar', 'zip', 'gz', 'tar', 'sqlite', 'db', 'png', 'jpg', 'ico']
  if (binaryExts.includes(ext)) {
    showFeedback('err', '二進位檔案不支援線上編輯')
    return
  }

  editingFilePath.value = getFullPath(item.name)
  isEditorOpen.value = true
  editorLoading.value = true
  editingFileContent.value = ''
  
  try {
    const res = await fetch(`${API_URL}/api/file/content?path=${encodeURIComponent(editingFilePath.value)}`, {
      headers: { Authorization: `Bearer ${token()}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '無法讀取檔案內容')
    editingFileContent.value = data.content
  } catch (e: any) {
    isEditorOpen.value = false
    showFeedback('err', e.message)
  } finally {
    editorLoading.value = false
  }
}

async function saveFile() {
  editorSaving.value = true
  try {
    const res = await fetch(`${API_URL}/api/file/content`, {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${token()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path: editingFilePath.value, content: editingFileContent.value })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '儲存失敗')
    showFeedback('ok', '檔案已儲存')
    isEditorOpen.value = false
    loadFiles(currentPath.value)
  } catch (e: any) {
    showFeedback('err', e.message)
  } finally {
    editorSaving.value = false
  }
}

onMounted(() => loadFiles('/'))
</script>

<template>
  <div class="h-full flex flex-col p-6 relative">
    <!-- 頂部工具列與路徑 -->
    <div class="flex flex-wrap items-center justify-between gap-4 mb-4 shrink-0">
      <div class="flex items-center gap-2 overflow-x-auto p-1">
        <button @click="navigateToCrumb(-1)" class="hover:opacity-70 transition-opacity whitespace-nowrap">
          <Home :size="16" style="color: #7B8791;" />
        </button>
        <template v-for="(crumb, index) in breadcrumbs" :key="index">
          <ChevronRight :size="14" style="color: #B6C8CF; flex-shrink: 0;" />
          <button
            @click="navigateToCrumb(index)"
            class="text-sm hover:opacity-70 transition-opacity whitespace-nowrap"
            style="color: #4F5158;"
          >
            {{ crumb }}
          </button>
        </template>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="createFolder"
          :disabled="actionLoading"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-gray-100 disabled:opacity-50"
          style="color: #4F5158; border: 1px solid #DEE3E2;"
        >
          <FolderPlus :size="14" />
          <span>新資料夾</span>
        </button>
        <label
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:opacity-90 cursor-pointer disabled:opacity-50"
          style="background: #4F5158; color: #F8F9F9;"
        >
          <Upload :size="14" />
          <span>上傳檔案</span>
          <input type="file" class="hidden" @change="onUploadClick" :disabled="actionLoading" />
        </label>
      </div>
    </div>

    <!-- 提示訊息 -->
    <div
      v-if="feedback"
      class="mb-4 px-4 py-2 rounded-xl text-sm shrink-0"
      :style="feedback.type === 'ok'
        ? 'background: #d1f7e0; color: #2f9e44; border: 1px solid #51cf66;'
        : 'background: #ffe0e0; color: #c92a2a; border: 1px solid #ff6b6b;'"
    >
      {{ feedback.msg }}
    </div>

    <!-- 載入中 -->
    <div v-if="loading || actionLoading" class="flex-1 flex flex-col items-center justify-center gap-2">
      <Loader2 :size="24" class="animate-spin" style="color: #B6C8CF;" />
      <span class="text-sm" style="color: #B6C8CF;">載入中...</span>
    </div>

    <!-- 檔案列表 -->
    <div v-else-if="items.length > 0" class="flex flex-col gap-1 overflow-y-auto pb-4">
      <div
        v-for="item in items"
        :key="item.name"
        class="group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors"
        style="border: 1px solid #DEE3E2;"
        :style="{ background: item.isDir ? '#F8F9F9' : '#ffffff' }"
      >
        <div class="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" @click="openFile(item)">
          <Folder v-if="item.isDir" :size="18" style="color: #B6C8CF; shrink: 0;" />
          <FileIcon v-else :size="18" style="color: #7B8791; shrink: 0;" />
          <span class="flex-1 text-sm truncate" style="color: #4F5158;" :title="item.name">{{ item.name }}</span>
          <span v-if="!item.isDir" class="text-xs shrink-0" style="color: #B6C8CF;">{{ formatSize(item.size) }}</span>
        </div>

        <!-- 檔案操作選單 -->
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button v-if="!item.isDir" @click="downloadFile(item)" class="p-1.5 rounded hover:bg-gray-200" title="下載" style="color: #4F5158;">
            <Download :size="14" />
          </button>
          <button @click="renameItem(item)" class="p-1.5 rounded hover:bg-gray-200" title="重新命名" style="color: #4F5158;">
            <Edit2 :size="14" />
          </button>
          <button @click="deleteItem(item)" class="p-1.5 rounded hover:bg-red-100" title="刪除" style="color: #c92a2a;">
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
    </div>
    
    <!-- 空資料夾 -->
    <div v-else class="flex-1 flex flex-col items-center justify-center gap-2">
      <Folder :size="48" style="color: #DEE3E2;" />
      <span class="text-sm" style="color: #B6C8CF;">空資料夾</span>
    </div>

    <!-- 編輯器 Overlay -->
    <div v-if="isEditorOpen" class="absolute inset-0 bg-white z-10 flex flex-col p-4 rounded-xl shadow-lg border border-gray-200" style="margin: 10px;">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold truncate flex-1 pr-4" style="color: #4F5158;">{{ editingFilePath }}</h3>
        <div class="flex items-center gap-2">
          <button
            @click="saveFile"
            :disabled="editorSaving || editorLoading"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            style="background: #2f9e44; color: #fff;"
          >
            <Loader2 v-if="editorSaving" :size="14" class="animate-spin" />
            <Save v-else :size="14" />
            <span>儲存</span>
          </button>
          <button
            @click="isEditorOpen = false"
            class="p-1.5 rounded-lg hover:bg-gray-100"
            style="color: #4F5158;"
          >
            <X :size="16" />
          </button>
        </div>
      </div>
      
      <div v-if="editorLoading" class="flex-1 flex items-center justify-center">
        <Loader2 :size="24" class="animate-spin" style="color: #B6C8CF;" />
      </div>
      
      <textarea
        v-else
        v-model="editingFileContent"
        class="flex-1 w-full p-3 rounded-lg text-sm font-mono resize-none focus:outline-none"
        style="background: #4F5158; border: 1px solid #DEE3E2; color: #FFFFFF;"
        spellcheck="false"
      ></textarea>
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
/* 自訂捲軸 */
textarea::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
textarea::-webkit-scrollbar-track {
  background: transparent;
}
textarea::-webkit-scrollbar-thumb {
  background: #DEE3E2;
  border-radius: 4px;
}
textarea::-webkit-scrollbar-thumb:hover {
  background: #B6C8CF;
}
</style>