import SVG from 'svg.js'
import { Unit } from './Unit'
import { Point2d } from '@webrts/math2d'
import { UnitManager } from './UnitManager'
import { EventEmitter } from 'events'
import { RectangleSelector } from './ui/RectangleSelector'
import { Draggable } from './Draggable'
import { ClickHandler } from './types'

export class Map extends EventEmitter {
  width: number
  height: number
  unitManager: UnitManager | null
  group: SVG.G
  coll: SVG.Rect
  pos: Point2d = Point2d.zero()
  clickHandler: null | ClickHandler = null

  constructor(
    readonly doc: SVG.Doc,
    readonly rectangleSelector: RectangleSelector
  ) {
    super()
    this.width = 80
    this.height = 80
    const width = 2000
    const height = 2000
    this.unitManager = null
    this.group = this.doc.group()
    this.coll = this.doc.rect(width, height).move(0, 0)
    this.group.add(this.coll)
    this.coll.attr({
      fill: '#7f7'
    })
    const draggable = new Draggable(this.doc, this.coll)
    draggable.drag(
      pos => {
        rectangleSelector.start(pos.x, pos.y)
      },
      diff => {
        rectangleSelector.move(diff.x, diff.y)
      },
      () => {
        rectangleSelector.end()
        if (this.unitManager) {
          const units = this.unitManager.getTrainableUnits().filter(unit => {
            return rectangleSelector.isContained(this.global2screen(unit.pos))
          })
          this.unitManager.select(units)
          this.emit('selected', units)
        }
      }
    )

    this.coll.mousedown(e => {
      const pos = this.screen2global(e.pageX, e.pageY)
      if (this.clickHandler) {
        this.clickHandler(
          e,
          () => {
            this.emit('click', {
              pos: pos
            })
            this.unitManager?.select([])
          },
          () => {
            this.emit('target', {
              pos: pos
            })
            this.unitManager?.select([])
          }
        )
      }
    })
    window.addEventListener(
      'contextmenu',
      function(e) {
        e.preventDefault()
      },
      false
    )
  }

  setUnitManager(unitManager: UnitManager) {
    this.unitManager = unitManager
    this.unitManager.setMap(this)
    this.group.add(this.unitManager.group)
    this.unitManager.on('click', e => {
      this.emit('selected', [e.unit])
    })
  }

  setClickHandler(clickHandler) {
    this.clickHandler = clickHandler
  }

  screen2global(x: number, y: number) {
    return new Point2d(x, y).sub(this.pos)
  }

  global2screen(pos: Point2d) {
    return pos.add(this.pos)
  }

  move(x: number, y: number) {
    this.pos = this.pos.add(new Point2d(x, y))
    this.applyDisplay()
  }

  applyDisplay() {
    const myMatrix = new SVG.Matrix()
    this.group.matrix(myMatrix.translate(this.pos.x, this.pos.y))
  }

  hit(targetUnit: Unit) {
    if (!this.unitManager) {
      throw new Error('unitManager must not be null')
    }
    return (
      this.unitManager
        .getUnits()
        .filter(function(unit) {
          return unit.id != targetUnit.id
        })
        .map(function(u) {
          return u.collBound()
        })
        .filter(function(bound) {
          const targetBound = targetUnit.collBound()
          return (
            bound.x < targetBound.x + targetBound.w &&
            targetBound.x < bound.x + bound.w &&
            bound.y < targetBound.y + targetBound.h &&
            targetBound.y < bound.y + bound.h
          )
        }).length > 0
    )
  }

  getCollGraph(_options: { except: any }): any[][] {
    if (!this.unitManager) {
      throw new Error('unitManager must not be null')
    }
    const options = _options || {}
    const graph: any[][] = []
    for (let i = 0; i < this.width; i++) {
      const wGraph: number[] = []
      for (let j = 0; j < this.height; j++) {
        wGraph.push(1)
      }
      graph.push(wGraph)
    }
    this.unitManager
      .getCollUnits()
      .map(function(u: Unit) {
        let w: number
        let h: number
        if (Array.isArray(u.info.size) && u.info.size.length == 2) {
          w = u.info.size[0]
          h = u.info.size[1]
        } else {
          w = u.info.size as number
          h = u.info.size as number
        }
        return {
          x: u.tilePos.x,
          y: u.tilePos.y,
          w: w,
          h: h
        }
      })
      .forEach(function(p) {
        for (let i = p.x; i < p.x + p.w; i++) {
          for (let j = p.y; j < p.y + p.h; j++) {
            graph[i][j] = 0
          }
        }
      })
    if (options.except) {
      options.except.forEach(e => {
        graph[e.x][e.y] = 1
      })
    }
    return graph
  }
}
