<script setup lang="ts">
import { ref } from 'vue'
import { X } from 'lucide-vue-next'

const foodOne = ref('')
const foodTwo = ref('')
const description = ref('')
const tags = ref<string[]>([])
const currentTag = ref('')

const handleTagInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  const value = input.value

  if (value.includes(',')) {
    const parts = value.split(',')
    const newTag = parts[0]?.trim()

    if (newTag && !tags.value.includes(newTag) && tags.value.length < 5) {
      tags.value.push(newTag)
    }
    
    currentTag.value = parts.slice(1).join(',').trim()
  }
}

const removeTag = (index: number) => {
  tags.value.splice(index, 1)
}

const handleSubmit = () => {
  if (!foodOne.value || !foodTwo.value || !description.value) {
    alert('Please fill out all required fields.')
    return
  }
  
  const comboData = {
    foodOne: foodOne.value,
    foodTwo: foodTwo.value,
    description: description.value,
    tags: tags.value,
  };

  console.log('New Combo Data:', comboData)

  // Clear form
  foodOne.value = ''
  foodTwo.value = ''
  description.value = ''
  tags.value = []
  currentTag.value = ''
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
        <label for="tags">Tags (press comma to add)</label>
        <input
          type="text"
          id="tags"
          v-model="currentTag"
          @input="handleTagInput"
          placeholder="e.g. sweet, savory"
          :disabled="tags.length >= 5"
        />
        <p v-if="tags.length >= 5" class="tag-limit-msg">
          Maximum of 5 tags reached.
        </p>
        <div class="tags-container">
          <span v-for="(tag, index) in tags" :key="index" class="tag-pill">
            {{ tag }}
            <button type="button" class="remove-tag-btn" @click="removeTag(index)">
              <X :size="14" />
            </button>
          </span>
        </div>
      </div>
      <button type="submit" class="btn submit-btn">Create Combo</button>
    </form>
  </div>
</template>
