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
import { showDebugGrid } from './debug'
import { v1 } from 'uuid'

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
    function createUnit(player: Player, unit: string, x: number, y: number) {
      const id = v1()
      unitManager.create(id, unit, player).setPos(x, y)
    }
    createUnit(player1, 'town', 250, 150)
    createUnit(player1, 'villager', 50, 75)
    createUnit(player1, 'villager', 100, 75)

    createUnit(player2, 'villager', 575, 525)
    createUnit(player2, 'villager', 575, 555)
    createUnit(player2, 'villager', 600, 525)
    createUnit(player2, 'villager', 600, 555)
    createUnit(player2, 'villager', 625, 525)
    createUnit(player2, 'villager', 625, 555)

    createUnit(playerGaia, 'tree', 100, 200)
    createUnit(playerGaia, 'tree', 100, 250)
    createUnit(playerGaia, 'tree', 200, 300)

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
