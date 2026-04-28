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
    const res = await axios.get(`/api/entries/${year}/${month}`)
    monthEntries.value = res.data.entries
    cumulativeBalance.value = res.data.cumulativeBalance
  }

  async function doAction() {
    loading.value = true
    try {
      const res = await axios.post('/api/entries/action')
      todayEntry.value = res.data.entry
    } finally {
      loading.value = false
    }
  }

  return { todayEntry, monthEntries, cumulativeBalance, loading, fetchToday, fetchMonth, doAction }
})
