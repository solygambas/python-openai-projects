<script setup lang="ts">
import { ref } from 'vue'

const foodOne = ref('')
const foodTwo = ref('')
const description = ref('')
const tags = ref('')

const handleSubmit = () => {
  if (!foodOne.value || !foodTwo.value || !description.value) {
    alert('Please fill out all required fields.')
    return
  }
  
  const comboData = {
    foodOne: foodOne.value,
    foodTwo: foodTwo.value,
    description: description.value,
    tags: tags.value.split(',').map(tag => tag.trim()).filter(tag => tag),
  };

  console.log('New Combo Data:', comboData)

  // Clear form
  foodOne.value = ''
  foodTwo.value = ''
  description.value = ''
  tags.value = ''
};
</script>

<template>
  <div class="create-page">
    <h1 class="page-title">Create a New Combo</h1>
    <form @submit.prevent="handleSubmit" class="create-form">
      <div class="form-group">
        <label for="foodOne">Food One</label>
        <input
          type="text"
          id="foodOne"
          v-model="foodOne"
          required
        />
      </div>
      <div class="form-group">
        <label for="foodTwo">Food Two</label>
        <input
          type="text"
          id="foodTwo"
          v-model="foodTwo"
          required
        />
      </div>
      <div class="form-group">
        <label for="description">Description</label>
        <textarea
          id="description"
          v-model="description"
          rows="4"
          required
        ></textarea>
      </div>
      <div class="form-group">
        <label for="tags">Tags (comma-separated)</label>
        <input
          type="text"
          id="tags"
          v-model="tags"
          placeholder="e.g. sweet, savory, crunchy"
        />
      </div>
      <button type="submit" class="btn submit-btn">Create Combo</button>
    </form>
  </div>
</template>
