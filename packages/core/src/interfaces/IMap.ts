import { Unit } from '../Unit'
import { UnitManager } from '../UnitManager'

export interface IMap {
  getCollGraph(unitManager: UnitManager, _options: {}): any[]
}
