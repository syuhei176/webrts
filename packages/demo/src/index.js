const unitInfo = require('./unit')
const { Game, MultiplayGameInitializer } = require('@webrts/core')
const town = require('./graphics/building/town.svg')
const tree = require('./graphics/nature/tree.svg')
const fruits = require('./graphics/nature/fruits.svg')
const city = require('./graphics/unit/city.svg')
const sword = require('./graphics/unit/sword.svg')
function RTS() {}

const GAME_SERVER_ENDPOINT = 'https://webrts-server.herokuapp.com'

RTS.prototype.start = function() {
  window.addEventListener('load', function() {
    var requestAnimationFrame = getRequestAnimationFrame()
    var mainDom = document.getElementById('main')

    var selectMenuDom = document.createElement('div')
    mainDom.appendChild(selectMenuDom)
    select_menu(selectMenuDom, function(mode, roomName, isNew) {
      mainDom.removeChild(selectMenuDom)
      var gameDom = document.createElement('div')
      mainDom.appendChild(gameDom)
      unitInfo[0].graphic.path = city
      unitInfo[1].graphic.path = sword
      unitInfo[2].graphic.path = town
      unitInfo[3].graphic.path = tree
      unitInfo[4].graphic.path = fruits
      if (mode === 'single') {
        const game = new Game(gameDom, requestAnimationFrame)
        game.start(gameDom, requestAnimationFrame, unitInfo)
      } else if (mode === 'multi') {
        const game = new MultiplayGameInitializer(
          gameDom,
          requestAnimationFrame
        )
        game.start(
          gameDom,
          requestAnimationFrame,
          unitInfo,
          roomName,
          isNew,
          GAME_SERVER_ENDPOINT
        )
      }
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
    stage[2] = document.createElement('div')
    menuPanel.appendChild(stage[0])
    menuPanel.appendChild(stage[1])
    menuPanel.appendChild(stage[2])
    const roomName = document.createElement('input')
    roomName.type = 'text'
    roomName.placeholder = 'room name'
    menuPanel.appendChild(roomName)
    dom.appendChild(title)
    dom.appendChild(menuPanel)
    stage[0].textContent = 'Single Mode'
    stage[1].textContent = 'Create Room'
    stage[2].textContent = 'Join Room'
    stage[0].addEventListener('click', function(e) {
      callback('single')
    })
    stage[1].addEventListener('click', function(e) {
      if (roomName.value) {
        callback('multi', roomName.value, true)
      }
    })
    stage[2].addEventListener('click', function(e) {
      if (roomName.value) {
        callback('multi', roomName.value, false)
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
