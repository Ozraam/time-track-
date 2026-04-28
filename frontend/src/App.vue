<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Top navigation bar (desktop) -->
    <nav v-if="auth.token" class="hidden md:flex bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-6xl mx-auto px-4 w-full flex items-center justify-between h-16">
        <div class="flex items-center gap-2">
          <span class="text-2xl">⏱</span>
          <span class="font-bold text-gray-800 text-lg">FlexTime Manager</span>
        </div>
        <div class="flex items-center gap-1">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="$route.path === link.to
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-600 hover:bg-gray-100'"
          >
            <span>{{ link.icon }}</span>
            <span>{{ link.label }}</span>
          </RouterLink>
          <button
            @click="handleLogout"
            class="ml-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <span>🚪</span>
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </nav>

    <!-- Main content -->
    <main :class="auth.token ? 'pb-20 md:pb-0' : ''">
      <RouterView />
    </main>

    <!-- Bottom navigation bar (mobile) -->
    <nav
      v-if="auth.token"
      class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50"
    >
      <div class="flex">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="flex-1 flex flex-col items-center py-2 px-1 text-xs font-medium transition-colors"
          :class="$route.path === link.to
            ? 'text-indigo-700'
            : 'text-gray-500'"
        >
          <span class="text-xl mb-0.5">{{ link.icon }}</span>
          <span>{{ link.label }}</span>
        </RouterLink>
        <button
          @click="handleLogout"
          class="flex-1 flex flex-col items-center py-2 px-1 text-xs font-medium text-red-500 transition-colors"
        >
          <span class="text-xl mb-0.5">🚪</span>
          <span>Quitter</span>
        </button>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()
const router = useRouter()

const navLinks = [
  { to: '/', icon: '🏠', label: 'Accueil' },
  { to: '/statistics', icon: '📊', label: 'Statistiques' },
  { to: '/settings', icon: '⚙️', label: 'Paramètres' }
]

onMounted(() => {
  auth.initAxios()
})

function handleLogout() {
  auth.logout()
  router.push('/auth')
}
</script>
