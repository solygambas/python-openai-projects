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
      <FeatureCard
        :icon="BookOpen"
        title="Discover new flavours"
        description="Explore a world of unexpected taste sensations and find your next favorite meal."
      />
      <FeatureCard
        :icon="Users"
        title="Join the community"
        description="Connect with fellow food enthusiasts, share your own creations, and get feedback."
      />
      <FeatureCard
        :icon="Star"
        title="Rate and review"
        description="Help others by rating and reviewing combinations, and climb the leaderboard."
      />
    </section>

    <section class="recent-combos-section">
      <h2 class="section-title">Recent Combo's</h2>
      <div class="combo-grid">
        <ComboCard
          title="Marmite & Cheese"
          description="A classic savory delight, loved by many."
          :tags="['Savory', 'Classic']"
          image="/images/marmite-cheese.png"
        />
        <ComboCard
          title="Maltesers & Salt & Vinegar Crisps"
          description="An unexpected sweet and salty crunch."
          :tags="['Sweet', 'Salty', 'Crunchy']"
          image="/images/maltesers-chips.png"
        />
        <ComboCard
          title="Strawberries & Black Pepper"
          description="A surprising burst of sweet and spicy."
          :tags="['Fruity', 'Spicy']"
          image="/images/strawberries-pepper.png"
        />
      </div>
    </section>
  </div>
</template>