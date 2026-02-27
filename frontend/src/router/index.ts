import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import Terminal from '@/views/Terminal.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: Login },
    {
      path: '/terminal',
      component: Terminal,
      meta: { requiresAuth: true }
    },
  ]
})

// 路由守衛
router.beforeEach((to, _, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router