<script setup lang="ts">
defineProps<{
  title: string
  description: string
  tags: string[]
}>()
</script>

<template>
  <div class="combo-card">
    <h4 class="combo-title">{{ title }}</h4>
    <p class="combo-description">{{ description }}</p>
    <div class="combo-tags">
      <span v-for="tag in tags" :key="tag" class="tag">
        {{ tag }}
      </span>
    </div>
  </div>
</template>
