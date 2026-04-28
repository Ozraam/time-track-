<template>
  <div class="max-w-4xl mx-auto px-4 py-6 space-y-6">
    <h1 class="text-2xl font-bold text-gray-800">📊 Statistiques</h1>

    <!-- Month selector -->
    <div class="flex items-center gap-3">
      <button
        @click="prevMonth"
        class="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
      >
        ◀
      </button>
      <span class="font-semibold text-gray-700 capitalize min-w-[140px] text-center">
        {{ monthLabel }}
      </span>
      <button
        @click="nextMonth"
        :disabled="isCurrentMonth"
        class="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-40"
      >
        ▶
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12 text-gray-400">Chargement...</div>

    <template v-else>
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Jours travaillés" :value="String(workedDays)" />
        <SummaryCard label="Heures totales" :value="formatH(totalWorked)" />
        <SummaryCard label="Objectif total" :value="formatH(totalTarget)" />
        <SummaryCard
          label="Solde du mois"
          :value="formatBalance(totalWorked - totalTarget)"
          :positive="totalWorked >= totalTarget"
        />
      </div>

      <!-- Line Chart -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 class="text-sm font-semibold text-gray-700 mb-4">Heures travaillées par jour</h2>
        <div class="h-56">
          <Line :data="lineChartData" :options="lineChartOptions" />
        </div>
      </div>

      <!-- Bar Chart -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 class="text-sm font-semibold text-gray-700 mb-4">Comparaison journalière</h2>
        <div class="h-56">
          <Bar :data="barChartData" :options="barChartOptions" />
        </div>
      </div>

      <!-- Calendar View -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 class="text-sm font-semibold text-gray-700 mb-4">Calendrier du mois</h2>
        <div class="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400 mb-2">
          <div v-for="d in ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']" :key="d">{{ d }}</div>
        </div>
        <div class="grid grid-cols-7 gap-1">
          <!-- Offset cells for first day of month -->
          <div v-for="n in firstDayOffset" :key="'off-' + n" />
          <!-- Day cells -->
          <div
            v-for="day in daysInMonth"
            :key="day"
            class="aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium cursor-default"
            :class="calendarCellClass(day)"
          >
            <span>{{ day }}</span>
            <span v-if="getDayBalance(day) !== null" class="text-[9px] leading-none mt-0.5">
              {{ getDayBalanceLabel(day) }}
            </span>
          </div>
        </div>
        <!-- Legend -->
        <div class="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-green-200 inline-block" />Objectif atteint</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-blue-200 inline-block" />Au-dessus</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-red-200 inline-block" />En dessous</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-gray-100 inline-block" />Sans données</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Line, Bar } from 'vue-chartjs'
import { useEntriesStore } from '../stores/entries'
import { useSettingsStore } from '../stores/settings'
import SummaryCard from '../components/SummaryCard.vue'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

const entries = useEntriesStore()
const settingsStore = useSettingsStore()

const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth() + 1)
const loading = ref(false)

const isCurrentMonth = computed(
  () => currentYear.value === today.getFullYear() && currentMonth.value === today.getMonth() + 1
)

const monthLabel = computed(() => {
  const d = new Date(currentYear.value, currentMonth.value - 1, 1)
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
})

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 0).getDate()
})

// Monday=0 offset (ISO)
const firstDayOffset = computed(() => {
  const d = new Date(currentYear.value, currentMonth.value - 1, 1)
  return (d.getDay() + 6) % 7
})

