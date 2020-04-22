import { IMap } from './interfaces/IMap'
import { Player } from './Player'

import { IGraphic } from './interfaces/IGraphic'
import { Point2d, Rectangle2D } from '@webrts/math2d'
import { EventEmitter } from 'events'
import { UnitManager } from './UnitManager'

export interface UnitInfo {
  size: number[] | number
  type: string
}

export abstract class Unit extends EventEmitter {
  public pos: Point2d
  public width: number = 0
  public height: number = 0
  constructor(
    readonly id: string,
    readonly graphic: IGraphic,
    readonly info: UnitInfo,
    readonly map: IMap,
    readonly unitManager: UnitManager,
    readonly player: Player
  ) {
    super()
    this.pos = new Point2d(0, 0)
    if (info.size instanceof Array) {
      this.width = info.size[0] * 50
      this.height = info.size[1] * 50
      this.graphic.setSize(info.size[0] * 50, info.size[1] * 50)
    } else {
      this.width = info.size * 50
      this.height = info.size * 50
      this.graphic.setSize(info.size * 50, info.size * 50)
    }
    this.graphic.setPlayerColor(this.player.color)
  }
  remove() {
    this.graphic.remove()
  }

  private getBound(offset: number) {
    return new Rectangle2D(
      this.pos.x + offset,
      this.pos.y + offset,
      this.width - offset * 2,
      this.height - offset * 2
    )
  }

  /**
   * get collision bound
   */
  collBound() {
    const info = this.info
    if (info.type == 'trainable') {
      return this.getBound(5)
    } else {
      return this.getBound(0)
    }
  }

  get bound() {
    return this.getBound(0)
  }

  /**
   * get position
   */
  get centerPos() {
    return new Point2d(
      this.pos.x + this.width / 2,
      this.pos.y + this.height / 2
    )
  }

  setPos(pos: Point2d) {
    this.pos.setLocation(pos.x, pos.y)
    this.graphic.setPos(pos.x, pos.y)
  }

  get tilePos() {
    return new Point2d(Math.floor(this.pos.x / 50), Math.floor(this.pos.y / 50))
  }

  setTilePos(x: number, y: number) {
    this.setPos(new Point2d(x * 50, y * 50))
  }

  abstract main(): void
}
