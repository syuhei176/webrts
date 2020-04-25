import SVG from 'svg.js'
import { RectangleSelector } from './ui/RectangleSelector'
import { Camera } from './Camera'
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
import { generateMap } from './MapGenerator'

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
    const map = new Camera(doc, rectangleSelector)
    const unitManager = new UnitManager(doc)
    unitManager.load(unitInfo)
    //map.generate(0);

    unitManager.setMap(map)
    map.appendGraphicElement(unitManager.group)
    const player1 = new Player(v1(), PlayerType.HUMAN, 0)
    const player2 = new Player(v1(), PlayerType.ENEMY, 1)
    const playerGaia = new Player(v1(), PlayerType.GAIA, 2)

    menu.update('tree', 0)
    player1.on('update', function() {
      menu.update('tree', player1.getResource('tree'))
    })

    function getPlayer(id: string) {
      return [player1, player2, playerGaia].filter(p => p.id === id)[0]
    }

    generateMap(
      [player1.id, player2.id],
      playerGaia.id,
      (playerId: string, unit: string, x: number, y: number) => {
        const id = v1()
        unitManager
          .create(id, unit, getPlayer(playerId))
          .setPos(new Point2d(x, y))
      }
    )

    let selected: Unit[] | Unit | null = null
    map.on('target', function(e) {
      const units = unitManager.getUnitsWithin(e.pos)
      if (units.length > 0) {
        if (selected) {
          if (selected instanceof Array) {
            selected.forEach(s => {
              selectTarget(s, units[0])
            })
          } else {
            selectTarget(selected, units[0])
          }
        }
      } else {
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

    map.on('selected', (rectangleSelector: RectangleSelector) => {
      let units = unitManager.getTrainableUnits().filter(unit => {
        return rectangleSelector.isContained(map.global2screen(unit.pos))
      })
      if (units.length === 0) {
        units = unitManager.getUnitsWithin(rectangleSelector.startPos)
      }
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
            unit.addUnitCreationQueue(v1())
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
