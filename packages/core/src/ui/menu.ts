export class Menu {
  treeDom: any
  constructor(baseDom) {
    var that = this
    var wrapper = document.createElement('div')
    wrapper.classList.add('menu-panel-wrapper')
    baseDom.appendChild(wrapper)

    this.treeDom = document.createElement('div')
    this.treeDom.classList.add('menu-item')
    wrapper.appendChild(this.treeDom)
  }
  update(name, value) {
    this.treeDom.textContent = value
  }
}
