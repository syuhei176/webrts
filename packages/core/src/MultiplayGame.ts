import SVG from 'svg.js'
import { RectangleSelector } from './ui/RectangleSelector'
import { Camera } from './Camera'
import Platform from './platform'
import { ControlPanel } from './ui/controlPanel'
import { Menu } from './ui/menu'
import { Preloader } from './ui/preloader'
import { UnitManager } from './UnitManager'
import { Player, PlayerType } from './Player'
import { Unit } from './Unit'
import { BaseBuildingUnit } from './Building'
import { MobileUnit } from './MobileUnit'
import { Point2d } from '@webrts/math2d'
import { NetworkManager } from '@webrts/network'
import { showDebugGrid } from './debug'
import { v1 } from 'uuid'
import { Command } from './command'
import { EventEmitter } from 'events'
import { generateMap } from './MapGenerator'

export class MultiplayGameInitializer {
  networkManager: NetworkManager | null = null

  start(
    mainDom,
    requestAnimationFrame,
    unitInfo,
    roomName: string,
    isNewRoom: boolean,
    gameServerEndpoint: string
  ) {
    this.networkManager = new NetworkManager({
      room: roomName,
      createNew: isNewRoom,
      endpoint: gameServerEndpoint
    })
    this.networkManager.on('connected', () => {
      this.initUnitManager(mainDom, requestAnimationFrame, unitInfo, isNewRoom)
    })
    this.networkManager.start()
  }

  initUnitManager(
    mainDom: any,
    requestAnimationFrame: any,
    unitInfo: any,
    isNewRoom: boolean
  ) {
    if (!this.networkManager) {
      throw new Error('n.etworkManager must not be null')
    }

    const isDebugMode = false
    const debugGrid: SVG.Rect[][] = []
    const platform = Platform()
    const controlPanel = new ControlPanel(mainDom)
    const menu = new Menu(mainDom)
    const preloader = new Preloader(mainDom)
    preloader.show()
    const svgWrapper = document.createElement('div')
    svgWrapper.id = 'svgmain'
    const width = window.innerWidth
    const height = window.innerHeight
    mainDom.appendChild(svgWrapper)

    const doc = SVG('svgmain').size(width, height)
    const rectangleSelector = new RectangleSelector(doc)
    const map = new Camera(doc, rectangleSelector)
    const unitManager = new UnitManager(doc)
    unitManager.load(unitInfo)
    //map.generate(0);
    unitManager.setMap(map)
    map.appendGraphicElement(unitManager.group)

    const game = new MultiplayGame(this.networkManager, unitManager)
    game.subscribe()

    menu.update('tree', 0)

    game.on('init', player => {
      player.on('update', function() {
        menu.update('tree', player.getResource('tree'))
      })
    })

    if (isNewRoom) {
      const player1Id = game.addPlayer(PlayerType.HUMAN, true)
      const player2Id = game.addPlayer(PlayerType.HUMAN, false)
      const gaiaId = game.addPlayer(PlayerType.GAIA, false)
      generateMap(
        [player1Id, player2Id],
        gaiaId,
        (playerId: string, unit: string, x: number, y: number) => {
          game.createUnit(playerId, unit, x, y)
        }
      )
    }

    let selected: Unit[] | Unit | null = null
    map.on('target', e => {
      const moveToPos = (selected: Unit, pos: Point2d) => {
        if (
          selected instanceof MobileUnit &&
          selected.player &&
          game.isMe(selected.player.id)
        ) {
          game.directMovingToPos(selected, pos)
        }
      }
      const units = unitManager.getUnitsWithin(e.pos)
      if (units.length > 0) {
        if (selected) {
          if (selected instanceof Array) {
            selected.forEach(s => {
              selectTarget(s, units[0])
            })
          } else {
            selectTarget(selected, units[0])
          }
        }
        function selectTarget(selected: Unit, target: Unit) {
          if (!(selected instanceof MobileUnit)) {
            return
          }
          game.directMovingToUnit(selected, target)
        }
      } else {
        unitManager.select([])
        if (selected) {
          if (selected instanceof Array) {
            selected.forEach(s => {
              moveToPos(s, e.pos)
            })
          } else {
            moveToPos(selected, e.pos)
          }
        }
      }
    })

    map.on('selected', (rectangleSelector: RectangleSelector) => {
      let units = unitManager.getTrainableUnits().filter(unit => {
        return rectangleSelector.isContained(map.global2screen(unit.pos))
      })
      if (units.length === 0) {
        units = unitManager.getUnitsWithin(rectangleSelector.startPos)
      }
      unitManager.select(units)
      selectUnits(units)
    })
    function selectUnits(units: Unit[]) {
      selected = units
      if (Array.isArray(selected) && selected.length > 0) {
        controlPanel.setTarget(selected[0])
      }
      units.forEach(unit => {
        if (unit instanceof BaseBuildingUnit) {
          if (game.getMe().useResource('tree', 20)) {
            game.trainUnit(unit)
          }
        }
      })
    }
    platform.setupMap(map)
    platform.setupUnitManager(unitManager)

    function gameLoop() {
      unitManager.main()
      if (isDebugMode) {
        showDebugGrid(doc, map, unitManager, debugGrid)
      }
    }
    const recursiveAnim = function() {
      gameLoop()
      requestAnimationFrame(recursiveAnim)
    }
    requestAnimationFrame(recursiveAnim)
  }
}

