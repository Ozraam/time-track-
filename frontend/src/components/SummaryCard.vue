<template>
  <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
    <p class="text-xs text-gray-400 mb-1">{{ label }}</p>
    <p
      class="text-lg font-bold"
      :class="positive === undefined ? 'text-gray-800' : positive ? 'text-green-600' : 'text-red-500'"
    >
      {{ value }}
    </p>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  positive: { type: Boolean, default: undefined }
})
</script>
