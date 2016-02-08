var Snap = require('../thirdparty/snap.svg');
var UnitManager = require('./core/UnitManager');
var unitInfo = require('./unit');
var ControlPanel = require('./ui/controlPanel');
var unitInfo = require('./unit');
var Map = require('./core/Map');

function RTS() {

}

RTS.prototype.start = function() {
	window.addEventListener('load', function() {
		var controlPanel = ControlPanel();
		var snap = Snap('#svg');
		var unitManager = new UnitManager();
		unitManager.load(unitInfo);

		var map = new Map(snap);
		//map.generate(0);

		map.setUnitManager(unitManager);
		unitManager.setMap(map);

		unitManager.create(snap, 'town').position(250, 150);
		unitManager.create(snap, 'villager').position(100, 50);
		unitManager.create(snap, 'villager').position(100, 100);
		unitManager.create(snap, 'villager').position(50, 150);
		unitManager.create(snap, 'villager').position(200, 200);
		unitManager.create(snap, 'villager').position(200, 250);
		unitManager.create(snap, 'tree').position(100, 150);
		unitManager.create(snap, 'tree').position(600, 150);
		unitManager.create(snap, 'tree').position(600, 200);
		unitManager.create(snap, 'tree').position(600, 250);
		unitManager.create(snap, 'tree').position(450, 200);
		unitManager.create(snap, 'tree').position(400, 300);
		unitManager.create(snap, 'tree').position(400, 250);
		unitManager.create(snap, 'tree').position(150, 50);

		var selected = null;
		unitManager.on('click', function(e) {
			selected = e.unit;
		});
		map.on('target', function(e) {
			if(selected) {
				if(selected instanceof Array) {
					selected.forEach(function(s) {
						s.walk(e.x, e.y);
					});
				}else{
					selected.walk(e.x, e.y);
				}
			}
		});
		map.on('selected', function(units) {
			selected = units;
		});

		var requestAnimationFrame = getRequestAnimationFrame();

		function gameLoop() {
			unitManager.main();
		}
		var recursiveAnim = function() {
			gameLoop();
			requestAnimationFrame(recursiveAnim)
		}
		requestAnimationFrame(recursiveAnim)

		var graph = map.getCollGraph();
		for(var i=0;i < graph.length;i++) {
			for(var j=0;j < graph[i].length;j++) {
				if(graph[i][j] == 0) {
					snap.rect(i*50, j*50, 45, 45).attr({
						stroke : '#a77',
						fill : 'none',
						strokeWidth : 3
					});
				}else if(graph[i][j] == 1) {
					snap.rect(i*50, j*50, 45, 45).attr({
						stroke : '#77b',
						fill : 'none',
						strokeWidth : 3
					});
				}
			}
		}

	});
}

function getRequestAnimationFrame() {
	return window.requestAnimationFrame ||
	                window.webkitRequestAnimationFrame ||
	                window.mozRequestAnimationFrame    ||
	                window.oRequestAnimationFrame      ||
	                window.msRequestAnimationFrame     ||
	                null ;
}

window.RTS = new RTS();

module.exports = RTS;