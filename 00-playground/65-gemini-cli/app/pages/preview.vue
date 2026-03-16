<script setup lang="ts">
import UserAvatar from '../components/UserAvatar.vue'
</script>

<template>
  <div class="preview-page">
    <h1 class="page-title">Component Preview</h1>
    
    <section class="preview-section">
      <h2 class="section-subtitle">UserAvatar</h2>
      <div class="avatar-examples">
        <div class="example">
          <UserAvatar initial="JD" />
          <span>Default</span>
        </div>
        <div class="example">
          <UserAvatar initial="P" bgColor="primary" />
          <span>Primary</span>
        </div>
        <div class="example">
          <UserAvatar initial="S" bgColor="secondary" />
          <span>Secondary</span>
        </div>
        <div class="example">
          <UserAvatar initial="A" bgColor="accent" />
          <span>Accent</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.preview-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.preview-section {
  background-color: var(--component-bg-color);
  padding: 2rem;
  border-radius: 8px;
  margin-top: 2rem;
}

.section-subtitle {
  color: var(--secondary-accent-color);
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.5rem;
}

.avatar-examples {
  display: flex;
  gap: 2rem;
  align-items: center;
  flex-wrap: wrap;
}

.example {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.example span {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}
</style>
