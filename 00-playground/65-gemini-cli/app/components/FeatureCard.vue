<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon: Component
  title: string
  description: string
}>()
</script>

<template>
  <div class="feature-card">
    <component :is="icon" :size="48" class="feature-icon" />
    <h3 class="feature-title">{{ title }}</h3>
    <p>{{ description }}</p>
  </div>
</template>
