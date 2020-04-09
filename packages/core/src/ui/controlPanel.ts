export class ControlPanel {
  infoElem: any
  target: any
  constructor(baseDom: any) {
    const wrapper = document.createElement('div')
    wrapper.classList.add('control-panel-wrapper')
    baseDom.appendChild(wrapper)

    const mapDom = document.createElement('div')
    const infoDom = document.createElement('div')
    const palletDom = document.createElement('div')

    mapDom.classList.add('map-panel-wrapper')
    infoDom.classList.add('info-panel-wrapper')
    palletDom.classList.add('pallet-panel-wrapper')
    wrapper.appendChild(mapDom)
    wrapper.appendChild(infoDom)
    wrapper.appendChild(palletDom)

    this.infoElem = infoDom
    this.target = null
    setInterval(() => {
      if (this.target) this.infoElem.innerHTML = this.target.getInfo()
    }, 500)
  }
  setTarget(target) {
    this.target = target
    this.infoElem.innerHTML = target.getInfo()
  }
}
