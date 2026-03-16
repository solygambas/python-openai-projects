<script setup lang="ts">
interface Props {
  initial: string
  bgColor?: 'primary' | 'secondary' | 'accent' | 'default'
}

const props = withDefaults(defineProps<Props>(), {
  bgColor: 'default'
})
</script>

<template>
  <div :class="['avatar-circle', `bg-${props.bgColor}`]">
    {{ props.initial }}
  </div>
</template>

<style scoped>
.avatar-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-weight: bold;
  color: white;
  user-select: none;
}

.bg-default {
  background-color: var(--component-bg-color);
  border: 1px solid var(--text-color-secondary);
}

.bg-primary {
  background-color: var(--primary-accent-color);
}

.bg-secondary {
  background-color: var(--secondary-accent-color);
  color: var(--background-color);
}

.bg-accent {
  background-color: var(--background-light);
}
</style>
