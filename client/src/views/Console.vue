<template lang="pug">
  div
    pre.output-log {{ output }}
    input.command-input(type='text', v-model='input', @keydown.enter.prevent='send')
</template>

<script lang="ts">
import Vue from 'vue'
import * as io from 'socket.io-client'

export default Vue.extend({
  name: 'console',
  data () {
    return {
      input: '',
      output: '',
      socket: null
    }
  },
  methods: {
    send () {
      this.socket.emit('command', this.input)
      this.input = ''
    }
  },
  mounted () {
    this.socket = io('localhost:8999')
    this.socket.on('message', (data) => {
      this.output += data + '\n'
    })
  }
})
</script>

<style lang="scss">
.output-log, .command-input {
  font-family: $monospace;
}
.output-log {
  width: 800px;
  height: 600px;
  border: $border;
  text-align: left;
  padding: 10px;
  box-sizing: border-box;
  font-size: 10pt;
}
.command-input {
  width: 800px;
  height: 40px;
  padding: 5px;
  font-size: 12pt;
  box-sizing: border-box;
}
</style>
