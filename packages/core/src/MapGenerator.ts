const basePos = [
  {
    x: 5,
    y: 5
  },
  {
    x: 17,
    y: 6
  }
]

export function generateMap(
  playerIds: string[],
  gaiaId: string,
  createUnit: (playerId: string, unit: string, x: number, y: number) => void
) {
  playerIds.forEach((playerId, index) => {
    const base = basePos[index]
    createUnit(playerId, 'town', base.x * 50, base.y * 50)
    createUnit(playerId, 'villager', (base.x - 1) * 50, (base.y + 3) * 50)
    createUnit(playerId, 'villager', base.x * 50, (base.y + 3) * 50)
    createUnit(playerId, 'villager', (base.x + 1) * 50, (base.y + 3) * 50)
  })

  let previous = false
  for (let i = 1; i < 24; i++) {
    for (let j = 1; j < 20; j++) {
      const r = Math.floor(Math.random() * 100)
      const p = previous ? 20 : 7
      if (!isNearBasePosition(i, j) && r < p) {
        previous = true
        createUnit(gaiaId, 'tree', i * 50, j * 50)
      } else {
        previous = false
      }
    }
  }
  function isNearBasePosition(x: number, y: number) {
    return (
      basePos.filter(
        pos =>
          x >= pos.x - 1 && x < pos.x + 5 && y >= pos.y - 1 && y < pos.y + 5
      ).length > 0
    )
  }
}
