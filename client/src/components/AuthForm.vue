<template>
  <transition name="slide-fade" mode="out-in">
    <div class="auth-container" v-if="show">
      <div class="auth-form">
        <p style="margin-top: 0">Password Required</p>
        <input
          type="password"
          v-model="password"
          @keydown.enter.prevent="submit"
          autofocus
        />
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['submit'])

const password = ref('')
defineProps({
  show: {
    type: Boolean
  }
})

const submit = () => {
  emit('submit', password.value)
  password.value = ''
}
</script>

<style>
.auth-container {
  z-index: 1;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(30, 30, 30, 0.8);
  backdrop-filter: blur(4px);
}
.auth-form {
  background: rgb(32, 32, 32);
  border: var(--border);
  padding: 20px;
  position: relative;
  margin: 0 auto;
  top: 25%;
  width: 200px;
}
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all .1s ease;
}
.slide-fade-enter, .slide-fade-leave-to {
  transform: translateX(10px);
  opacity: 0;
}
</style>
