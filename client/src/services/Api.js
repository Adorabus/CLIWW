import axios from 'axios'

export default () => {
  return axios.create({
    baseURL: 'http://x.adorab.us:8999/'
  })
}
