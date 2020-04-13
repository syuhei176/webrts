import SocketIOClient from 'socket.io-client'
import SimplePeer from 'simple-peer'
import { EventEmitter } from 'events'

interface NetworkManagerOptions {
  room: string
  createNew: boolean
  endpoint: string
}

export class NetworkManager extends EventEmitter {
  id: string
  peer: any | null = null
  socket: SocketIOClient.Socket

  constructor(readonly options: NetworkManagerOptions) {
    super()
    this.id = Math.random().toString()
    this.socket = SocketIOClient(options.endpoint)
  }

  start() {
    const options = this.options
    console.log(this.id, options)

    this.socket.on('connect', () => {
      console.log('connected')
      this.socket.emit('join', {
        id: this.id,
        room: options.room,
        createNew: options.createNew
      })
    })
    this.socket.on('joined', ({ numOfPeople }) => {
      this.setUpPeer(numOfPeople === 2)
    })
    this.socket.on('signal', m => {
      console.log('recv signal from server', m)
      if (this.id !== m.id && m.room === options.room && this.peer) {
        this.peer.signal(m.signalData)
      }
    })
    this.socket.on('disconnect', () => {
      console.log('disconnected')
    })
  }

  private setUpPeer(isInitiator: boolean) {
    console.log('setUpPeer', isInitiator)
    const options = this.options
    this.peer = new SimplePeer({ initiator: isInitiator })
    this.peer.on('signal', data => {
      console.log('recv signal')
      this.socket.emit('signal', {
        id: this.id,
        room: options.room,
        signalData: data
      })
    })

    this.peer.on('connect', () => {
      console.log('connected to peer')
    })

    this.peer.on('data', data => {
      this.emit('message', { message: data.toString() })
    })
  }

  /**
   * @name sendMessage
   * @description send message to room
   * @param message
   */
  sendMessage(message: string) {
    this.peer.send(message)
  }
}
