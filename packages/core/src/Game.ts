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
import { BaseBuildingUnit } from './Building'
import { MobileUnit } from './MobileUnit'
import { Point2d } from '@webrts/math2d'

export class Game {
  start(mainDom, requestAnimationFrame, unitInfo) {
    const isDebugMode = false
    const debugGrid: SVG.Rect[][] = []
    const platform = Platform()
    const controlPanel = new ControlPanel(mainDom)
    const menu = new Menu(mainDom)
    const preloader = new Preloader(mainDom)
    preloader.show()
    const svgWrapper = document.createElement('div')
    svgWrapper.id = 'svgmain'
    const width = window.innerWidth
    const height = window.innerHeight
    mainDom.appendChild(svgWrapper)

    const doc = SVG('svgmain').size(width, height)
    const rectangleSelector = new RectangleSelector(doc)
    const map = new Map(doc, rectangleSelector)
    const unitManager = new UnitManager(doc)
    unitManager.load(unitInfo)
    //map.generate(0);

    unitManager.setMap(map)
    map.appendGraphicElement(unitManager.group)
    const player1 = new Player(PlayerType.HUMAN)
    const player2 = new Player(PlayerType.ENEMY)
    const playerGaia = new Player(PlayerType.GAIA)

    menu.update('tree', 0)
    player1.on('update', function() {
      menu.update('tree', player1.getResource('tree'))
    })
    unitManager.create('town', player1).setPos(200, 150)
    unitManager.create('villager', player1).setPos(50, 75)
    unitManager.create('villager', player1).setPos(100, 75)
    unitManager.create('villager', player1).setPos(150, 75)
    unitManager.create('villager', player1).setPos(200, 75)
    unitManager.create('villager', player1).setPos(250, 75)

    unitManager.create('villager', player2).setPos(575, 525)
    unitManager.create('villager', player2).setPos(575, 550)
    unitManager.create('villager', player2).setPos(600, 525)
    unitManager.create('villager', player2).setPos(600, 550)
    unitManager.create('villager', player2).setPos(625, 525)
    unitManager.create('villager', player2).setPos(625, 550)
    unitManager.create('villager', player2).setPos(650, 525)
    unitManager.create('villager', player2).setPos(650, 550)
    unitManager.create('tree', playerGaia).setPos(100, 200)
    unitManager.create('tree', playerGaia).setPos(100, 250)
    unitManager.create('tree', playerGaia).setPos(200, 300)
    unitManager.create('tree', playerGaia).setPos(200, 350)
    unitManager.create('tree', playerGaia).setPos(250, 350)

    let selected: Unit[] | Unit | null = null
    unitManager.on('target', function(e) {
      if (selected) {
        if (selected instanceof Array) {
          selected.forEach(s => {
            selectTarget(s, e.unit)
          })
        } else {
          selectTarget(selected, e.unit)
        }
      }
      function selectTarget(selected: Unit, target) {
        if (!(selected instanceof MobileUnit)) {
          return
        }
        if (target.player && target.player.type === PlayerType.ENEMY) {
          selected.moveToEnemy(target)
        } else {
          selected.moveToTarget(target)
        }
      }
    })
    map.on('target', function(e) {
      unitManager.select([])
      if (selected) {
        if (selected instanceof Array) {
          selected.forEach(s => {
            moveToPos(s, e.pos)
          })
        } else {
          moveToPos(selected, e.pos)
        }
      }
      function moveToPos(selected: Unit, pos: Point2d) {
        if (
          selected instanceof MobileUnit &&
          selected.player &&
          selected.player.type == PlayerType.HUMAN
        ) {
          selected.moveToPos(pos)
        }
      }
    })
    map.on('click', function(e) {
      console.log('click map')
      unitManager.select([])
      /*
      if (player1.useResource('tree', 50)) {
        unitManager.create('town', player1).setPos(e.pos.x, e.pos.y)
      }
      */
    })

    unitManager.on('click', e => {
      selectUnits([e.unit])
    })

    map.on('selected', (rectangleSelector: RectangleSelector) => {
      const units = unitManager.getTrainableUnits().filter(unit => {
        return rectangleSelector.isContained(map.global2screen(unit.pos))
      })
      unitManager.select(units)
      selectUnits(units)
    })
    function selectUnits(units: Unit[]) {
      selected = units
      if (Array.isArray(selected) && selected.length > 0) {
        controlPanel.setTarget(selected[0])
      }
      units.forEach(unit => {
        if (unit instanceof BaseBuildingUnit) {
          if (player1.useResource('tree', 20)) {
            unit.addUnitCreationQueue()
          }
        }
      })
    }
    platform.setupMap(map)
    platform.setupUnitManager(unitManager)

    function gameLoop() {
      unitManager.main()
      if (isDebugMode) {
        showDebugGrid(doc, map, unitManager, debugGrid)
      }
    }
    const recursiveAnim = function() {
      gameLoop()
      requestAnimationFrame(recursiveAnim)
    }
    requestAnimationFrame(recursiveAnim)
  }
}

function showDebugGrid(
  doc: SVG.Doc,
  map: Map,
  unitManager: UnitManager,
  debugGrid: SVG.Rect[][]
) {
  const graph = map.getCollGraph(unitManager, { except: [] })
  for (var i = 0; i < graph.length; i++) {
    for (var j = 0; j < graph[i].length; j++) {
      if (!debugGrid[i]) {
        debugGrid[i] = []
      }
      if (!debugGrid[i][j]) {
        debugGrid[i][j] = doc.rect(45, 45).move(j * 50, i * 50)
      }
      if (graph[i][j] == 0) {
        debugGrid[i][j].attr({
          stroke: '#a77',
          fill: 'none',
          strokeWidth: 3
        })
      } else if (graph[i][j] == 1) {
        debugGrid[i][j].attr({
          stroke: '#77b',
          fill: 'none',
          strokeWidth: 3
        })
      }
    }
  }
}
