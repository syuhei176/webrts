import SVG from 'svg.js'
import { Point2d, Rectangle2D } from '@webrts/math2d'

export class RectangleSelector {
  rect: Rectangle2D
  startPos: Point2d
  graphic: null | SVG.Rect
  constructor(readonly doc: SVG.Doc) {
    this.rect = new Rectangle2D(0, 0, 0, 0)
    this.startPos = Point2d.zero()
    this.graphic = null
  }
  start(x: number, y: number) {
    this.rect.x = x
    this.rect.y = y
    this.startPos.x = x
    this.startPos.y = y
    this.graphic = this.doc.rect(1, 1).move(x, y)
    this.graphic.attr({
      fill: 'none',
      stroke: '#333',
      strokeWidth: 2
    })
  }

  end() {
    this.graphic?.remove()
  }

  move(dx: number, dy: number) {
    if (dx < 0) this.rect.x = this.startPos.x + dx
    if (dy < 0) this.rect.y = this.startPos.y + dy
    this.rect.width = Math.abs(dx)
    this.rect.height = Math.abs(dy)
    this.graphic?.attr({
      x: this.rect.x,
      y: this.rect.y,
      width: this.rect.width,
      height: this.rect.height
    })
  }
  isContained(pos: Point2d) {
    return this.rect.contains(pos.x, pos.y)
  }
}
