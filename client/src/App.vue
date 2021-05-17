<template lang="pug">
  #app
    auth(@submit='sendAuth', :show='!isAuthenticated && isConnected')
    #console
      ul.output-log(v-chat-scroll='{always: false, smooth: false}')
        li.beginning Beginning of Log
        li.message(v-for='message in messages')
          pre(v-if='settings.colors && message.spans', :class='getMessageClass(message)')
            span(v-for='span in message.spans', :style='span.style') {{ span.text }}
          pre(v-else, :class='{wrap: settings.wordWrap}') {{ message.content }}
      #bottom
        input.command-input(
          type='text', v-bind:value='input', v-on:input='input = $event.target.value', autofocus, autocomplete='off', autocorrect='off', autocapitalize='off', spellcheck='false',
          @keydown.enter.prevent='send', @keydown.up.prevent='historyUp', @keydown.down.prevent='historyDown'
        )
        #options-container
          #options(v-if='showOptions')
            input#nickname(type='text', placeholder='nickname', v-model='nickname', @keydown.enter.prevent='setNickname')
            .option
              label.check(for='chk-colors') ANSI Colors
                input#chk-colors(type='checkbox', v-model='settings.colors')
            .option
              label.check(for='chk-wrap') Wrap Lines
                input#chk-wrap(type='checkbox', v-model='settings.wordWrap')
            button#logout(@click='logOut') Log Out
          button#options-button.material-icons(@click='showOptions = !showOptions') settings
</template>

<script>
import Auth from '@/components/Auth'
import * as io from 'socket.io-client'
import debounce from 'lodash.debounce'

const ansi = require('ansicolor')
const { parse, strip } = ansi

ansi.rgb = {
  black: [0, 0, 0],
  darkGray: [100, 100, 100],
  lightGray: [200, 200, 200],
  white: [255, 255, 255],
  red: [222, 69, 107],
  lightRed: [222, 115, 142],
  green: [55, 174, 111],
  lightGreen: [113, 212, 160],
  yellow: [201, 160, 34],
  lightYellow: [205, 173, 76],
  blue: [44, 152, 184],
  lightBlue: [101, 170, 190],
  magenta: [149, 93, 206],
  lightMagenta: [169, 131, 208],
  cyan: [36, 181, 168],
  lightCyan: [99, 186, 178]
}

// takes in a message, puts ansi color spans in, if there are any
function ansiColorize (message) {
  if (message.colorized) return
  message.colorized = true

  const parsed = parse(message.content)
  const spans = []

  for (const span of parsed.spans) {
    spans.push({
      style: span.css,
      text: strip(span.text)
    })
  }

  if (spans.length > 0) {
    message.spans = spans
  }

  // remove ansi codes from original, in case client opts out
  message.content = strip(message.content)
}

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
        wordWrap: true,
        colors: true
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
    getMessageClass (message) {
      const obj = {
        wrap: this.settings.wordWrap
      }
      obj['message-' + this.messageClass[message.type]] = true
      return obj
    },
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
      if (!this.isConnected) {
        link.href = 'data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAQAQAABMLAAATCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH9/f/9/f3//f39//39/f/9/f3//f39//39/f/9/f3//f39//39/f/9/f3//f39//39/f/9/f3//AAAAAAAAAAB/f3//ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/f39//wAAAAAAAAAAf39//xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/39/f/8AAAAAAAAAAH9/f/8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf9/f3//AAAAAAAAAAB/f3//ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/f39//wAAAAAAAAAAf39//xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/39/f/8AAAAAAAAAAH9/f/8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf9/f3//AAAAAAAAAAB/f3//ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/f39//wAAAAAAAAAAf39//xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/39/f/8AAAAAAAAAAH9/f/8RERH/f39//xEREf8RERH/f39//39/f/8RERH/ERER/xEREf8RERH/ERER/xEREf9/f3//AAAAAAAAAAB/f3//ERER/xEREf9/f3//ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/f39//wAAAAAAAAAAf39//xEREf9/f3//ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/39/f/8AAAAAAAAAAH9/f/8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf9/f3//AAAAAAAAAAB/f3//f39//39/f/9/f3//f39//39/f/9/f3//f39//39/f/9/f3//f39//39/f/9/f3//f39//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAMADAACAAQAAgAEAAIABAACAAQAAgAEAAIABAACAAQAAgAEAAIABAACAAQAAgAEAAIABAADAAwAA//8AAA=='
        return
      }

      let name = 'favicon'
      if (this.isConnected && this.isAuthenticated) {
        name = 'connected'
        if (!this.isAlive) name = 'stopped'
      }
      link.href = `${name}.ico`
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
      this.socket.on('message', (message) => {
        if (this.messageLimit > 0) {
          if (this.messages.length === this.messageLimit) {
            this.messages.shift()
          }
        }

        ansiColorize(message)

        this.messages.push(message)
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

        for (const message of this.messages) {
          ansiColorize(message)
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
  background: #1b1d22;
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
}

.option {
  margin-top: 3px;
  margin-bottom: 3px;
}

#nickname {
  width: 100%;
  height: 30px;
  text-align: center;
  border: none;
  margin: 0;
  box-shadow: inset 0 0 5px #00000066;
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
  background: #1b1d22;
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
button {
  border: 1px solid #333;
}
.output-log, .command-input {
  font-family: $monospace;
}
.output-log {
  margin: 0;
  height: calc(100vh - 40px);
  text-align: left;
  padding: 0;
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
  // background-color: #20232a;
  margin: 0;
  padding-left: 4px;
}
.message:nth-child(odd) {
  background-color: #202329;
}
.message:hover {
  background-color: #23262f;
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
  background: #f35b38;
  text-align: center;
  color: white;
  font-family: 'Open Sans', sans-serif;
  font-size: 10pt;
  padding: 4px;
  line-height: 13px;
}
.center {
  text-align: center;
}
</style>
