<script setup lang="ts">
import { BookOpen, Users, Star } from 'lucide-vue-next';
</script>

<template>
  <div>
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">The perfect pair for your plate.</h1>
        <p class="hero-subtitle">
          Find the weirdest and most wonderful food combinations, recommended by
          our community of food lovers.
        </p>
        <div class="search-container">
          <input
            type="text"
            class="search-input"
            placeholder="e.g. marmite and cheese"
          />
          <button class="search-button">Search</button>
        </div>
      </div>
    </div>
    <section class="features-section">
      <div class="feature-card">
        <BookOpen :size="48" class="feature-icon" />
        <h3 class="feature-title">Discover new flavours</h3>
        <p>
          Explore a world of unexpected taste sensations and find your next
          favorite meal.
        </p>
      </div>
      <div class="feature-card">
        <Users :size="48" class="feature-icon" />
        <h3 class="feature-title">Join the community</h3>
        <p>
          Connect with fellow food enthusiasts, share your own creations, and get
          feedback.
        </p>
      </div>
      <div class="feature-card">
        <Star :size="48" class="feature-icon" />
        <h3 class="feature-title">Rate and review</h3>
        <p>
          Help others by rating and reviewing combinations, and climb the
          leaderboard.
        </p>
      </div>
    </section>

    <section class="recent-combos-section">
      <h2 class="section-title">Recent Combo's</h2>
      <div class="combo-grid">
        <div class="combo-card">
          <h4 class="combo-title">Marmite & Cheese</h4>
          <p class="combo-description">A classic savory delight, loved by many.</p>
          <div class="combo-tags">
            <span class="tag">Savory</span>
            <span class="tag">Classic</span>
          </div>
        </div>
        <div class="combo-card">
          <h4 class="combo-title">Maltesers & Salt & Vinegar Crisps</h4>
          <p class="combo-description">An unexpected sweet and salty crunch.</p>
          <div class="combo-tags">
            <span class="tag">Sweet</span>
            <span class="tag">Salty</span>
            <span class="tag">Crunchy</span>
          </div>
        </div>
        <div class="combo-card">
          <h4 class="combo-title">Strawberries & Black Pepper</h4>
          <p class="combo-description">A surprising burst of sweet and spicy.</p>
          <div class="combo-tags">
            <span class="tag">Fruity</span>
            <span class="tag">Spicy</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>