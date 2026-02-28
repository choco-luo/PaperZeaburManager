<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = '請輸入帳號和密碼'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value,
        password: password.value
      })
    })

    const data = await res.json()

    if (!res.ok) {
      error.value = data.error || '登入失敗'
      return
    }

    localStorage.setItem('token', data.token)
    router.push('/dashboard')
  } catch (e) {
    error.value = '無法連線到伺服器'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-screen h-screen flex items-center justify-center" style="background: #141517;">
    <div class="w-80 rounded-lg p-8" style="background: #1a1b1e; border: 1px solid #2e2f33;">
      <h1 class="text-white text-xl font-bold mb-6 text-center">PZM 後台登入</h1>

      <div class="flex flex-col gap-4">
        <input
          v-model="username"
          type="text"
          placeholder="帳號"
          class="rounded px-3 py-2 text-sm outline-none"
          style="background: #25262b; border: 1px solid #2e2f33; color: #d4d4d4;"
          @keyup.enter="handleLogin"
        />
        <input
          v-model="password"
          type="password"
          placeholder="密碼"
          class="rounded px-3 py-2 text-sm outline-none"
          style="background: #25262b; border: 1px solid #2e2f33; color: #d4d4d4;"
          @keyup.enter="handleLogin"
        />

        <p v-if="error" class="text-sm text-center" style="color: #ff6b6b;">{{ error }}</p>

        <button
          @click="handleLogin"
          :disabled="loading"
          class="rounded py-2 text-sm font-medium text-white transition-opacity"
          style="background: #5c7cfa;"
          :style="{ opacity: loading ? '0.6' : '1' }"
        >
          {{ loading ? '登入中...' : '登入' }}
        </button>
      </div>
    </div>
  </div>
</template>