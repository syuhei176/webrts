export class Preloader {
  wrapper: any
  constructor(baseDom) {
    var wrapper = document.createElement('div')
    wrapper.classList.add('loading-animation')
    var ballsDom = document.createElement('div')
    ballsDom.classList.add('balls')
    wrapper.appendChild(ballsDom)
    baseDom.appendChild(wrapper)

    this.wrapper = wrapper
  }
  show() {
    this.wrapper.style['display'] = 'block'
  }
  hide() {
    this.wrapper.style['display'] = 'none'
  }
}
