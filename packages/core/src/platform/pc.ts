export default function() {
  return {
    setupMap: function(map) {
      window.addEventListener('keydown', function(e) {
        switch (e.keyCode) {
          case 68: //d
            map.move(-25, 0)
            break
          case 65: //a
            map.move(25, 0)
            break
          case 87: //w
            map.move(0, 25)
            break
          case 83: //s
            map.move(0, -25)
            break
        }
      })
      map.setClickHandler(function(e, click, target) {
        if (e.button == 0) {
          click()
        } else if (e.button == 2) {
          target()
        }
      })
    },
    setupUnitManager: function(unitManager) {
      unitManager.setClickHandler(function(e, click, target) {
        if (e.button == 0) {
          click()
        } else if (e.button == 2) {
          target()
        }
      })
    }
  }
}
