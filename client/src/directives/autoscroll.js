export default {
  beforeUpdate(el) {
    el._canScroll = el.scrollHeight - el.scrollTop === el.clientHeight
  },
  updated(el) {
    if (el._canScroll) {
      el.scrollTop = el.scrollHeight
    }
  }
}
