<template lang="pug">
  transition(name='slide-fade' mode='out-in')
    .auth-container(v-if='show')
      .auth-form
        p(style='margin-top: 0') Provide the password.
        input(type='password', v-model='password', @keydown.enter.prevent='submit', autofocus)
</template>

<script>
export default {
  data () {
    return {
      password: ''
    }
  },
  props: {
    show: {
      type: Boolean
    }
  },
  methods: {
    submit () {
      this.$emit('submit', this.password)
      this.password = ''
    }
  }
}
</script>

<style lang="scss">
.auth-container {
  z-index: 1;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(30, 30, 30, 0.8);
}
.auth-form {
  background: rgb(32, 32, 32);
  border: 1px solid rgb(53, 53, 53);
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