async function loadData() {
  loading.value = true
  try {
    await Promise.all([
      entries.fetchMonth(currentYear.value, currentMonth.value),
      settingsStore.fetchSettings()
    ])
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
watch([currentYear, currentMonth], loadData)

function prevMonth() {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (isCurrentMonth.value) return
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

const dailyTarget = computed(() => settingsStore.settings.daily_target)

// Map day number → entry
const entryByDay = computed(() => {
  const map = {}
  for (const e of entries.monthEntries) {
    const d = new Date(e.day_date + 'T00:00:00')
    map[d.getDate()] = e
  }
  return map
})

function getWorkedMinutes(entry) {
  if (!entry?.start_time || !entry?.end_time) return null
  const base = new Date()
  const [sh, sm] = entry.start_time.split(':').map(Number)
  const [eh, em] = entry.end_time.split(':').map(Number)
  let worked = (eh * 60 + em) - (sh * 60 + sm)
  if (entry.lunch_start && entry.lunch_end) {
    const [lsh, lsm] = entry.lunch_start.split(':').map(Number)
    const [leh, lem] = entry.lunch_end.split(':').map(Number)
    worked -= (leh * 60 + lem) - (lsh * 60 + lsm)
  } else {
    worked -= settingsStore.settings.default_break
  }
  return Math.max(0, worked)
}

const workedDays = computed(() => {
  return Object.values(entryByDay.value).filter(e => e?.end_time).length
})

const totalWorked = computed(() => {
  return Object.values(entryByDay.value).reduce((acc, e) => {
    const m = getWorkedMinutes(e)
    return acc + (m ?? 0)
  }, 0)
})

const totalTarget = computed(() => workedDays.value * dailyTarget.value)

function formatH(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h${String(m).padStart(2, '0')}`
}

function formatBalance(minutes) {
  const sign = minutes >= 0 ? '+' : '-'
  const abs = Math.abs(Math.round(minutes))
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `${sign}${h}h${String(m).padStart(2, '0')}`
}

// Chart data
const labels = computed(() => Array.from({ length: daysInMonth.value }, (_, i) => String(i + 1)))

const lineChartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: 'Heures travaillées',
      data: labels.value.map((_, i) => {
        const e = entryByDay.value[i + 1]
        const m = getWorkedMinutes(e)
        return m !== null ? +(m / 60).toFixed(2) : null
      }),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      tension: 0.3,
      spanGaps: false,
      fill: true
    },
    {
      label: 'Objectif',
      data: labels.value.map(() => +(dailyTarget.value / 60).toFixed(2)),
      borderColor: '#d1d5db',
      borderDash: [5, 5],
      pointRadius: 0,
      fill: false
    }
  ]
}))

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'top' } },
  scales: {
    y: { beginAtZero: true, title: { display: true, text: 'Heures' } }
  }
}

const barChartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: 'Travaillé',
      data: labels.value.map((_, i) => {
        const e = entryByDay.value[i + 1]
        const m = getWorkedMinutes(e)
        return m !== null ? +(m / 60).toFixed(2) : 0
      }),
      backgroundColor: labels.value.map((_, i) => {
        const e = entryByDay.value[i + 1]
        const m = getWorkedMinutes(e)
        if (m === null) return 'rgba(209,213,219,0.5)'
        if (m >= dailyTarget.value) return 'rgba(34,197,94,0.7)'
        return 'rgba(239,68,68,0.7)'
      })
    },
    {
      label: 'Objectif',
      data: labels.value.map(() => +(dailyTarget.value / 60).toFixed(2)),
      backgroundColor: 'rgba(99,102,241,0.2)',
      borderColor: 'rgba(99,102,241,0.6)',
      borderWidth: 1,
      type: 'line',
      pointRadius: 0
    }
  ]
}))

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'top' } },
  scales: {
    y: { beginAtZero: true, title: { display: true, text: 'Heures' } }
  }
}

function getDayBalance(day) {
  const e = entryByDay.value[day]
  const m = getWorkedMinutes(e)
  if (m === null) return null
  return m - dailyTarget.value
}

function getDayBalanceLabel(day) {
  const b = getDayBalance(day)
  if (b === null) return ''
  const sign = b >= 0 ? '+' : '-'
  const abs = Math.abs(b)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  if (h > 0) return `${sign}${h}h${String(m).padStart(2, '0')}`
  return `${sign}${m}m`
}

function calendarCellClass(day) {
  const b = getDayBalance(day)
  if (b === null) return 'bg-gray-50 text-gray-400'
  if (b === 0) return 'bg-green-200 text-green-800'
  if (b > 0) return 'bg-blue-200 text-blue-800'
  if (b < 0 && b >= -30) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-200 text-red-800'
}
</script>
