<template>
  <div class="max-w-lg mx-auto px-4 py-6 space-y-6">
    <h1 class="text-2xl font-bold text-gray-800">⚙️ Paramètres</h1>

    <!-- Success -->
    <div v-if="success" class="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
      ✅ Paramètres sauvegardés avec succès
    </div>
    <!-- Error -->
    <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
      {{ error }}
    </div>

    <!-- Time settings -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
      <h2 class="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-3">
        🕐 Temps de travail
      </h2>

      <!-- Daily target -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Objectif journalier
        </label>
        <div class="flex items-center gap-2">
          <div class="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <input
              v-model.number="form.targetHours"
              type="number"
              min="0"
              max="23"
              class="w-14 px-2 py-2.5 text-center focus:outline-none text-sm"
            />
            <span class="text-gray-400 text-sm px-1">h</span>
            <input
              v-model.number="form.targetMinutes"
              type="number"
              min="0"
              max="59"
              class="w-14 px-2 py-2.5 text-center focus:outline-none text-sm"
            />
            <span class="text-gray-400 text-sm px-2">min</span>
          </div>
        </div>
        <p class="text-xs text-gray-400 mt-1">= {{ form.targetHours * 60 + form.targetMinutes }} minutes par jour</p>
      </div>

      <!-- Default break -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Durée de pause par défaut
        </label>
        <div class="flex items-center gap-2">
          <input
            v-model.number="form.default_break"
            type="number"
            min="0"
            max="240"
            class="w-24 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <span class="text-sm text-gray-500">minutes</span>
        </div>
        <p class="text-xs text-gray-400 mt-1">Utilisée quand la pause déjeuner n'est pas pointée</p>
      </div>
    </div>

    <!-- Lissage settings -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
      <h2 class="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-3">
        📈 Lissage du solde
      </h2>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Nombre de jours de lissage
        </label>
        <div class="flex items-center gap-2">
          <input
            v-model.number="form.stagger_days"
            type="number"
            min="0"
            max="365"
            class="w-24 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <span class="text-sm text-gray-500">jours</span>
        </div>
        <p class="text-xs text-gray-400 mt-1">
          Répartit le solde négatif/positif sur N jours. 0 = désactivé.
        </p>
      </div>
    </div>

    <!-- Password change -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
      <h2 class="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-3">
        🔐 Changer le mot de passe
      </h2>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
        <input
          v-model="form.newPassword"
          type="password"
          placeholder="Laisser vide pour ne pas changer"
          class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
        <input
          v-model="form.confirmPassword"
          type="password"
          placeholder="••••••••"
          class="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
      </div>
    </div>

    <!-- Save button -->
    <button
      @click="handleSave"
      :disabled="settingsStore.loading"
      class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
    >
      {{ settingsStore.loading ? 'Sauvegarde...' : 'Sauvegarder les paramètres' }}
    </button>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useSettingsStore } from '../stores/settings'

const settingsStore = useSettingsStore()
const success = ref(false)
const error = ref('')

const form = reactive({
  targetHours: 8,
  targetMinutes: 0,
  default_break: 60,
  stagger_days: 30,
  newPassword: '',
  confirmPassword: ''
})

onMounted(async () => {
  await settingsStore.fetchSettings()
  syncFormFromStore()
})

function syncFormFromStore() {
  const s = settingsStore.settings
  form.targetHours = Math.floor(s.daily_target / 60)
  form.targetMinutes = s.daily_target % 60
  form.default_break = s.default_break
  form.stagger_days = s.stagger_days
}

watch(() => settingsStore.settings, syncFormFromStore)

async function handleSave() {
  error.value = ''
  success.value = false

  if (form.newPassword && form.newPassword !== form.confirmPassword) {
    error.value = 'Les mots de passe ne correspondent pas'
    return
  }

  const payload = {
    daily_target: form.targetHours * 60 + form.targetMinutes,
    default_break: form.default_break,
    stagger_days: form.stagger_days
  }

  if (form.newPassword) {
    payload.password = form.newPassword
  }

  try {
    await settingsStore.saveSettings(payload)
    form.newPassword = ''
    form.confirmPassword = ''
    success.value = true
    setTimeout(() => (success.value = false), 3000)
  } catch (e) {
    error.value = e.response?.data?.error || 'Erreur lors de la sauvegarde'
  }
}
</script>
