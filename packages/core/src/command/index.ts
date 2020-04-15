interface CreatePlayerCommand {
  type: 'CreatePlayerCommand'
  id: string
  playerType: string
  color: number
  isOwner: boolean
}

interface CreateUnitCommand {
  type: 'CreateUnitCommand'
  id: string
  unit: string
  player: string
  x: number
  y: number
}

interface MoveUnitCommand {
  type: 'MoveUnitCommand'
  id: string
  pos: {
    x: number
    y: number
  }
}

export type Command = CreatePlayerCommand | CreateUnitCommand | MoveUnitCommand
