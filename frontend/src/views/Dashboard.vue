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

      <!-- Time picker (shown after clicking action button) -->
      <div v-if="showTimePicker" class="mb-4 space-y-3">
        <p class="text-sm text-gray-600 font-medium">{{ actionLabel }} — choisir l'heure :</p>
        <!-- Custom 24-hour picker: always HH (00-23) : MM (00-59) -->
        <div class="flex items-center justify-center gap-2">
          <select
            v-model="selectedHour"
            class="text-3xl font-bold border-2 border-indigo-300 rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 text-gray-800 bg-white text-center appearance-none w-24"
          >
            <option v-for="h in hours" :key="h" :value="h">{{ h }}</option>
          </select>
          <span class="text-3xl font-bold text-gray-600">:</span>
          <select
            v-model="selectedMinute"
            class="text-3xl font-bold border-2 border-indigo-300 rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 text-gray-800 bg-white text-center appearance-none w-24"
          >
            <option v-for="m in minutes" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        <div class="flex gap-3">
          <button
            @click="cancelAction"
            class="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all"
          >
            Annuler
          </button>
          <button
            @click="confirmAction"
            :disabled="entries.loading"
            :class="actionButtonClass"
            class="flex-1 py-3 rounded-xl text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span v-if="entries.loading">Chargement...</span>
            <span v-else>Confirmer</span>
          </button>
        </div>
      </div>

      <button
        v-else
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
const showTimePicker = ref(false)
const selectedHour = ref('00')
const selectedMinute = ref('00')

// 24-hour hour options (00-23) and minute options (00-59)
const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
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

function currentHHmm() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

async function handleAction() {
  if (isFinished.value) return
  // Pre-fill dropdowns with current time
  const [h, m] = currentHHmm().split(':')
  selectedHour.value = h
  selectedMinute.value = m
  showTimePicker.value = true
}

function cancelAction() {
  showTimePicker.value = false
}

async function confirmAction() {
  showTimePicker.value = false
  fetchError.value = ''
  try {
    await entries.doAction(`${selectedHour.value}:${selectedMinute.value}`)
  } catch (e) {
    fetchError.value = "Erreur lors de l'action"
  }
}
</script>
