<template lang="pug">
  div
    ul.output-log(v-chat-scroll)
      li.message(v-for='message in messages', :class='"message-" + messageClass[message.type]') {{ message.content }}
    input.command-input(
      type='text', v-model='input', autofocus
      @keydown.enter.prevent='send', @keydown.up.prevent='historyUp', @keydown.down.prevent='historyDown'
    )
</template>

<script>
import Vue from 'vue'
import * as io from 'socket.io-client'
import {getOldMessages} from '@/services/ConsoleService'

export default Vue.extend({
  name: 'console',
  data () {
    return {
      input: '',
      messages: [],
      history: [],
      historyPosition: 0,
      socket: null,
      messageClass: ['plain', 'error', 'command']
    }
  },
  methods: {
    send () {
      if (this.input.trim().length === 0) return
      this.socket.emit('command', this.input)
      this.history.push(this.input)
      this.input = ''
    },
    historyUp () {
      if (this.historyPosition > 0) {
        this.historyPosition--
        this.input = this.history[this.historyPosition]
      }
    },
    historyDown () {
      if (this.historyPosition < this.history.length - 1) {
        this.historyPosition++
        this.input = this.history[this.historyPosition]
      } else if (this.historyPosition === this.history.length - 1) {
        this.historyPosition++
        this.input = ''
      }
    }
  },
  watch: {
    history () {
      this.historyPosition = this.history.length
    }
  },
  async mounted () {
    try {
      const response = await getOldMessages()
      this.messages = response.data.messages
    } catch (error) {
      console.error('Failed to pull old messages.')
      console.error(error)
    }

    this.socket = io('x.adorab.us:8999')
    this.socket.on('message', (data) => {
      this.messages.push(data)
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
  list-style: none;
  overflow-y: scroll;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgb(66, 66, 66);
    outline: 1px solid rgb(139, 139, 139);
  }
}
.command-input {
  width: 800px;
  height: 40px;
  padding: 5px;
  font-size: 12pt;
  box-sizing: border-box;
  margin: 0;
}
.message-error {
  color: rgb(255, 95, 55);
}
.message-command {
  color: rgb(164, 255, 44);
}
</style>
