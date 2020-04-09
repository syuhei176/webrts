import SVG, { Point } from 'svg.js'
import { Point2d } from '@webrts/math2d'

export class Draggable {
  private isDragging = false
  private startPos: Point2d = Point2d.zero()
  constructor(readonly doc: SVG.Doc, readonly coll: SVG.Element) {}

  drag(
    onDragStart: (pos: Point2d) => void,
    onDragMove: (diff: Point2d) => void,
    onDragEnd: () => void
  ) {
    this.coll.mousedown((e: any) => {
      this.isDragging = true
      this.startPos.setLocation(e.x, e.y)
      onDragStart(this.startPos)
    })
    this.coll.mousemove((e: any) => {
      if (this.isDragging) {
        onDragMove(Point2d.sub(new Point2d(e.x, e.y), this.startPos))
      }
    })
    this.doc.on('mouseup', (e: any) => {
      this.isDragging = false
      onDragEnd()
    })
  }
}
