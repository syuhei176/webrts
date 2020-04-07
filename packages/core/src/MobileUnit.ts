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
  hp: number = 50
  attack: number = 5
  range: number = 3
  speed: number = 4
  nextDestination: any = null
  queue: any[] = []
  count: number = 0
  count2: number = 0
  move_to_pos_loop: number = 0
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
        this.execute_waiting(event)
        break
      case MobileUnitStatus.MOVING_TO_POS:
        this.execute_moving_to_pos(event)
        break
      case MobileUnitStatus.MOVING_TO_BUILDING:
        this.execute_moving_to_building(event)
        break
      case MobileUnitStatus.MOVING_TO_RESOURCE:
        this.execute_moving_to_resource(event)
        break
      case MobileUnitStatus.MOVING_TO_UNIT:
        this.execute_moving_to_unit(event)
        break
      case MobileUnitStatus.RETURNING:
        this.execute_returning(event)
        break
      case MobileUnitStatus.ATTACKING:
        this.execute_attacking(event)
        break
      case MobileUnitStatus.GATHERING:
        this.execute_gathering(event)
        break
      case MobileUnitStatus.REPAIRING:
        this.execute_repairing(event)
        break
      case MobileUnitStatus.BUILDING:
        break
      case MobileUnitStatus.DYING:
        this.execute_dying(event)
        break
    }
  }
  change_status(status) {
    this.context.status = status
    this.graphic.setStatus(this.context.status)
  }

  execute_waiting(event) {
    this.move_to_pos_loop = 0
    this.count--
    if (this.count <= 0 && this.map.unitManager) {
      this.count = 60
      var units = this.map.unitManager.getNearTrainableUnits(this, this.player)
      if (units.length > 0) {
        this.move_to_enemy(units[0])
      }
    }
  }

  execute_moving_to_pos(event) {
    this.movingProcess()
    if (!this.context.dest) return
    const distance = Point2d.distance(this.pos, this.context.dest)
    if (distance < 80) {
      // Reach destination
      this.change_status(MobileUnitStatus.WAITING)
    }
  }
  execute_moving_to_building(event) {
    this.movingProcess()
    const distance = Point2d.distance(this.pos, this.context.target?.pos)
    if (distance < 80) {
      // Reach destination
      this.change_status(MobileUnitStatus.WAITING)
    }
  }

  execute_moving_to_resource(event) {
    this.movingProcess()
    const distance = Point2d.distance(this.pos, this.context.target?.pos)
    if (distance < 22) {
      this.count = 20
      this.change_status(MobileUnitStatus.GATHERING)
    }
  }

  execute_moving_to_unit(event) {
    this.movingProcess()
    var dis = Point2d.distance(this.pos, this.context.target?.pos)
    if (dis < 80) {
      this.count = 20
      this.change_status(MobileUnitStatus.ATTACKING)
    }
  }
  execute_returning(event) {
    this.movingProcess()
    var dis = Point2d.distance(this.pos, this.context.target?.pos)
    if (dis < 80 && this.map.unitManager) {
      this.player.addResource('tree', this.context.gatheringAmount)
      this.context.gatheringAmount = 0
      this.count = 20
      var nature = this.map.unitManager.getNearNature()
      this.context.target = nature[0]
      this.move_to_target(this.context.target)
    }
  }

  execute_attacking(event) {
    var that = this
    this.movingProcess()
    var dis = Point2d.distance(this.pos, this.context.target?.pos)
    if (dis < 80) {
      this.count--
      if (this.count <= 0 && this.context.target instanceof MobileUnit) {
        this.count = 20
        var attackedResult = this.context.target.attacked(this.attack)
        if (attackedResult && !attackedResult.alive) {
          setTimeout(() => {
            if (this.context.target) {
              this.map.unitManager?.remove(this.context.target.id)
            }
            this.change_status(MobileUnitStatus.WAITING)
          }, 20)
        }
      }
    } else {
      this.move_to_target(this.context.target)
    }
  }

  execute_gathering(event) {
    this.count--
    if (this.count <= 0 && this.context.target instanceof NatureUnit) {
      this.count = 20
      this.context.gatheringAmount += this.context.target.decrease(1)
      if (this.context.gatheringAmount >= 10 && this.map.unitManager) {
        var buildings = this.map.unitManager.getNearBuilding()
        this.return_to_target(buildings[0])
      }
    }
  }

  execute_repairing(event) {}

  execute_dying(event) {}

  random_move() {
    var r = Math.random() * 20
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
          this.random_move()
          //this.change_status(MobileUnitContext.STATUS.WAITING);
        } else if (this.count2 <= 0) {
          if (this.context.status == MobileUnitStatus.MOVING_TO_POS) {
            this.move_to_pos_loop++
            if (this.move_to_pos_loop <= 1) {
              this.move_to_pos(this.context.dest)
            } else {
              //moving_to_posが続くとき
              this.change_status(MobileUnitStatus.WAITING)
            }
          } else {
            this.move_to_target(this.context.target)
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
        var vec = this.nextDestination.sub(this.pos)
        this.graphic.rotate((Math.atan(vec.y / vec.x) / Math.PI) * 180 + 90)
        this.vec = vec.times(1 / 50)
        this.count = 50
        this.count2 = 200
      } else {
        if (this.context.status == MobileUnitStatus.MOVING_TO_UNIT) {
          this.move_to_target(this.context.target)
          var dis = Point2d.distance(this.pos, this.context.target?.pos)
          if (dis >= 90 * 90) {
            this.change_status(MobileUnitStatus.WAITING)
          }
        } else {
          this.change_status(MobileUnitStatus.WAITING)
        }
      }
    }
  }

  move(d) {
    this.queue.push(d)
  }

  move_to_pos(pos) {
    this.make_route(pos)
    this.change_status(MobileUnitStatus.MOVING_TO_POS)
    this.context.dest = new Point2d(pos.x, pos.y)
  }

  move_to_enemy(unit) {
    this.make_route(unit.pos)
    this.change_status(MobileUnitStatus.MOVING_TO_UNIT)
    this.context.target = unit
  }

  move_to_target(unit) {
    if (unit.info.type == 'nature') {
      this.make_route(unit.pos)
      this.change_status(MobileUnitStatus.MOVING_TO_RESOURCE)
      this.context.target = unit
      return true
    } else if (unit.info.type == 'building') {
      this.make_route(unit.pos)
      this.change_status(MobileUnitStatus.MOVING_TO_BUILDING)
      this.context.target = unit
      return true
    } else {
      return false
    }
  }

  return_to_target(unit) {
    if (unit.info.type == 'building') {
      this.make_route(unit.pos)
      this.change_status(MobileUnitStatus.RETURNING)
      this.context.target = unit
    } else {
      throw new Error('invalid unit type')
    }
  }

  make_route(x: number | Point2d, y?: number) {
    if (x instanceof Point2d) {
      y = x.y
      x = x.x
    }
    if (!y) {
      throw new Error('invalid y')
    }
    var that = this

    //clear
    this.count = 0
    this.queue = []
    this.nextDestination = null

    var startPos = this.tilePos
    var endPos = new Point2d(Math.floor(x / 50), Math.floor(y / 50))

    var collGraph = this.map.getCollGraph({
      except: [startPos, endPos]
    })
    var graph = new astar.Graph(collGraph)
    //    logger('walkFrom', startPos.x, startPos.y)
    //  logger('walkTo', endPos.x, endPos.y)
    var start = graph.grid[startPos.x][startPos.y]
    var end = graph.grid[endPos.x][endPos.y]
    var result = astar.astar.search(graph, start, end)

    result.map(function(gridNode) {
      that.queue.push(new Point2d(gridNode.x * 50, gridNode.y * 50))
    })
  }
}
