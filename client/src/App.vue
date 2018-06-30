<template lang="pug">
  #app
    auth(@submit='sendAuth', :show='!authenticated && connected')
    #console
      ul.output-log(v-chat-scroll)
        li.message(v-for='message in messages', :class='"message-" + messageClass[message.type]') {{ message.content }}
      input.command-input(
        type='text', v-model='input', ref='input'
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
      authenticated: false,
      connected: false,
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
    },
    statusChange () {
      const link = document.querySelector("link[rel*='icon']")
      let name = 'favicon'
      if (this.connected) name = 'connected'
      if (!this.authenticated) name = 'needauth'
      link.href = `${name}.ico`
    }
  },
  watch: {
    history () {
      this.historyPosition = this.history.length
    },
    connected () {
      this.statusChange()
    },
    authenticated () {
      this.statusChange()
    }
  },
  async mounted () {
    this.$nextTick(() => {
      this.socket = io('localhost:8999')
      this.socket.on('message', (data) => {
        this.messages.push(data)
      })
      this.socket.on('authsuccess', async (oldMessages) => {
        console.log('Authentication success!')
        this.messages = oldMessages
        this.authenticated = true
        localStorage.setItem('password', this.lastPassword)
        this.$refs.input.focus()
      })
      this.socket.on('authfail', () => {
        console.log('Authentication failed!')
        localStorage.removeItem('password')
        this.$refs.input.blur()
        this.authenticated = null
      })
      this.socket.on('authrequest', () => {
        console.log('Reauthenticating...')
        this.sendAuth(localStorage.getItem('password'))
      })
      this.socket.on('connect', () => {
        console.log('Connected!')
        this.connected = true
      })
      this.socket.on('disconnect', () => {
        console.log('Disconnected!')
        this.connected = false
      })
      if (localStorage.getItem('password')) {
        this.sendAuth(localStorage.getItem('password'))
      }
    })
  }
}
</script>

<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  display: flex;
  justify-content: center;
  width: 100%;
  height: 100%;
}
#console {
  display: flex;
  flex-direction: column;
}
html, body {
  margin: 0;
  padding: 0;
  min-height: 100%;
}
body {
  background: rgb(31, 31, 31);
  color: $text-color;
}
input {
  background: rgb(24, 24, 24);
  border: $border;
  color: $text-color;
}
textarea, select, input, button {
  &:focus {
    outline: none;
  }
}
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
