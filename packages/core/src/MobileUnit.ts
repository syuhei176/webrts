import { Unit } from './Unit'
import { IGraphic } from './interfaces/IGraphic'
import { IMap } from './interfaces/IMap'
import { Player } from './Player'
import { UnitInfo } from './Unit'
import { Point2d } from '@webrts/math2d'
import { NatureUnit } from './NatureUnit'
//var logger = require('../util/log').logger('BaseMobileUnit')
import astar from '@webrts/algorithm'

enum MobileUnitStatus {
  WAITING = 'WAITING',
  MOVING_TO_POS = 'MOVING_TO_POS',
  MOVING_TO_BUILDING = 'MOVING_TO_BUILDING',
  MOVING_TO_RESOURCE = 'MOVING_TO_RESOURCE',
  MOVING_TO_UNIT = 'MOVING_TO_UNIT',
  RETURNING = 'RETURNING',
  ATTACKING = 'ATTACKING',
  GATHERING = 'GATHERING',
  REPAIRING = 'REPAIRING',
  BUILDING = 'BUILDING',
  DYING = 'DYING'
}

export class MobileUnitContext {
  constructor(
    public status: MobileUnitStatus = MobileUnitStatus.WAITING,
    public dest: Point2d = Point2d.zero(),
    public target: MobileUnit | NatureUnit | null = null,
    public gatheringAmount: number = 0
  ) {}
}

export class MobileUnit extends Unit {
  context: MobileUnitContext = new MobileUnitContext()
  hp = 50
  attack = 5
  range = 3
  speed = 4
  nextDestination: any = null
  queue: any[] = []
  count = 0
  count2 = 0
  moveToPosLoop = 0
  vec: Point2d = Point2d.zero()
  constructor(graphic: IGraphic, info: UnitInfo, map: IMap, player: Player) {
    super(graphic, info, map, player)
  }

  getInfo() {
    return (
      '<div><span>hp:</span>' +
      this.hp +
      '</div>' +
      '<div><span>gathering:</span>' +
      this.context.gatheringAmount +
      '</div>' +
      '<div><span>count:</span>' +
      this.count +
      '</div>' +
      '<div><span>count2:</span>' +
      this.count2 +
      '</div>' +
      '<div><span>status:</span>' +
      this.context.status +
      '</div>'
    )
  }
  attacked(atk) {
    this.hp -= atk
    if (this.hp <= 0) return { alive: false }
    this.graphic.flashing()
    return { alive: true }
  }
  main() {
    switch (this.context.status) {
      case MobileUnitStatus.WAITING:
        this.executeWaiting(event)
        break
      case MobileUnitStatus.MOVING_TO_POS:
        this.executeMovingToPos(event)
        break
      case MobileUnitStatus.MOVING_TO_BUILDING:
        this.executeMovingToBuilding(event)
        break
      case MobileUnitStatus.MOVING_TO_RESOURCE:
        this.executeMovingToResource(event)
        break
      case MobileUnitStatus.MOVING_TO_UNIT:
        this.executeMovingToUnit(event)
        break
      case MobileUnitStatus.RETURNING:
        this.executeReturning(event)
        break
      case MobileUnitStatus.ATTACKING:
        this.executeAttacking(event)
        break
      case MobileUnitStatus.GATHERING:
        this.executeGathering(event)
        break
      case MobileUnitStatus.REPAIRING:
        this.executeRepairing(event)
        break
      case MobileUnitStatus.BUILDING:
        break
      case MobileUnitStatus.DYING:
        this.executeDying(event)
        break
    }
  }

  changeStatus(status) {
    this.context.status = status
    this.graphic.setStatus(this.context.status)
  }

  executeWaiting(event) {
    this.moveToPosLoop = 0
    this.count--
    if (this.count <= 0 && this.map.unitManager) {
      this.count = 60
      const units = this.map.unitManager.getNearTrainableUnits(
        this,
        this.player
      )
      if (units.length > 0) {
        this.moveToEnemy(units[0])
      }
    }
  }

  executeMovingToPos(event) {
    this.movingProcess()
    if (!this.context.dest) return
    const distance = Point2d.distance(this.pos, this.context.dest)
    if (distance < 80) {
      // Reach destination
      this.changeStatus(MobileUnitStatus.WAITING)
    }
  }
  executeMovingToBuilding(event) {
    this.movingProcess()
    const distance = Point2d.distance(this.pos, this.context.target?.pos)
    if (distance < 80) {
      // Reach destination
      this.changeStatus(MobileUnitStatus.WAITING)
    }
  }

  executeMovingToResource(event) {
    this.movingProcess()
    const distance = Point2d.distance(this.pos, this.context.target?.pos)
    if (distance < 22) {
      this.count = 20
      this.changeStatus(MobileUnitStatus.GATHERING)
    }
  }

  executeMovingToUnit(event) {
    this.movingProcess()
    const dis = Point2d.distance(this.pos, this.context.target?.pos)
    if (dis < 80) {
      this.count = 20
      this.changeStatus(MobileUnitStatus.ATTACKING)
    }
  }
  executeReturning(event) {
    this.movingProcess()
    const dis = Point2d.distance(this.pos, this.context.target?.pos)
    if (dis < 80 && this.map.unitManager) {
      this.player.addResource('tree', this.context.gatheringAmount)
      this.context.gatheringAmount = 0
      this.count = 20
      const nature = this.map.unitManager.getNearNature()
      this.context.target = nature[0]
      this.moveToTarget(this.context.target)
    }
  }

