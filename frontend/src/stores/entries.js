import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useEntriesStore = defineStore('entries', () => {
  const todayEntry = ref(null)
  const monthEntries = ref([])
  const cumulativeBalance = ref(0)
  const loading = ref(false)

  async function fetchToday() {
    const res = await axios.get('/api/entries/today')
    todayEntry.value = res.data.entry
  }

  async function fetchMonth(year, month) {
    const mm = String(month).padStart(2, '0')
    const res = await axios.get(`/api/entries/${year}/${mm}`)
    monthEntries.value = res.data.entries
    cumulativeBalance.value = res.data.cumulative_balance
  }

  async function doAction(time = null) {
    loading.value = true
    try {
      const payload = time ? { time } : {}
      const res = await axios.post('/api/entries/action', payload)
      todayEntry.value = res.data.entry
    } finally {
      loading.value = false
    }
  }

  async function updateEntry(id, fields) {
    loading.value = true
    try {
      const res = await axios.put(`/api/entries/${id}`, fields)
      const updated = res.data.entry
      if (todayEntry.value?.id === id) {
        todayEntry.value = updated
      }
      const idx = monthEntries.value.findIndex(e => e.id === id)
      if (idx !== -1) monthEntries.value[idx] = updated
      return updated
    } finally {
      loading.value = false
    }
  }

  return { todayEntry, monthEntries, cumulativeBalance, loading, fetchToday, fetchMonth, doAction, updateEntry }
})
