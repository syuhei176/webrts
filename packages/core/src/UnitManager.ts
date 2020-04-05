import { EventEmitter } from 'events'
import SVG from 'svg.js'
import { Unit } from './Unit'
import { IMap } from './interfaces/IMap'
import { Player } from './Player'
import { Point2d } from '@webrts/math2d'
import { NatureUnit } from './NatureUnit'
import { BaseBuildingUnit } from './Building'
import { MobileUnit } from './MobileUnit'
import { UnitGraphic } from './UnitGraphic'

export interface UnitDef {
  id: string
}

/**
 * @name UnitManager
 */
export class UnitManager extends EventEmitter {
  private metaUnits: Map<string, UnitDef> = new Map<string, UnitDef>()
  private units: Map<string, Unit> = new Map<string, Unit>()
  public group: SVG.G
  private selected: Unit[]
  private cursors: SVG.Circle[]
  private map: IMap | null = null
  clickHandler: (e: any, a: () => void, b: () => void) => void = function(e) {}
  constructor(readonly doc: SVG.Doc) {
    super()
    this.group = doc.group()
    this.selected = []
    this.cursors = []
  }

  setMap(map: IMap) {
    this.map = map
  }
  setClickHandler(clickHandler) {
    this.clickHandler = clickHandler
  }

  load(units: UnitDef[]) {
    units.map(unit => {
      this.metaUnits[unit.id] = unit
    })
  }

  main() {
    for (let unit of this.units.values()) {
      unit.main()
    }
  }

  create(metaUnitId: string, player: Player) {
    if (!this.map) {
      throw new Error('map must not be null')
    }
    var metaUnit = this.metaUnits[metaUnitId]
    var ug = new UnitGraphic(
      this.doc,
      this.group,
      {
        path: metaUnit.graphic.path,
        width: metaUnit.graphic.width,
        height: metaUnit.graphic.height
      },
      () => {}
    )
    let person: Unit
    if (metaUnit.unitinfo.type == 'nature') {
      person = new NatureUnit(ug, metaUnit.unitinfo, this.map, player)
    } else if (metaUnit.unitinfo.type == 'building') {
      person = new BaseBuildingUnit(ug, metaUnit.unitinfo, this.map, player)
    } else {
      person = new MobileUnit(ug, metaUnit.unitinfo, this.map, player)
    }
    person.on('click', e => {
      this.clickHandler(
        e,
        () => {
          this.select([person])
          this.emit('click', { unit: person, event: e })
        },
        () => {
          this.emit('target', { unit: person, event: e })
        }
      )
      /*
      this.on('click'
        e,
        () => {
          this.select([person])
          this.emit('click', { unit: person, event: e })
        },
        () => {
          this.emit('target', { unit: person, event: e })
        }
      )
      */
    })
    this.units[person.id] = person
    return person
  }

  remove(id: string) {
    this.units.get(id)?.remove()
    this.units.delete(id)
  }

  getUnits() {
    return Object.keys(this.units).map(k => {
      return this.units[k]
    })
  }

  getTrainableUnits() {
    return Object.keys(this.units)
      .map(k => {
        return this.units[k]
      })
      .filter(unit => {
        return unit.info.type == 'trainable'
      })
  }

  getCollUnits() {
    return Object.keys(this.units).map(k => {
      return this.units[k]
    })
  }

  getNearNature() {
    return Object.keys(this.units)
      .map(k => {
        return this.units[k]
      })
      .filter(unit => {
        return unit.info.type == 'nature'
      })
  }

  getNearBuilding() {
    return Object.keys(this.units)
      .map(k => {
        return this.units[k]
      })
      .filter(unit => {
        return unit.info.type == 'building'
      })
  }

  getNearTrainableUnits(selfUnit: Unit, player: Player) {
    const units: Unit[] = []
    for (let unit of this.units.values()) {
      units.push(unit)
    }
    return units
      .filter(unit => {
        return unit.info.type == 'trainable' && unit.player.type != player.type
      })
      .filter(unit => {
        var dis = Point2d.distance(selfUnit.pos, unit.pos)
        return dis < 18 * 18
      })
  }

  select(target: Unit[]) {
    this.selected = target
    this.cursors.forEach(c => {
      c.remove()
    })
    if (this.selected) {
      this.cursors = this.selected.map(u => {
        const circle = this.doc.circle(50).move(40, 40)
        circle.attr({
          fill: 'none',
          stroke: '#1010f0',
          strokeWidth: 3
        })
        u.graphic.addSVGElement(circle)
        return circle
      })
    }
  }
}
