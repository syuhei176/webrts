import { Unit } from './Unit'
import { IGraphic } from './interfaces/IGraphic'
import { IMap } from './interfaces/IMap'
import { Player } from './Player'
import { UnitInfo } from './Unit'
import { UnitManager } from './UnitManager'

export enum NatureUnitStatus {
  BUILDING,
  NORMAL
}
export class NatureUnit extends Unit {
  amount: number
  constructor(
    graphic: IGraphic,
    info: UnitInfo,
    map: IMap,
    unitManager: UnitManager,
    player: Player
  ) {
    super(graphic, info, map, unitManager, player)
    this.amount = 100
  }

  decrease(amount: number) {
    this.amount -= amount
    if (this.amount < 0) {
      const left = -1 * this.amount
      this.amount = 0
      this.unitManager.remove(this.id)
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
