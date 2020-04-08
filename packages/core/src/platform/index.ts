import pc from './pc'
import sp from './sp'
import UserAgent from './ua'

export default function() {
  const ua = UserAgent()
  if (ua.mobile[0] || ua.tablet) {
    return sp()
  } else {
    return pc()
  }
}
