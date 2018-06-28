import Api from '@/services/Api'

export function getOldMessages () {
  return Api().get('/')
}
