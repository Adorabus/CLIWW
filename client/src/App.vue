<template lang="pug">
  #app
    auth(@submit='sendAuth', :show='!isAuthenticated && isConnected')
    #console
      ul.output-log(v-chat-scroll='{always: false, smooth: false}')
        li.beginning Beginning of Log
        li.message(v-for='message in messages', :class='getMessageClass(message)')
          pre.wrap {{ message.content }}
      input.command-input(
        type='text', v-model='input', autofocus,
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
      settings: {
        wordWrap: true,
        nickname: ''
      },
      messages: [],
      history: [],
      historyPosition: 0,
      isAuthenticated: false,
      isConnected: false,
      isAlive: false,
      messageLimit: 0,
      lastPassword: '',
      socket: null,
      messageClass: ['plain', 'error', 'command', 'info', 'stderr']
    }
  },
  methods: {
    sendAuth (password) {
      console.log('Sending auth...')
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
      if (this.isConnected && this.isAuthenticated) {
        name = 'connected'
        if (!this.isAlive) name = 'stopped'
      }
      link.href = `${name}.ico`
    },
    getMessageClass (message) {
      const obj = {
        'no-wrap': !this.settings.wordWrap
      }
      obj['message-' + this.messageClass[message.type]] = true
      return obj
    },
    setNickname () {
      if (this.isConnected) {
        this.socket.emit('nickname', this.settings.nickname)
      }
    }
  },
  watch: {
    history () {
      this.historyPosition = this.history.length
    },
    isConnected () {
      this.statusChange()
    },
    isAuthenticated () {
      this.statusChange()
    },
    isAlive () {
      this.statusChange()
    },
    settings: {
      handler () {
        localStorage.setItem('settings', JSON.stringify(this.settings))
      },
      deep: true
    }
  },
  async mounted () {
    this.$nextTick(() => {
      const loadedSettings = localStorage.getItem('settings')
      if (loadedSettings) {
        this.settings = JSON.parse(loadedSettings)
      }

      if (this.socket) {
        this.socket.removeAllListeners()
      }

      const port = window.webpackHotUpdate ? 8999 : location.port
      this.socket = io(`${location.hostname}:${port}`)
      this.socket.on('message', (data) => {
        if (this.messageLimit > 0) {
          if (this.messages.length === this.messageLimit) {
            this.messages.shift()
          }
        }
        this.messages.push(data)
      })
      this.socket.on('authsuccess', async () => {
        console.log('Authentication success!')
        localStorage.setItem('password', this.lastPassword)
        this.isAuthenticated = true
        this.setNickname()
      })
      this.socket.on('authfail', () => {
        console.log('Authentication failed!')
        localStorage.removeItem('password')
        this.isAuthenticated = false
      })
      this.socket.on('authrequest', () => {
        console.log('Reauthenticating...')
        this.sendAuth(localStorage.getItem('password'))
      })
      this.socket.on('connect', () => {
        console.log('Connected!')
        this.isConnected = true
      })
      this.socket.on('disconnect', () => {
        console.log('Disconnected!')
        this.isConnected = false
      })
      this.socket.on('serverstate', (state) => {
        for (const [key, value] of Object.entries(state)) {
          this[key] = value
        }
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
  height: 100vh;
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
  margin: 0;
  height: calc(100vh - 40px);
  text-align: left;
  padding: 0;
  padding-left: 6px;
  box-sizing: border-box;
  font-size: 10pt;
  list-style: none;
  overflow-y: scroll;
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
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
}
input[type=text], input[type=password] {
  width: 100%;
  height: 40px;
  padding: 5px;
  font-size: 12pt;
  box-sizing: border-box;
  margin: 0;
}
label {
  font-size: 10pt;
}
pre {
  margin: 0;
  padding: 0;
}
.wrap {
  white-space: pre-wrap;       /* Since CSS 2.1 */
  white-space: -moz-pre-wrap;  /* Mozilla, since 1999 */
  white-space: -pre-wrap;      /* Opera 4-6 */
  white-space: -o-pre-wrap;    /* Opera 7 */
  word-wrap: break-word;       /* Internet Explorer 5.5+ */
}
.message {
  background-color: rgb(30, 30, 30);
  margin: 0;
}
.message:nth-child(odd) {
  background-color: rgb(34, 34, 34);
}
.message:hover {
  background-color: rgb(40, 40, 40);
}
.message-error {
  color: rgb(255, 95, 55);
}
.message-info {
  color: #00ccff;
}
.message-command {
  color: rgb(164, 255, 44);
}
.message-stderr {
  color: rgb(255, 29, 78);
}
.beginning {
  background: rgb(255, 81, 0);
  text-align: center;
  color: white;
  font-family: 'Open Sans', sans-serif;
  font-size: 10pt;
  padding: 4px;
  line-height: 13px;
}
.no-wrap {
  word-wrap: none;
  white-space: nowrap;
}
.center {
  text-align: center;
}
</style>
