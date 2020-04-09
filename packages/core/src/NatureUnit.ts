import { Unit } from './Unit'
import { IGraphic } from './interfaces/IGraphic'
import { IMap } from './interfaces/IMap'
import { Player } from './Player'
import { UnitInfo } from './Unit'

export enum NatureUnitStatus {
  BUILDING,
  NORMAL
}
export class NatureUnit extends Unit {
  amount: number
  constructor(graphic: IGraphic, info: UnitInfo, map: IMap, player: Player) {
    super(graphic, info, map, player)
    this.amount = 100
  }

  decrease(amount: number) {
    this.amount -= amount
    if (this.amount < 0) {
      const left = -1 * this.amount
      this.amount = 0
      this.map.unitManager?.remove(this.id)
      return amount - left
    } else {
      return amount
    }
  }

  main() {
    return
  }

  getInfo() {
    return '<div>' + this.amount + '</div>'
  }
}
