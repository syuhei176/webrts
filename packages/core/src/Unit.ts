import { IMap } from './interfaces/IMap'
import { Player } from './Player'

import { v1 } from 'uuid'
import { IGraphic } from './interfaces/IGraphic'
import { Point2d } from '@webrts/math2d'
import { EventEmitter } from 'events'

export interface UnitInfo {
  size: number[] | number
  type: string
}

export class Unit extends EventEmitter {
  public id: string
  public pos: Point2d
  constructor(
    readonly graphic: IGraphic,
    readonly info: UnitInfo,
    readonly map: IMap,
    readonly player: Player
  ) {
    super()
    this.id = v1()
    this.pos = new Point2d(0, 0)
    if (info.size instanceof Array) {
      this.graphic.setSize(info.size[0] * 50, info.size[1] * 50)
    } else {
      this.graphic.setSize(info.size * 50, info.size * 50)
    }
    this.graphic.click(e => {
      console.log('mouseup', e.button)
      this.emit('click', e)
    })
    this.graphic.setPlayerColor(this.player.color)
  }
  remove() {
    this.graphic.remove()
  }
  collBound() {
    var offset = 5
    var info = this.info
    if (info.type == 'trainable') offset = 5
    if (Array.isArray(info.size)) {
      var w = info.size[0] * 50
      var h = info.size[1] * 50
    } else {
      var w = info.size * 50
      var h = info.size * 50
    }
    return {
      x: this.pos.x + offset,
      y: this.pos.y + offset,
      w: w - offset * 2,
      h: h - offset * 2
    }
  }

  setPos(x: number, y: number) {
    this.pos.setLocation(x, y)
    this.graphic.setPos(x, y)
  }

  get tilePos() {
    return new Point2d(Math.floor(this.pos.x / 50), Math.floor(this.pos.y / 50))
  }

  setTilePos(x: number, y: number) {
    x *= 50
    y *= 50
    this.pos.setLocation(x, y)
    this.graphic.setPos(x, y)
  }

  main() {}
}
