import SVG from 'svg.js'

export interface IGraphic {
  setPos(x: number, y: number): void
  setSize(w: number, h: number): void
  click(handler: (e: any) => void): void
  setPlayerColor(color: string): void
  remove(): void
  flashing(): void
  addSVGElement(element: SVG.Element): void
  setStatus(text: string)
  rotate(r: number): void
}
