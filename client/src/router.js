import Vue from 'vue'
import Router from 'vue-router'
import Console from './views/Console.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Console',
      component: Console
    }
  ]
})
