<script setup>
const isShowing = defineModel({ type: Boolean, default: false })
</script>

<template>
<div class="screen-modal" v-if="isShowing">
  <div class="screen-modal-content">
    <slot></slot>
  </div>
  <div class="screen-modal-backdrop" @click="isShowing = false"></div>
</div>
</template>

<style scoped>
.screen-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.screen-modal-content {
  background: rgb(32, 32, 32);
  border: var(--border);
  padding: 20px;
}

.screen-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.screen-modal-backdrop {
  z-index: 1;
}

.screen-modal-content {
  z-index: 2;
}
</style>