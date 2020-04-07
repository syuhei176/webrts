import SVG from 'svg.js'
import { Point2d } from '@webrts/math2d'
import { IGraphic } from './interfaces/IGraphic'

export class UnitGraphic implements IGraphic {
  group: SVG.G
  unitGroup: SVG.G
  bound: Point2d = Point2d.zero()
  _rotate: number = 0
  statusText: SVG.Text
  _width: number = 0
  _height: number = 0
  _scaleX: number = 0
  _scaleY: number = 0

  constructor(
    readonly doc: SVG.Doc,
    group: SVG.G,
    readonly options: any,
    onLoad: () => void
  ) {
    this.group = doc.group()
    this.unitGroup = doc.group()
    this.options = options
    group.add(this.group)
    const image = doc.image(options.path).size(options.width, options.height)
    onLoad()
    this.group.add(image)
    this.statusText = this.doc
      .text('')
      .move(0, 32)
      .attr({
        'font-size': 20
      })
    this.group.add(this.statusText)
  }

  addSVGElement(element: SVG.Element): void {
    this.group.add(element)
  }

  setPlayerColor(color: string) {
    var circle = this.doc.circle(16).move(0, 0)
    circle.attr({
      fill: color || '#00f'
    })
    this.group.add(circle)
  }

  setStatus(text: string) {
    this.statusText.attr({
      text: text
    })
  }

  flashing() {
    var text = this.doc
      .text('Damage')
      .move(0, 0)
      .attr({
        'font-size': 20
      })
    this.group.add(text)
    /*
    text.stop(false, false).attr(
      {
        'font-size': 32
      },
      100,
      null,
      function() {
        text.remove()
      }
    )
    */
  }

  remove() {
    this.group.remove()
  }

  click(cb: (e: any) => void) {
    this.group.mouseup(cb)
  }

  getPos() {}
  getWidth() {}

  setPos(x: number, y: number) {
    this.bound.x = x
    this.bound.y = y
    this.applyDisplay()
  }

  rotate(r: number) {
    this._rotate = r
    this.applyDisplay()
  }

  setSize(sizeX: number, sizeY: number) {
    this._width = sizeX
    this._height = sizeY
    this._scaleX = sizeX / this.options.width
    this._scaleY = sizeY / this.options.height
    this.applyDisplay()
  }

  applyDisplay() {
    var myMatrix = new SVG.Matrix()

    this.group.matrix(
      myMatrix
        .translate(
          this.bound.x + this._width / 2,
          this.bound.y + this._height / 2
        )
        .rotate(this._rotate)
        .scale(this._scaleX, this._scaleY)
        .translate(-(this.options.width / 2), -(this.options.height / 2))
    )
  }
}
