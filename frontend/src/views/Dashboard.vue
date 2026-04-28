<template>
  <div class="max-w-lg mx-auto px-4 py-6 space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Bonjour 👋</h1>
        <p class="text-gray-500 text-sm">{{ todayLabel }}</p>
      </div>
      <div class="text-right">
        <div class="text-xs text-gray-400">Solde cumulé</div>
        <div
          class="text-sm font-semibold"
          :class="entries.cumulativeBalance >= 0 ? 'text-green-600' : 'text-red-500'"
        >
          {{ formatBalance(entries.cumulativeBalance) }}
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-if="fetchError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
      {{ fetchError }}
    </div>

    <!-- Action Button Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
      <p class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Action suivante</p>
      <button
        @click="handleAction"
        :disabled="isFinished || entries.loading"
        :class="actionButtonClass"
        class="w-full py-5 rounded-xl text-white text-lg font-bold shadow-md transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span v-if="entries.loading">Chargement...</span>
        <span v-else>{{ actionLabel }}</span>
      </button>

      <!-- Current status chips -->
      <div v-if="entry" class="mt-4 flex flex-wrap justify-center gap-2">
        <StatusChip v-if="entry.start_time" icon="🟢" label="Arrivée" :time="entry.start_time" />
        <StatusChip v-if="entry.lunch_start" icon="🍽️" label="Début pause" :time="entry.lunch_start" />
        <StatusChip v-if="entry.lunch_end" icon="▶️" label="Reprise" :time="entry.lunch_end" />
        <StatusChip v-if="entry.end_time" icon="🔴" label="Départ" :time="entry.end_time" />
      </div>
    </div>

    <!-- Progress Card -->
    <div v-if="entry?.start_time" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div class="flex items-center justify-between mb-3">
        <p class="text-sm font-semibold text-gray-700">Progression</p>
        <p class="text-sm text-gray-500">{{ workedLabel }} / {{ targetLabel }}</p>
      </div>
      <div class="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          class="h-3 rounded-full transition-all duration-500"
          :class="progressPercent >= 100 ? 'bg-green-500' : 'bg-indigo-500'"
          :style="{ width: Math.min(progressPercent, 100) + '%' }"
        />
      </div>
      <p class="text-xs text-gray-400 mt-1.5 text-right">{{ Math.round(progressPercent) }}%</p>
    </div>

    <!-- Estimation Card -->
    <div v-if="entry?.start_time && !entry?.end_time" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <p class="text-sm font-semibold text-gray-700 mb-3">⏰ Estimation</p>
      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-500">Débauche estimée</span>
          <span class="text-sm font-bold text-indigo-700">{{ estimatedEnd }}</span>
        </div>
        <div v-if="lissageAdjustment !== 0" class="flex justify-between items-center">
          <span class="text-sm text-gray-500">Objectif ajusté (lissage)</span>
          <span class="text-sm font-medium" :class="lissageAdjustment > 0 ? 'text-orange-500' : 'text-blue-500'">
            {{ lissageAdjustment > 0 ? '+' : '' }}{{ lissageAdjustment }} min
          </span>
        </div>
      </div>
    </div>

    <!-- Lissage Indicator -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <p class="text-sm font-semibold text-gray-700 mb-3">📊 Lissage</p>
      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-500">Solde cumulé</span>
          <span
            class="text-sm font-semibold"
            :class="entries.cumulativeBalance >= 0 ? 'text-green-600' : 'text-red-500'"
          >
            {{ formatBalance(entries.cumulativeBalance) }}
          </span>
        </div>
        <div v-if="settingsStore.settings.stagger_days > 0" class="flex justify-between items-center">
          <span class="text-sm text-gray-500">Ajustement quotidien</span>
          <span class="text-sm font-medium text-gray-700">
            {{ lissageAdjustment > 0 ? '+' : '' }}{{ lissageAdjustment }} min/jour
            sur {{ settingsStore.settings.stagger_days }} j
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useEntriesStore } from '../stores/entries'
import { useSettingsStore } from '../stores/settings'
import StatusChip from '../components/StatusChip.vue'

const entries = useEntriesStore()
const settingsStore = useSettingsStore()
const fetchError = ref('')
let ticker = null

