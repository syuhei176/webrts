import { IGraphic } from './interfaces/IGraphic'
import { IMap } from './interfaces/IMap'
import { Player } from './Player'
import { UnitInfo, Unit } from './Unit'
import { Point2d } from '@webrts/math2d'
import { MobileUnit } from './MobileUnit'

enum BuildingStatus {
  WAITING,
  PROCESSING
}

export class BaseBuildingUnit extends Unit {
  status: BuildingStatus = BuildingStatus.WAITING
  count: number
  queue: any[]
  processing_job: any

  constructor(graphic: IGraphic, info: UnitInfo, map: IMap, player: Player) {
    super(graphic, info, map, player)
    this.queue = []
    this.processing_job = null
    this.count = 0
  }

  main() {
    switch (this.status) {
      case BuildingStatus.WAITING:
        const newUnit = this.queue.shift()
        this.processing_job = newUnit
        this.status = BuildingStatus.PROCESSING
        this.count = 100
        break
      case BuildingStatus.PROCESSING:
        this.count--
        if (this.count <= 0) {
          if (this.processing_job) {
            var unit = this.map.unitManager?.create(
              'villager',
              this.player
            ) as MobileUnit
            if (unit) {
              unit.setPos(this.pos.x - 100, this.pos.y)
              var pos = new Point2d(this.pos.x - 100, this.pos.y + 120)
              unit.move_to_pos(pos)
            }
          }
          this.status = BuildingStatus.WAITING
        }
        break
    }
  }

  addUnitCreationQueue() {
    this.queue.push({})
  }

  getInfo() {
    return '<div>' + this.queue.length + '</div>'
  }

  getPallet() {
    return '<div></div>'
  }
}
