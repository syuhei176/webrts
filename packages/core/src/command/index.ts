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

interface MoveToEnemyCommand {
  type: 'MoveToEnemyCommand'
  id: string
  targetId: string
}

interface MoveToTargetCommand {
  type: 'MoveToTargetCommand'
  id: string
  targetId: string
}

interface TrainUnitCommand {
  type: 'TrainUnitCommand'
  id: string
  newUnitId: string
}

export type Command =
  | CreatePlayerCommand
  | CreateUnitCommand
  | MoveUnitCommand
  | MoveToEnemyCommand
  | MoveToTargetCommand
  | TrainUnitCommand
