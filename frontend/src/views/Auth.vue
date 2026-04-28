<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
      <!-- Header -->
      <div class="bg-indigo-600 px-8 py-6 text-center">
        <div class="text-4xl mb-2">⏱</div>
        <h1 class="text-white text-2xl font-bold">FlexTime Manager</h1>
        <p class="text-indigo-200 text-sm mt-1">Gestion du temps de travail</p>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-gray-200">
        <button
          @click="tab = 'login'"
          class="flex-1 py-3 text-sm font-semibold transition-colors"
          :class="tab === 'login'
            ? 'text-indigo-600 border-b-2 border-indigo-600'
            : 'text-gray-500 hover:text-gray-700'"
        >
          Connexion
        </button>
        <button
          @click="tab = 'register'"
          class="flex-1 py-3 text-sm font-semibold transition-colors"
          :class="tab === 'register'
            ? 'text-indigo-600 border-b-2 border-indigo-600'
            : 'text-gray-500 hover:text-gray-700'"
        >
          Inscription
        </button>
      </div>

      <div class="px-8 py-6">
        <!-- Error message -->
        <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {{ error }}
        </div>

        <!-- Login Form -->
        <form v-if="tab === 'login'" @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Adresse e-mail</label>
            <input
              v-model="loginForm.email"
              type="email"
              required
              placeholder="vous@exemple.fr"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              v-model="loginForm.password"
              type="password"
              required
              placeholder="••••••••"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
          >
            {{ loading ? 'Connexion...' : 'Se connecter' }}
          </button>
        </form>

        <!-- Register Form -->
        <form v-else @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Adresse e-mail</label>
            <input
              v-model="registerForm.email"
              type="email"
              required
              placeholder="vous@exemple.fr"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              v-model="registerForm.password"
              type="password"
              required
              placeholder="••••••••"
              minlength="6"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
            <input
              v-model="registerForm.confirmPassword"
              type="password"
              required
              placeholder="••••••••"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
          >
            {{ loading ? 'Inscription...' : "S'inscrire" }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const tab = ref('login')
const loading = ref(false)
const error = ref('')

const loginForm = reactive({ email: '', password: '' })
const registerForm = reactive({ email: '', password: '', confirmPassword: '' })

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const res = await axios.post('/api/auth/login', {
      email: loginForm.email,
      password: loginForm.password
    })
    auth.setAuth(res.data.token, res.data.user)
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.error || 'Identifiants incorrects'
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  error.value = ''
  if (registerForm.password !== registerForm.confirmPassword) {
    error.value = 'Les mots de passe ne correspondent pas'
    return
  }
  loading.value = true
  try {
    const res = await axios.post('/api/auth/register', {
      email: registerForm.email,
      password: registerForm.password
    })
    auth.setAuth(res.data.token, res.data.user)
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.error || "Erreur lors de l'inscription"
  } finally {
    loading.value = false
  }
}
</script>
