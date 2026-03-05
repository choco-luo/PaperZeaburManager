<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { AlertTriangle, Upload, CheckCircle, Loader2, Play } from 'lucide-vue-next'

const props = defineProps<{
  isServerRunning: boolean
}>()

const emit = defineEmits<{
  (e: 'switch-panel', panel: string): void
}>()

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

type UploadState = 'idle' | 'uploading' | 'done' | 'error'
const uploadState = ref<UploadState>('idle')

const isDragging = ref(false)
const progress = ref(0)
const uploadedBytes = ref(0)
const totalBytes = ref(0)
const isExtracting = ref(false)

// 已部署的 jar 清單（mount 時載入，上傳完後更新）
const jars = ref<string[]>([])
const selectedJar = ref('')
const jarLoading = ref(false)

const uploadError = ref('')
const startError = ref('')
const stoppingServer = ref(false)
const starting = ref(false)

const maxMemory = ref('2G')
const minMemory = ref('1G')

const token = () => localStorage.getItem('token') || ''

// ── 載入已部署 jar 清單 ──────────────────────────────
async function loadJars() {
  jarLoading.value = true
  try {
    const res = await fetch(`${API_URL}/api/server/jars`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
    const data = await res.json()
    jars.value = data.jars || []
    if (!selectedJar.value && jars.value.length > 0) {
      selectedJar.value = jars.value[0] ?? ''
    }
  } catch {
    // 靜默失敗，jar 清單維持空陣列
  } finally {
    jarLoading.value = false
  }
}

// ── 停止伺服器 ──────────────────────────────────────
async function stopServer() {
  stoppingServer.value = true
  try {
    await fetch(`${API_URL}/api/server/stop`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}` },
    })
  } catch {
    // ignore
  } finally {
    stoppingServer.value = false
  }
}

// ── 啟動伺服器 ──────────────────────────────────────
async function startServer() {
  startError.value = ''
  starting.value = true
  const body: Record<string, string> = {}
  if (selectedJar.value) body.jar = selectedJar.value
  body.maxMemory = maxMemory.value
  body.minMemory = minMemory.value
  try {
    const res = await fetch(`${API_URL}/api/server/start`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) {
      startError.value = data.error || '啟動失敗'
      return
    }
    emit('switch-panel', 'terminal')
  } catch {
    startError.value = '網路錯誤，無法啟動伺服器'
  } finally {
    starting.value = false
  }
}

// ── 上傳 ────────────────────────────────────────────
function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) handleFile(file)
}

function onFileInput(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) handleFile(file)
  // 重置 input，讓同一個檔案可以再次觸發
  ;(e.target as HTMLInputElement).value = ''
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function handleFile(file: File) {
  if (!file.name.endsWith('.zip')) {
    uploadError.value = '只接受 .zip 檔'
    uploadState.value = 'error'
    return
  }

  const formData = new FormData()
  formData.append('file', file)

  uploadState.value = 'uploading'
  progress.value = 0
  uploadedBytes.value = 0
  totalBytes.value = file.size
  isExtracting.value = false
  uploadError.value = ''

  const xhr = new XMLHttpRequest()

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      uploadedBytes.value = e.loaded
      totalBytes.value = e.total
      progress.value = Math.floor((e.loaded / e.total) * 100)
      if (progress.value >= 100) isExtracting.value = true
    }
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const data = JSON.parse(xhr.responseText)
        // 上傳完後更新 jar 清單
        jars.value = data.jars || []
        selectedJar.value = jars.value[0] || ''
        uploadState.value = 'done'
      } catch {
        uploadError.value = '回應解析失敗'
        uploadState.value = 'error'
      }
    } else {
      try {
        uploadError.value = JSON.parse(xhr.responseText).error || '上傳失敗'
      } catch {
        uploadError.value = `上傳失敗 (HTTP ${xhr.status})`
      }
      uploadState.value = 'error'
    }
  }

  xhr.onerror = () => {
    uploadError.value = '網路錯誤'
    uploadState.value = 'error'
  }

  xhr.open('POST', `${API_URL}/api/upload`)
  xhr.setRequestHeader('Authorization', `Bearer ${token()}`)
  xhr.send(formData)
}

function resetUpload() {
  uploadState.value = 'idle'
  uploadError.value = ''
  progress.value = 0
  isExtracting.value = false
}

onMounted(() => loadJars())
</script>

<template>
  <div class="h-full flex flex-col p-8 gap-6 overflow-y-auto">

    <!-- 伺服器執行中警告 -->
    <div
      v-if="isServerRunning"
      class="flex items-center justify-between px-5 py-4 rounded-xl shrink-0"
      style="background: #fff3cd; border: 1px solid #ffc107;"
    >
      <div class="flex items-center gap-3">
        <AlertTriangle :size="18" style="color: #856404;" />
        <span class="text-sm font-medium" style="color: #856404;">伺服器執行中，請先停止再上傳新版本</span>
      </div>
      <button
        @click="stopServer"
        :disabled="stoppingServer"
        class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
        style="background: #4F5158; color: #F8F9F9;"
      >
        <Loader2 v-if="stoppingServer" :size="14" class="animate-spin" />
        <span>{{ stoppingServer ? '停止中...' : '停止伺服器' }}</span>
      </button>
    </div>

    <!-- ── 已部署的 JAR（只要有 jar 且沒在上傳中就顯示）── -->
    <div
      v-if="jars.length > 0 && uploadState !== 'uploading'"
      class="rounded-2xl p-6 shrink-0"
      style="border: 1px solid #B6C8CF; background: #F8F9F9;"
    >
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-semibold" style="color: #4F5158;">已部署的伺服器</h2>
        <span
          v-if="uploadState === 'done'"
          class="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
          style="background: #d1f7e0; color: #2f9e44;"
        >
          <CheckCircle :size="12" />
          剛剛更新
        </span>
      </div>

      <div class="flex flex-col gap-3">
        <select
          v-model="selectedJar"
          class="w-full px-3 py-2 rounded-xl text-sm"
          style="background: #fff; border: 1px solid #B6C8CF; color: #4F5158;"
        >
          <option v-for="jar in jars" :key="jar" :value="jar">{{ jar }}</option>
        </select>

        <!-- 記憶體設定 -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 flex-1">
            <label class="text-xs shrink-0" style="color: #7B8791;">最大記憶體</label>
            <input
              v-model="maxMemory"
              type="text"
              placeholder="如: 2G 或 512M"
              class="flex-1 px-3 py-1.5 rounded-lg text-sm"
              style="background: #fff; border: 1px solid #B6C8CF; color: #4F5158;"
            />
          </div>
          <div class="flex items-center gap-2 flex-1">
            <label class="text-xs shrink-0" style="color: #7B8791;">最小記憶體</label>
            <input
              v-model="minMemory"
              type="text"
              placeholder="如: 1G 或 512M"
              class="flex-1 px-3 py-1.5 rounded-lg text-sm"
              style="background: #fff; border: 1px solid #B6C8CF; color: #4F5158;"
            />
          </div>
        </div>

        <button
          @click="startServer"
          :disabled="isServerRunning || starting"
          class="flex items-center justify-center gap-2 w-full px-5 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
          style="background: #4F5158; color: #F8F9F9;"
        >
          <Loader2 v-if="starting" :size="14" class="animate-spin" />
          <Play v-else :size="14" />
          <span>{{ starting ? '啟動中...' : '啟動伺服器' }}</span>
        </button>
      </div>

      <p v-if="startError" class="mt-3 text-xs" style="color: #c92a2a;">{{ startError }}</p>
    </div>

    <!-- jar 載入中佔位 -->
    <div
      v-else-if="jarLoading"
      class="flex items-center gap-2 text-sm shrink-0"
      style="color: #B6C8CF;"
    >
      <Loader2 :size="14" class="animate-spin" />
      <span>檢查已部署檔案...</span>
    </div>

    <!-- ── 上傳進度 ── -->
    <div
      v-if="uploadState === 'uploading'"
      class="flex-1 flex flex-col items-center justify-center gap-4"
    >
      <div class="w-full" style="max-width: 480px;">
        <div class="flex justify-between text-xs mb-2" style="color: #7B8791;">
          <span>{{ isExtracting ? '解壓中...' : `上傳中 ${progress}%` }}</span>
          <span>{{ formatBytes(uploadedBytes) }} / {{ formatBytes(totalBytes) }}</span>
        </div>
        <div class="w-full rounded-full overflow-hidden" style="height: 8px; background: #DEE3E2;">
          <div
            class="h-full rounded-full transition-all duration-200"
            style="background: #4F5158;"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
      </div>
      <div v-if="isExtracting" class="flex items-center gap-2 text-sm" style="color: #7B8791;">
        <Loader2 :size="16" class="animate-spin" />
        解壓中，請稍候...
      </div>
    </div>

    <!-- ── 上傳錯誤提示 ── -->
    <div
      v-if="uploadState === 'error'"
      class="flex items-center gap-3 px-5 py-4 rounded-xl shrink-0"
      style="background: #ffe0e0; border: 1px solid #ff6b6b;"
    >
      <AlertTriangle :size="18" style="color: #c92a2a;" />
      <span class="text-sm flex-1" style="color: #c92a2a;">{{ uploadError }}</span>
      <button
        @click="resetUpload"
        class="text-xs px-3 py-1 rounded-lg"
        style="background: #c92a2a; color: #fff;"
      >
        關閉
      </button>
    </div>

    <!-- ── 上傳區（上傳中時隱藏）── -->
    <div
      v-if="uploadState !== 'uploading'"
      class="flex flex-col gap-3 shrink-0"
    >
      <h2 class="text-sm font-semibold" style="color: #4F5158;">
        {{ jars.length > 0 ? '上傳新版本（覆蓋）' : '上傳伺服器包' }}
      </h2>
      <p class="text-xs" style="color: #7B8791;">
        上傳本機準備好的完整伺服器 .zip（含 .jar 與所有設定檔），解壓後覆蓋 /mc 目錄。
      </p>

      <label
        class="flex flex-col items-center justify-center gap-3 w-full rounded-2xl cursor-pointer transition-all"
        :class="isServerRunning ? 'opacity-40 pointer-events-none' : ''"
        style="height: 160px; border: 2px dashed #B6C8CF; background: #F8F9F9;"
        :style="isDragging ? 'border-color: #7B8791; background: #DEE3E2;' : ''"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
      >
        <Upload :size="32" style="color: #B6C8CF;" />
        <div class="text-center">
          <p class="text-sm font-medium" style="color: #4F5158;">拖曳 .zip 到這裡</p>
          <p class="text-xs mt-0.5" style="color: #7B8791;">或點擊選取檔案</p>
          <p class="text-xs mt-0.5" style="color: #7B8791;">(單次最大 5 GB，超過請分批上傳)</p>
        </div>
        <input type="file" accept=".zip" class="hidden" @change="onFileInput" />
      </label>
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
