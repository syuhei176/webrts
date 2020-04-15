import { EventEmitter } from 'events'

const colors = ['#00f', '#f00', '#0f0']

export enum PlayerType {
  HUMAN = 'HUMAN',
  ENEMY = 'ENEMY',
  GAIA = 'GAIA'
}

export interface Resources {
  tree: number
  food: number
  stone: number
  metal: number
}

export class Player extends EventEmitter {
  public resources: Resources
  constructor(
    readonly id: string,
    readonly type: PlayerType,
    readonly colorNumber: number
  ) {
    super()
    this.resources = {
      tree: 0,
      food: 0,
      stone: 0,
      metal: 0
    }
  }

  get color(): string {
    return colors[this.colorNumber]
  }

  getResource(type: string) {
    return this.resources[type]
  }

  addResource(type: string, inc: number) {
    this.resources[type] += inc
    this.emit('update', this)
  }

  useResource(type: string, amount) {
    if (this.resources[type] >= amount) {
      this.resources[type] -= amount
      this.emit('update', this)
      return true
    }
    return false
  }
}
