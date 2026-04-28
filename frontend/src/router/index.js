import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Auth from '../views/Auth.vue'
import Dashboard from '../views/Dashboard.vue'
import Statistics from '../views/Statistics.vue'
import Settings from '../views/Settings.vue'

const routes = [
  { path: '/auth', component: Auth, meta: { public: true } },
  { path: '/', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/statistics', component: Statistics, meta: { requiresAuth: true } },
  { path: '/settings', component: Settings, meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.token) return '/auth'
  if (to.meta.public && auth.token) return '/'
})

export default router
