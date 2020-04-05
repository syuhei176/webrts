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
    select_menu(selectMenuDom, function(stage) {
      mainDom.removeChild(selectMenuDom)
      var gameDom = document.createElement('div')
      mainDom.appendChild(gameDom)
      const game = new Game(gameDom, requestAnimationFrame)
      unitInfo[0].graphic.path = city
      unitInfo[1].graphic.path = sword
      unitInfo[2].graphic.path = town
      unitInfo[3].graphic.path = tree
      unitInfo[4].graphic.path = fruits
      game.start(gameDom, requestAnimationFrame, unitInfo)
    })
  })

  function select_menu(dom, callback) {
    var stage = []
    stage[0] = document.createElement('div')
    stage[1] = document.createElement('div')
    dom.appendChild(stage[0])
    dom.appendChild(stage[1])
    stage[0].textContent = 'Stage 1'
    stage[1].textContent = 'Stage 2'
    stage[0].addEventListener('click', function(e) {
      callback(0)
    })
    stage[1].addEventListener('click', function(e) {
      callback(1)
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
