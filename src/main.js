var Snap = require('../thirdparty/snap.svg');
var UnitManager = require('./core/UnitManager');
var unitInfo = require('./unit');
var ControlPanel = require('./ui/controlPanel');
var unitInfo = require('./unit');
var Map = require('./core/Map');
var Player = require('./core/player');

function RTS() {

}

RTS.prototype.start = function() {
	window.addEventListener('load', function() {
		var controlPanel = new ControlPanel();
		var snap = Snap('#svg');
		var unitManager = new UnitManager();
		unitManager.load(unitInfo);

		var map = new Map(snap);
		//map.generate(0);

		map.setUnitManager(unitManager);
		unitManager.setMap(map);
		var player = new Player();
		player.on('update', function() {
			var resource_tree = document.getElementById('resource-tree');
			resource_tree.textContent = player.resource('tree');
		});
		unitManager.create(snap, 'town', player).position(250, 150);
		unitManager.create(snap, 'villager', player).position(100, 50);
		unitManager.create(snap, 'villager', player).position(100, 100);
		unitManager.create(snap, 'villager', player).position(50, 150);
		unitManager.create(snap, 'villager', player).position(200, 200);
		unitManager.create(snap, 'villager', player).position(200, 250);
		unitManager.create(snap, 'tree', player).position(100, 150);
		unitManager.create(snap, 'tree', player).position(600, 150);
		unitManager.create(snap, 'tree', player).position(600, 200);
		unitManager.create(snap, 'tree', player).position(600, 250);
		unitManager.create(snap, 'tree', player).position(450, 200);
		unitManager.create(snap, 'tree', player).position(400, 300);
		unitManager.create(snap, 'tree', player).position(400, 250);
		unitManager.create(snap, 'tree', player).position(150, 50);

		var selected = null;
		unitManager.on('target', function(e) {
			if(selected) {
				if(selected instanceof Array) {
					selected.forEach(function(s) {
						s.target(e.unit);
					});
				}else{
					selected.target(e.unit);
				}
			}			
		});
		unitManager.on('click', function(e) {
			selected = e.unit;
			controlPanel.setTarget(selected);
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