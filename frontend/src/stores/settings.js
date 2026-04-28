import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref({
    daily_target: 480,
    default_break: 60,
    stagger_days: 30
  })
  const loading = ref(false)

  async function fetchSettings() {
    loading.value = true
    try {
      const res = await axios.get('/api/settings')
      settings.value = res.data
    } finally {
      loading.value = false
    }
  }

  async function saveSettings(data) {
    loading.value = true
    try {
      const res = await axios.put('/api/settings', data)
      settings.value = res.data
    } finally {
      loading.value = false
    }
  }

  return { settings, loading, fetchSettings, saveSettings }
})
