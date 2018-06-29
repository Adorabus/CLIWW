import Api from '@/services/Api'

export function getOldMessages (password) {
  return Api().get('console', {
    params: {password}
  })
}
