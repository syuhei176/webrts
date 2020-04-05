export default function() {
  return {
    setupMap: function(map) {
      map.setClickHandler(function(e, click, target) {
        if (map.unitManager.selected && map.unitManager.selected.length > 0) {
          target()
        } else {
          click()
        }
      })
    },
    setupUnitManager: function(unitManager) {
      unitManager.setClickHandler(function(e, click, target) {
        if (unitManager.selected && unitManager.selected.length > 0) {
          target()
        } else {
          click()
        }
      })
    }
  }
}
