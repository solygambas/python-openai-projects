<script setup lang="ts">
defineProps<{
  title: string
  description: string
  tags: string[]
  image?: string
}>()
</script>

<template>
  <div class="combo-card">
    <div v-if="image" class="combo-image-container">
      <img :src="image" :alt="title" class="combo-image" />
    </div>
    <div class="combo-content">
      <h4 class="combo-title">{{ title }}</h4>
      <p class="combo-description">{{ description }}</p>
      <div class="combo-tags">
        <span v-for="tag in tags" :key="tag" class="tag">
          {{ tag }}
        </span>
      </div>
    </div>
  </div>
</template>
