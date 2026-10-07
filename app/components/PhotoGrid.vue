<script setup lang="ts">
const props = defineProps<{ photos: PhotoWithTags[] }>()

const { layout } = useMasonry(() => props.photos)

// Les premières photos (au-dessus de la ligne de flottaison) se chargent en priorité.
const EAGER_COUNT = 4
</script>

<template>
  <div class="masonry">
    <TransitionGroup
      tag="ul"
      name="tile"
      class="masonry__canvas"
      :style="canvasStyle(layout.heights)"
    >
      <li
        v-for="(photo, index) in photos"
        :key="photo.id"
        class="masonry__tile"
        :style="tileStyle(photo, layout.tiles.get(photo.id))"
      >
        <PhotoTile :photo="photo" :eager="index < EAGER_COUNT" />
      </li>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.masonry {
  container: masonry / inline-size;
  --gap: 12px;
}

.masonry__canvas {
  --n: 4;
  --hr: var(--hr4);
  --hk: var(--hk4);
  --colw: calc((100cqw - (var(--n) - 1) * var(--gap)) / var(--n));

  position: relative;
  height: calc(var(--hr) * var(--colw) + max(var(--hk) - 1, 0) * var(--gap));
  margin: 0;
  padding: 0;
  list-style: none;
  transition: height var(--duration-slow) var(--ease);
}

.masonry__tile {
  --c: var(--c4);
  --r: var(--r4);
  --k: var(--k4);

  position: absolute;
  top: calc(var(--r) * var(--colw) + var(--k) * var(--gap));
  left: calc(var(--c) * (var(--colw) + var(--gap)));
  width: var(--colw);
  height: calc(var(--colw) * var(--ratio));
  /* Pas de transform ici : TransitionGroup ne doit pas appliquer son propre FLIP. */
  transition:
    top var(--duration-slow) var(--ease),
    left var(--duration-slow) var(--ease),
    width var(--duration-slow) var(--ease),
    height var(--duration-slow) var(--ease);
}

@container masonry (width < 640px) {
  .masonry__canvas {
    --n: 2;
    --hr: var(--hr2);
    --hk: var(--hk2);
  }

  .masonry__tile {
    --c: var(--c2);
    --r: var(--r2);
    --k: var(--k2);
  }
}

@container masonry (640px <= width < 1100px) {
  .masonry__canvas {
    --n: 3;
    --hr: var(--hr3);
    --hk: var(--hk3);
  }

  .masonry__tile {
    --c: var(--c3);
    --r: var(--r3);
    --k: var(--k3);
  }
}

/* Apparition / disparition au filtrage */
.tile-enter-active,
.tile-leave-active {
  transition:
    opacity var(--duration) var(--ease),
    transform var(--duration) var(--ease);
}

.tile-enter-active {
  transition-delay: 80ms;
}

.tile-enter-from,
.tile-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
