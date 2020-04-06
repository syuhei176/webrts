import SVG from 'svg.js'
import { RectangleSelector } from './ui/RectangleSelector'
import { Map } from './Map'
import Platform from './platform'
import { ControlPanel } from './ui/controlPanel'
import { Menu } from './ui/menu'
import { Preloader } from './ui/preloader'
import { UnitManager } from './UnitManager'
import { Player, PlayerType } from './Player'
import { Unit } from './Unit'

export class Game {
  constructor(mainDom, requestAnimationFrame) {}

  start(mainDom, requestAnimationFrame, unitInfo) {
    var platform = Platform()
    var controlPanel = new ControlPanel(mainDom)
    var menu = new Menu(mainDom)
    var preloader = new Preloader(mainDom)
    preloader.show()
    var svgWrapper = document.createElement('div')
    svgWrapper.id = 'svgmain'
    var width = window.innerWidth
    var height = window.innerHeight
    mainDom.appendChild(svgWrapper)

    const doc = SVG('svgmain').size(width, height)
    const rectangleSelector = new RectangleSelector(doc)
    const map = new Map(doc, rectangleSelector)
    const unitManager = new UnitManager(doc)
    unitManager.load(unitInfo)
    //map.generate(0);

    map.setUnitManager(unitManager)
    var player1 = new Player(PlayerType.HUMAN)
    var player2 = new Player(PlayerType.ENEMY)
    var player_gaia = new Player(PlayerType.GAIA)

    menu.update('tree', 0)
    player1.on('update', function() {
      menu.update('tree', player1.getResource('tree'))
    })
    unitManager.create('town', player1).setPos(400, 100)
    unitManager.create('villager', player1).setPos(50, 50)
    unitManager.create('villager', player1).setPos(100, 50)
    unitManager.create('villager', player1).setPos(50, 100)
    unitManager.create('villager', player1).setPos(100, 100)
    unitManager.create('villager', player2).setPos(425, 525)
    unitManager.create('villager', player2).setPos(425, 550)
    unitManager.create('villager', player2).setPos(450, 525)
    unitManager.create('villager', player2).setPos(450, 550)
    unitManager.create('villager', player2).setPos(475, 525)
    unitManager.create('villager', player2).setPos(475, 550)
    unitManager.create('villager', player2).setPos(500, 525)
    unitManager.create('villager', player2).setPos(500, 550)
    unitManager.create('villager', player2).setPos(525, 525)
    unitManager.create('villager', player2).setPos(525, 550)
    unitManager.create('tree', player_gaia).setPos(150, 200)
    unitManager.create('tree', player_gaia).setPos(150, 250)
    unitManager.create('tree', player_gaia).setPos(150, 300)
    unitManager.create('tree', player_gaia).setPos(200, 300)
    unitManager.create('tree', player_gaia).setPos(300, 300)

    let selected: Unit[] | Unit | null = null
    unitManager.on('target', function(e) {
      if (selected) {
        if (selected instanceof Array) {
          selected.forEach(function(s) {
            select_target(s, e.unit)
          })
        } else {
          select_target(selected, e.unit)
        }
      }
      function select_target(selected, target) {
        if (target.player && target.player.type === PlayerType.ENEMY) {
          selected.move_to_enemy(target)
        } else {
          selected.move_to_target(target)
        }
      }
    })
    map.on('target', function(e) {
      if (selected) {
        if (selected instanceof Array) {
          selected.forEach(function(s) {
            move_to_pos(s, e.pos)
          })
        } else {
          move_to_pos(selected, e.pos)
        }
      }
      function move_to_pos(selected, pos) {
        if (selected.player && selected.player.type == PlayerType.HUMAN) {
          selected.move_to_pos(e.pos)
        }
      }
    })
    map.on('click', function(e) {
      if (player1.useResource('tree', 50)) {
        unitManager.create('town', player1).setPos(e.pos.x, e.pos.y)
      }
    })
    map.on('selected', function(units) {
      selected = units
      if (Array.isArray(selected) && selected.length > 0) {
        controlPanel.setTarget(selected[0])
      }
      units.forEach(function(unit) {
        if (unit.info.type == 'building') {
          unit.addUnitCreationQueue()
        }
      })
    })
    platform.setupMap(map)
    platform.setupUnitManager(unitManager)

    function gameLoop() {
      unitManager.main()
    }
    var recursiveAnim = function() {
      gameLoop()
      requestAnimationFrame(recursiveAnim)
    }
    requestAnimationFrame(recursiveAnim)

    var graph = map.getCollGraph({ except: [] })
    /*
    for(var i=0;i < graph.length;i++) {
      for(var j=0;j < graph[i].length;j++) {
        if(graph[i][j] == 0) {
          snap.rect(i*50, j*50, 45, 45).attr({
            stroke : '#a77',
            fill : 'none',
            strokeWidth : 3
          });
        }else if(graph[i][j] == 1) {
          snap.rect(i*50, j*50, 45, 45).attr({
            stroke : '#77b',
            fill : 'none',
            strokeWidth : 3
          });
        }
      }
    }
    */
  }
}
