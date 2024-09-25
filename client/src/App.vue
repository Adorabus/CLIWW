<script setup>
import AuthForm from '@/components/AuthForm.vue'
import { io } from 'socket.io-client'
import debounce from 'lodash.debounce'
import { ref, reactive, onMounted, watch } from 'vue'

import ansicolor from 'ansicolor'
const { parse, strip } = ansicolor

ansicolor.rgb = {
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

const input = ref('')
const nickname = ref('')
const settings = reactive({
  wordWrap: true,
  colors: true
})
const messages = ref([])
const state = reactive({
  isAlive: false,
  messageLimit: 0,
})
const history = ref([])
const historyPosition = ref(0)
const isAuthenticated = ref(true)
const isConnected = ref(false)
const lastPassword = ref('')
const messageClass = ['plain', 'error', 'command', 'info', 'stderr']
const showOptions = ref(false)
let socket = null

const getMessageClass = (message) => {
  const obj = {
    wrap: settings.wordWrap
  }
  obj['message-' + messageClass[message.type]] = true
  return obj
}

const sendAuth = (password) => {
  console.log('Sending auth...')
  socket.emit('auth', password)
  lastPassword.value = password
}

const send = () => {
  socket.emit('command', input.value)
  history.value.push(input.value)
  input.value = ''
}

const historyUp = () => {
  if (historyPosition.value > 0) {
    historyPosition.value--
    input.value = history.value[historyPosition.value]
  }
}

const historyDown = () => {
  if (historyPosition.value < history.value.length - 1) {
    historyPosition.value++
    input.value = history.value[historyPosition.value] || ''
  }
}

const statusChange = () => {
  const link = document.querySelector("link[rel*='icon']")
  if (!isConnected.value) {
    link.href = 'data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAQAQAABMLAAATCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH9/f/9/f3//f39//39/f/9/f3//f39//39/f/9/f3//f39//39/f/9/f3//f39//wAAAAAAAAAAB/f3//ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/f39//wAAAAAAAAAAf39//xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/39/f/8AAAAAAAAAAH9/f/8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf9/f3//AAAAAAAAAAB/f3//ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/f39//wAAAAAAAAAAf39//xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/39/f/8AAAAAAAAAAH9/f/8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf9/f3//AAAAAAAAAAB/f3//ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/f39//wAAAAAAAAAAf39//xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/39/f/8AAAAAAAAAAH9/f/8RERH/f39//xEREf8RERH/f39//39/f/8RERH/ERER/xEREf8RERH/ERER/xEREf9/f3//AAAAAAAAAAB/f3//ERER/xEREf9/f3//ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/f39//wAAAAAAAAAAf39//xEREf9/f3//ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/39/f/8AAAAAAAAAAH9/f/8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf8RERH/ERER/xEREf9/f3//AAAAAAAAAAB/f3//f39//39/f/9/f3//f39//39/f/9/f3//f39//39/f/9/f3//f39//39/f/9/f3//f39//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAMADAACAAQAAgAEAAIABAACAAQAAgAEAAIABAACAAQAAgAEAAIABAACAAQAAgAEAAIABAADAAwAA//8AAA=='
    return
  }

  let name = 'favicon'
  if (isConnected.value && isAuthenticated.value) {
    name = 'connected'
    if (!state.isAlive) name = 'stopped'
  }
  link.href = `${name}.ico`
}

const setNickname = () => {
  if (isConnected.value) {
    socket.emit('nickname', nickname.value)
  }
}

const logOut = () => {
  localStorage.clear()
  location.reload()
}

watch(history, () => {
  historyPosition.value = history.value.length
})

watch([isConnected, isAuthenticated, state], statusChange)

watch(nickname, debounce(() => {
  setNickname()
  localStorage.setItem('nickname', nickname.value)
}, 500))

watch(settings, () => {
  localStorage.setItem('settings', JSON.stringify(settings))
}, { deep: true })

onMounted(() => {
  const loadedSettings = localStorage.getItem('settings')
  if (loadedSettings) {
    Object.assign(settings, JSON.parse(loadedSettings))
  }

  nickname.value = localStorage.getItem('nickname') || ''

  if (socket) {
    socket.removeAllListeners()
  }

  const port = import.meta.env.DEV ? 8999 : location.port
  socket = io(`${location.hostname}:${port}`)

  socket.on('message', (message) => {
    if (state.messageLimit > 0 && messages.value.length === state.messageLimit) {
      messages.value.shift()
    }

    ansiColorize(message)
    messages.value.push(message)
  })

  socket.on('authsuccess', () => {
    console.log('Authentication success!')
    localStorage.setItem('password', lastPassword.value)
    isAuthenticated.value = true
    setNickname()
  })

  socket.on('authfail', () => {
    console.log('Authentication failed!')
    localStorage.removeItem('password')
    isAuthenticated.value = false
  })

  socket.on('authrequest', () => {
    console.log('Reauthenticating...')
    sendAuth(localStorage.getItem('password'))
  })

  socket.on('connect', () => {
    console.log('Connected!')
    isConnected.value = true
  })

  socket.on('disconnect', () => {
    console.log('Disconnected!')
    isConnected.value = false
  })

  socket.on('serverstate', (data) => {
    for (const key in data) {
      state[key] = data[key]
    }
  })

  socket.on('messagehistory', (data) => {
    messages.value = data.messages.map((message) => {
      ansiColorize(message)
      return message
    })
  })

  if (localStorage.getItem('password')) {
    sendAuth(localStorage.getItem('password'))
  } else {
    isAuthenticated.value = false
  }
})
</script>

<template>
<div id="app">
  <auth-form @submit="sendAuth" :show="!isAuthenticated && isConnected" />

  <div id="console">
    <ul class="output-log" v-autoscroll>
      <li class="beginning">Beginning of Log</li>
      <li class="message" v-for="message in messages">
        <pre v-if="settings.colors && message.spans" :class="getMessageClass(message)">
          <span v-for="span in message.spans" :style="span.style">{{ span.text }}</span>
        </pre>
        <pre v-else :class="{ wrap: settings.wordWrap }">{{ message.content }}</pre>
      </li>
    </ul>

    <div id="bottom">
      <input class="command-input" type="text" v-bind:value="input" v-on:input="input = $event.target.value" autofocus autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
          @keydown.enter.prevent="send" @keydown.up.prevent="historyUp" @keydown.down.prevent="historyDown">

      <div id="options-container">
        <div id="options" v-if="showOptions">
          <input type="text" placeholder="nickname" v-model="nickname" @keydown.enter.prevent="setNickname">

          <div class="option">
            <label for="chk-colors" class="check">ANSI Colors</label>
            <input type="checkbox" id="chk-colors" v-model="settings.colors">
          </div>

          <div class="option">
            <label for="chk-wrap" class="check">Wrap Lines</label>
            <input type="checkbox" id="chk-wrap" v-model="settings.wordWrap">
          </div>

          <button id="logout" @click="logOut">Log Out</button>
        </div>

        <button id="options-button" class="material-icons" @click="showOptions = !showOptions">settings</button>
      </div>
    </div>
  </div>
</div>
</template>

<style>
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
  border: var(--border);
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
  border: var(--border);
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
.output-log, .command-input {
  font-family: var(--monospace);
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
.wrap {
  white-space: pre-wrap;
  word-wrap: break-word;
}
.message {
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
