import { Unit } from '../Unit'
import { UnitManager } from '../UnitManager'

export interface IMap {
  unitManager: UnitManager | null
  getCollGraph(_options: {}): any[]
  hit(targetUnit: Unit): boolean
}
