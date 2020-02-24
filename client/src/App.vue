<template lang="pug">
  #app
    auth(@submit='sendAuth', :show='!isAuthenticated && isConnected')
    #console
      ul.output-log(v-chat-scroll='{always: false, smooth: false}')
        li.beginning Beginning of Log
        li.message(v-for='message in messages', :class='getMessageClass(message)')
          pre.wrap {{ message.content }}
      #bottom
        input.command-input(
          type='text', v-bind:value='input', v-on:input='input = $event.target.value', autofocus, autocomplete='off', autocorrect='off', autocapitalize='off', spellcheck='false',
          @keydown.enter.prevent='send', @keydown.up.prevent='historyUp', @keydown.down.prevent='historyDown'
        )
        #options-container
          #options(v-if='showOptions')
            input#nickname(type='text', placeholder='nickname', v-model='nickname', @keydown.enter.prevent='setNickname')
            button#logout(@click='logOut') Log Out
          button#options-button.material-icons(@click='showOptions = !showOptions') settings
</template>

<script>
import Auth from '@/components/Auth'
import * as io from 'socket.io-client'
import debounce from 'lodash.debounce'

export default {
  name: 'console',
  components: {
    Auth
  },
  data () {
    return {
      input: '',
      nickname: '',
      settings: {
        wordWrap: true
      },
      messages: [],
      history: [],
      historyPosition: 0,
      isAuthenticated: true,
      isConnected: false,
      isAlive: false,
      messageLimit: 0,
      lastPassword: '',
      socket: null,
      messageClass: ['plain', 'error', 'command', 'info', 'stderr'],
      showOptions: false
    }
  },
  methods: {
    sendAuth (password) {
      console.log('Sending auth...')
      this.socket.emit('auth', password)
      this.lastPassword = password
    },
    send () {
      // if (this.input.trim().length === 0) return
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
        this.socket.emit('nickname', this.nickname)
      }
    },
    logOut () {
      localStorage.clear()
      location.reload()
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
    nickname: debounce(function () {
      this.setNickname()
      localStorage.setItem('nickname', this.nickname)
    }, 500),
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

      this.nickname = localStorage.getItem('nickname') || ''

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
      } else {
        this.isAuthenticated = false
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
#bottom {
  display: flex;
  flex-direction: row;
}
#options-button {
  width: 40px;
  height: 40px;
  border: $border;
  border-left: none;
  background: rgb(28, 28, 28);
  color: rgb(190, 190, 190);
}
#options-container {
  position: relative;
}
#options {
  z-index: 1;
  position: absolute;
  bottom: 40px;
  right: 0;
  width: 180px;
  background: rgb(28, 28, 28);
  border: $border;
  border-bottom: none;

  & > * {
    border: none;
    border-bottom: $border;

    &:last-child {
      border: none;
    }
  }
}
#nickname {
  width: 100%;
  text-align: center;
}
#logout {
  width: 100%;
  background: rgb(28, 28, 28);
  color: rgb(190, 190, 190);
  height: 30px;
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
  display: inline-block;
  width: 100%;
}
input[type=text], input[type=password] {
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