  executeAttacking(event) {
    this.movingProcess()
    const dis = Point2d.distance(this.pos, this.context.target?.pos)
    if (dis < 80) {
      this.count--
      if (this.count <= 0 && this.context.target instanceof MobileUnit) {
        this.count = 20
        const attackedResult = this.context.target.attacked(this.attack)
        if (attackedResult && !attackedResult.alive) {
          setTimeout(() => {
            if (this.context.target) {
              this.map.unitManager?.remove(this.context.target.id)
            }
            this.changeStatus(MobileUnitStatus.WAITING)
          }, 20)
        }
      }
    } else {
      this.moveToTarget(this.context.target)
    }
  }

  executeGathering(event) {
    this.count--
    if (this.count <= 0 && this.context.target instanceof NatureUnit) {
      this.count = 20
      this.context.gatheringAmount += this.context.target.decrease(1)
      if (this.context.gatheringAmount >= 10 && this.map.unitManager) {
        const buildings = this.map.unitManager.getNearBuilding()
        this.returnToTarget(buildings[0])
      }
    }
  }

  executeRepairing(event) {
    throw new Error('method not implemented.')
  }

  executeDying(event) {
    throw new Error('method not implemented.')
  }

  randomMove() {
    const r = Math.random() * 20
    this.pos = this.pos.add(new Point2d(r, 20 - r))
  }

  movingProcess() {
    if (this.nextDestination) {
      //次の目的地がある場合
      this.pos = this.pos.add(this.vec)
      if (this.map.hit(this)) {
        this.pos = this.pos.sub(this.vec)
        this.count2--
        if (this.count2 <= 0) {
          //moving_to_unitが続くとき
          //random move
          this.randomMove()
          //this.changeStatus(MobileUnitContext.STATUS.WAITING);
        } else if (this.count2 <= 0) {
          if (this.context.status == MobileUnitStatus.MOVING_TO_POS) {
            this.moveToPosLoop++
            if (this.moveToPosLoop <= 1) {
              this.moveToPos(this.context.dest)
            } else {
              //moving_to_posが続くとき
              this.changeStatus(MobileUnitStatus.WAITING)
            }
          } else {
            this.moveToTarget(this.context.target)
          }
        }
      } else {
        this.count--
      }
      this.graphic.setPos(this.pos.x, this.pos.y)
      //nextDestinationについた場合
      if (this.count <= 0) this.nextDestination = null
    } else {
      //次の目的地がない場合
      this.count = 0
      this.nextDestination = this.queue.shift()
      if (this.nextDestination) {
        const vec = this.nextDestination.sub(this.pos)
        this.graphic.rotate((Math.atan(vec.y / vec.x) / Math.PI) * 180 + 90)
        this.vec = vec.times(1 / 50)
        this.count = 50
        this.count2 = 200
      } else {
        if (this.context.status == MobileUnitStatus.MOVING_TO_UNIT) {
          this.moveToTarget(this.context.target)
          const dis = Point2d.distance(this.pos, this.context.target?.pos)
          if (dis >= 90 * 90) {
            this.changeStatus(MobileUnitStatus.WAITING)
          }
        } else {
          this.changeStatus(MobileUnitStatus.WAITING)
        }
      }
    }
  }

  move(d) {
    this.queue.push(d)
  }

  moveToPos(pos) {
    this.makeRoute(pos)
    this.changeStatus(MobileUnitStatus.MOVING_TO_POS)
    this.context.dest = new Point2d(pos.x, pos.y)
  }

  moveToEnemy(unit) {
    this.makeRoute(unit.pos)
    this.changeStatus(MobileUnitStatus.MOVING_TO_UNIT)
    this.context.target = unit
  }

  moveToTarget(unit) {
    if (unit.info.type == 'nature') {
      this.makeRoute(unit.pos)
      this.changeStatus(MobileUnitStatus.MOVING_TO_RESOURCE)
      this.context.target = unit
      return true
    } else if (unit.info.type == 'building') {
      this.makeRoute(unit.pos)
      this.changeStatus(MobileUnitStatus.MOVING_TO_BUILDING)
      this.context.target = unit
      return true
    } else {
      return false
    }
  }

  returnToTarget(unit) {
    if (unit.info.type == 'building') {
      this.makeRoute(unit.pos)
      this.changeStatus(MobileUnitStatus.RETURNING)
      this.context.target = unit
    } else {
      throw new Error('invalid unit type')
    }
  }

  makeRoute(x: number | Point2d, y?: number) {
    if (x instanceof Point2d) {
      y = x.y
      x = x.x
    }
    if (!y) {
      throw new Error('invalid y')
    }

    //clear
    this.count = 0
    this.queue = []
    this.nextDestination = null

    const startPos = this.tilePos
    const endPos = new Point2d(Math.floor(x / 50), Math.floor(y / 50))

    const collGraph = this.map.getCollGraph({
      except: [startPos, endPos]
    })
    const graph = new astar.Graph(collGraph)
    //    logger('walkFrom', startPos.x, startPos.y)
    //  logger('walkTo', endPos.x, endPos.y)
    const start = graph.grid[startPos.x][startPos.y]
    const end = graph.grid[endPos.x][endPos.y]
    const result = astar.astar.search(graph, start, end)

    result.map(gridNode => {
      this.queue.push(new Point2d(gridNode.x * 50, gridNode.y * 50))
    })
  }
}
