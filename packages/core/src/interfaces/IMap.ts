import { Unit } from '../Unit'
import { UnitManager } from '../UnitManager'

export interface IMap {
  width: number
  height: number
  getCollGraph(unitManager: UnitManager, _options: {}): any[]
}