onMounted(async () => {
  try {
    await Promise.all([
      entries.fetchToday(),
      settingsStore.fetchSettings(),
      fetchCurrentMonth()
    ])
  } catch (e) {
    fetchError.value = "Impossible de charger les données"
  }
  ticker = setInterval(() => {}, 60000)
})

onUnmounted(() => clearInterval(ticker))

async function fetchCurrentMonth() {
  const now = new Date()
  await entries.fetchMonth(now.getFullYear(), now.getMonth() + 1)
}

const entry = computed(() => entries.todayEntry)
const settings = computed(() => settingsStore.settings)

const todayLabel = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
})

const isFinished = computed(() => !!entry.value?.end_time)

const actionLabel = computed(() => {
  if (!entry.value) return "Pointer l'arrivée"
  if (!entry.value.start_time) return "Pointer l'arrivée"
  if (!entry.value.lunch_start) return 'Début de pause'
  if (!entry.value.lunch_end) return 'Reprise du travail'
  if (!entry.value.end_time) return 'Débauche'
  return 'Journée terminée ✓'
})

const actionButtonClass = computed(() => {
  if (!entry.value || !entry.value.start_time) return 'bg-green-500 hover:bg-green-600'
  if (!entry.value.lunch_start) return 'bg-orange-500 hover:bg-orange-600'
  if (!entry.value.lunch_end) return 'bg-blue-500 hover:bg-blue-600'
  if (!entry.value.end_time) return 'bg-red-500 hover:bg-red-600'
  return 'bg-gray-400'
})

// Calculate lissage adjustment in minutes per day
const lissageAdjustment = computed(() => {
  const balance = entries.cumulativeBalance // in minutes
  const days = settings.value.stagger_days
  if (!days || days === 0) return 0
  return Math.round(-balance / days)
})

// Adjusted daily target accounting for lissage
const adjustedTarget = computed(() => {
  return settings.value.daily_target + lissageAdjustment.value
})

function parseTime(timeStr, baseDate) {
  if (!timeStr) return null
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date(baseDate)
  d.setHours(h, m, 0, 0)
  return d
}

function formatMinutes(totalMin) {
  const sign = totalMin < 0 ? '-' : ''
  const abs = Math.abs(Math.round(totalMin))
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `${sign}${h} h ${String(m).padStart(2, '0')} min`
}

function formatBalance(minutes) {
  return formatMinutes(minutes)
}

const now = computed(() => new Date())

const workedMinutes = computed(() => {
  if (!entry.value?.start_time) return 0
  const base = now.value
  const start = parseTime(entry.value.start_time, base)
  const end = entry.value.end_time ? parseTime(entry.value.end_time, base) : now.value

  let lunchMin = settings.value.default_break
  if (entry.value.lunch_start && entry.value.lunch_end) {
    const ls = parseTime(entry.value.lunch_start, base)
    const le = parseTime(entry.value.lunch_end, base)
    lunchMin = (le - ls) / 60000
  } else if (entry.value.lunch_start) {
    const ls = parseTime(entry.value.lunch_start, base)
    lunchMin = (now.value - ls) / 60000
  } else {
    lunchMin = 0
  }

  return Math.max(0, (end - start) / 60000 - lunchMin)
})

const progressPercent = computed(() => {
  if (!adjustedTarget.value) return 0
  return (workedMinutes.value / adjustedTarget.value) * 100
})

const workedLabel = computed(() => formatMinutes(workedMinutes.value))
const targetLabel = computed(() => {
  const h = Math.floor(adjustedTarget.value / 60)
  const m = adjustedTarget.value % 60
  return `${h} h ${String(m).padStart(2, '0')} min`
})

const estimatedEnd = computed(() => {
  if (!entry.value?.start_time) return '--:--'
  const base = new Date()
  const start = parseTime(entry.value.start_time, base)
  let breakMin = settings.value.default_break
  if (entry.value.lunch_start && entry.value.lunch_end) {
    const ls = parseTime(entry.value.lunch_start, base)
    const le = parseTime(entry.value.lunch_end, base)
    breakMin = (le - ls) / 60000
  }
  const endMs = start.getTime() + (adjustedTarget.value + breakMin) * 60000
  const endDate = new Date(endMs)
  return `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`
})

async function handleAction() {
  if (isFinished.value) return
  fetchError.value = ''
  try {
    await entries.doAction()
  } catch (e) {
    fetchError.value = "Erreur lors de l'action"
  }
}
</script>