/**
 * @name MultiplayGame
 */
export class MultiplayGame extends EventEmitter {
  playerId: string | null = null
  players: Map<string, Player> = new Map<string, Player>()

  constructor(
    readonly networkManager: NetworkManager,
    readonly unitManager: UnitManager
  ) {
    super()
  }

  subscribe() {
    this.networkManager.on('message', e => {
      this.subscribeCommand(JSON.parse(e.message))
    })
  }

  subscribeCommand(command: Command) {
    if (command.type == 'CreatePlayerCommand') {
      const player = new Player(
        command.id,
        PlayerType[command.playerType],
        command.color
      )
      this.players.set(command.id, player)
      if (!command.isOwner && player.type === PlayerType.HUMAN) {
        this.setPlayerId(player.id)
        this.emit('init', player)
      }
    } else if (command.type === 'CreateUnitCommand') {
      this.unitManager
        .create(
          command.id,
          command.unit,
          this.getPlayer(command.player) as Player
        )
        .setPos(new Point2d(command.x, command.y))
    } else if (command.type === 'MoveUnitCommand') {
      const unit = this.unitManager.getUnit(command.id)
      if (unit instanceof MobileUnit) {
        unit.moveToPos(new Point2d(command.pos.x, command.pos.y))
      }
    } else if (command.type === 'MoveToEnemyCommand') {
      const unit = this.unitManager.getUnit(command.id)
      const target = this.unitManager.getUnit(command.targetId)
      if (unit instanceof MobileUnit) {
        unit.moveToEnemy(target)
      }
    } else if (command.type === 'MoveToTargetCommand') {
      const unit = this.unitManager.getUnit(command.id)
      const target = this.unitManager.getUnit(command.targetId)
      if (unit instanceof MobileUnit) {
        unit.moveToTarget(target)
      }
    } else if (command.type === 'TrainUnitCommand') {
      const building = this.unitManager.getUnit(command.id)
      if (building instanceof BaseBuildingUnit) {
        building.addUnitCreationQueue(command.newUnitId)
      }
    }
  }

  private setPlayerId(id: string) {
    if (this.playerId !== null) {
      throw new Error('playerId must be null')
    }
    this.playerId = id
  }

  isMe(id: string) {
    return this.playerId === id
  }

  getMe() {
    return this.getPlayer(this.playerId as string) as Player
  }

  /**
   * @name addPlayer
   * @param playerType player type to add
   * @param isOwner the player is owner or not
   * @returns player ID
   */
  addPlayer(playerType: PlayerType, isOwner: boolean): string {
    const id = v1()
    this.networkManager.sendMessage(
      JSON.stringify({
        type: 'CreatePlayerCommand',
        id: id,
        playerType: playerType.toString(),
        color: isOwner ? 0 : 1,
        isOwner
      })
    )
    const player = new Player(id, playerType, isOwner ? 0 : 1)
    this.players.set(id, player)
    if (isOwner) {
      this.setPlayerId(player.id)
      this.emit('init', player)
    }
    return id
  }

  getPlayer(id: string) {
    return this.players.get(id)
  }

  createUnit(playerId: string, unit: string, x: number, y: number) {
    const id = v1()
    this.unitManager
      .create(id, unit, this.getPlayer(playerId) as Player)
      .setPos(new Point2d(x, y))
    this.networkManager.sendMessage(
      JSON.stringify({
        type: 'CreateUnitCommand',
        id: id,
        unit: unit,
        x: x,
        y: y,
        player: playerId
      })
    )
  }

  directMovingToPos(unit: MobileUnit, pos: Point2d) {
    unit.moveToPos(pos)
    this.networkManager.sendMessage(
      JSON.stringify({
        type: 'MoveUnitCommand',
        id: unit.id,
        pos: pos
      })
    )
  }

  directMovingToUnit(unit: MobileUnit, target: Unit) {
    if (
      target.player &&
      !this.isMe(target.player.id) &&
      target.player.type === PlayerType.HUMAN
    ) {
      unit.moveToEnemy(target)
      this.networkManager.sendMessage(
        JSON.stringify({
          type: 'MoveToEnemyCommand',
          id: unit.id,
          targetId: target.id
        })
      )
    } else {
      unit.moveToTarget(target)
      this.networkManager.sendMessage(
        JSON.stringify({
          type: 'MoveToTargetCommand',
          id: unit.id,
          targetId: target.id
        })
      )
    }
  }

  trainUnit(unit: BaseBuildingUnit) {
    const id = v1()
    unit.addUnitCreationQueue(id)
    this.networkManager.sendMessage(
      JSON.stringify({
        type: 'TrainUnitCommand',
        id: unit.id,
        newUnitId: id
      })
    )
  }
}
