<template>
  <div class="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 text-sm text-gray-600">
    <span>{{ icon }}</span>
    <span class="font-medium">{{ label }}</span>
    <span class="text-gray-500">{{ time }}</span>
    <button
      v-if="editable"
      @click.stop="$emit('edit')"
      class="ml-0.5 text-indigo-400 hover:text-indigo-600 leading-none"
      :aria-label="`Modifier ${label}`"
    >✏️</button>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
  time: { type: String, required: true },
  editable: { type: Boolean, default: false }
})

defineEmits(['edit'])
</script>
