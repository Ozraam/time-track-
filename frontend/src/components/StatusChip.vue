<template>
  <div class="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-600">
    <span>{{ icon }}</span>
    <span class="font-medium">{{ label }}</span>
    <span class="text-gray-500">{{ time }}</span>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
  time: { type: String, required: true }
})
</script>
