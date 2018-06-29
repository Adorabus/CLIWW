<template lang="pug">
  div
    auth(@submit='sendAuth', :show='!authorized')
    ul.output-log(v-chat-scroll)
      li.message(v-for='message in messages', :class='"message-" + messageClass[message.type]') {{ message.content }}
    input.command-input(
      type='text', v-model='input', autofocus
      @keydown.enter.prevent='send', @keydown.up.prevent='historyUp', @keydown.down.prevent='historyDown'
    )
</template>

<script>
import Auth from '@/components/Auth'
import * as io from 'socket.io-client'

export default {
  name: 'console',
  components: {
    Auth
  },
  data () {
    return {
      input: '',
      messages: [],
      history: [],
      historyPosition: 0,
      authorized: false,
      lastPassword: '',
      socket: null,
      messageClass: ['plain', 'error', 'command']
    }
  },
  methods: {
    sendAuth (password) {
      this.socket.emit('auth', password)
      this.lastPassword = password
    },
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
    this.socket = io('localhost:8999')
    this.socket.on('message', (data) => {
      this.messages.push(data)
    })
    this.socket.on('authsuccess', async (oldMessages) => {
      console.log('Authentication success!')
      this.messages = oldMessages
      this.authorized = true
    })
    this.socket.on('authfail', () => {
      console.log('Authentication failed!')
    })
  }
}
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
}
input[type=text], input[type=password] {
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
