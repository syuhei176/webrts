import SVG from 'svg.js'
import { Map } from './Map'
import { UnitManager } from './UnitManager'

export function showDebugGrid(
  doc: SVG.Doc,
  map: Map,
  unitManager: UnitManager,
  debugGrid: SVG.Rect[][]
) {
  const graph = map.getCollGraph(unitManager, { except: [] })
  for (let i = 0; i < graph.length; i++) {
    for (let j = 0; j < graph[i].length; j++) {
      if (!debugGrid[i]) {
        debugGrid[i] = []
      }
      if (!debugGrid[i][j]) {
        debugGrid[i][j] = doc.rect(45, 45).move(j * 50, i * 50)
      }
      if (graph[i][j] == 0) {
        debugGrid[i][j].attr({
          stroke: '#a77',
          fill: 'none',
          strokeWidth: 3
        })
      } else if (graph[i][j] == 1) {
        debugGrid[i][j].attr({
          stroke: '#77b',
          fill: 'none',
          strokeWidth: 3
        })
      }
    }
  }
}
