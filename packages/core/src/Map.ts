import SVG from 'svg.js'
import { Unit } from './Unit'
import { Point2d } from '@webrts/math2d'
import { UnitManager } from './UnitManager'
import { EventEmitter } from 'events'
import { RectangleSelector } from './ui/RectangleSelector'
import { Draggable } from './Draggable'
import { ClickHandler } from './types'

/**
 * @name Map
 */
export class Map extends EventEmitter {
  public width: number
  public height: number
  group: SVG.G
  coll: SVG.Rect
  // map position
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
        this.emit('selected', rectangleSelector)
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
          },
          () => {
            this.emit('target', {
              pos: pos
            })
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

  appendGraphicElement(g: SVG.G) {
    this.group.add(g)
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

  getCollGraph(unitManager: UnitManager, _options: { except: any }): any[][] {
    const options = _options || {}
    const walkable = 0
    const notWalkable = 1
    const graph: number[][] = new Array()
    for (let i = 0; i < this.height; i++) {
      const wGraph: number[] = []
      for (let j = 0; j < this.width; j++) {
        wGraph.push(walkable)
      }
      graph.push(wGraph)
    }
    unitManager
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
            graph[j][i] = notWalkable
          }
        }
      })
    if (options.except) {
      options.except.forEach(e => {
        graph[e.y][e.x] = walkable
      })
    }
    return graph
  }
}
