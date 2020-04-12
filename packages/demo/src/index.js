const unitInfo = require('./unit')
const { Game } = require('@webrts/core')
const town = require('./graphics/building/town.svg')
const tree = require('./graphics/nature/tree.svg')
const fruits = require('./graphics/nature/fruits.svg')
const city = require('./graphics/unit/city.svg')
const sword = require('./graphics/unit/sword.svg')
function RTS() {}

RTS.prototype.start = function() {
  window.addEventListener('load', function() {
    var requestAnimationFrame = getRequestAnimationFrame()
    var mainDom = document.getElementById('main')

    var selectMenuDom = document.createElement('div')
    mainDom.appendChild(selectMenuDom)
    select_menu(selectMenuDom, function(addr, isInitiator) {
      mainDom.removeChild(selectMenuDom)
      var gameDom = document.createElement('div')
      mainDom.appendChild(gameDom)
      const game = new Game(gameDom, requestAnimationFrame)
      unitInfo[0].graphic.path = city
      unitInfo[1].graphic.path = sword
      unitInfo[2].graphic.path = town
      unitInfo[3].graphic.path = tree
      unitInfo[4].graphic.path = fruits
      game.start(gameDom, requestAnimationFrame, unitInfo, addr, isInitiator)
    })
  })

  function select_menu(dom, callback) {
    const stage = []
    const title = document.createElement('div')
    const menuPanel = document.createElement('div')
    title.className = 'title'
    title.textContent = 'WebRTS(DEMO)'
    dom.className = 'title-menu-wrapper'
    menuPanel.className = 'title-menu-panel'
    stage[0] = document.createElement('div')
    stage[1] = document.createElement('div')
    menuPanel.appendChild(stage[0])
    menuPanel.appendChild(stage[1])
    const addr = document.createElement('input')
    addr.type = 'text'
    menuPanel.appendChild(addr)
    const initiator = document.createElement('input')
    initiator.type = 'checkbox'
    menuPanel.appendChild(initiator)
    dom.appendChild(title)
    dom.appendChild(menuPanel)
    stage[0].textContent = 'Tutorial'
    stage[1].textContent = 'Free Mode'
    stage[0].addEventListener('click', function(e) {
      console.log(addr.value, initiator.checked)
      if (addr.value) {
        callback(addr.value, initiator.checked)
      }
    })
    stage[1].addEventListener('click', function(e) {
      if (addr.value) {
        callback(addr.value)
      }
    })
  }
}

function getRequestAnimationFrame() {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    null
  )
}

window.RTS = new RTS()

module.exports = RTS

function PanelItem() {}
