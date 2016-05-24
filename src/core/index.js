var Snap = require('../../thirdparty/snap.svg');
var UnitManager = require('./UnitManager');
var unitInfo = require('../unit');
var ControlPanel = require('../ui/controlPanel');
var Map = require('./Map');
var Player = require('./player');

function Game(requestAnimationFrame) {
	this.start(requestAnimationFrame);
}

Game.prototype.start = function(requestAnimationFrame) {
	var controlPanel = new ControlPanel();
	var mainDom = document.getElementById('main');
	var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttributeNS(null, 'width', 2000);
    svg.setAttributeNS(null, 'height', 2000);
	mainDom.appendChild(svg);

	var snap = Snap(svg);
	var unitManager = new UnitManager();
	unitManager.load(unitInfo);

	var map = new Map(snap);
	//map.generate(0);

	map.setUnitManager(unitManager);
	unitManager.setMap(map);
	var player1 = new Player({type: Player.TYPE_HUMAN});
	var player2 = new Player({type: Player.TYPE_ENEMY});
	var player_gaia = new Player({type: Player.TYPE_GAIA});


	player1.on('update', function() {
		var resource_tree = document.getElementById('resource-tree');
		resource_tree.textContent = player1.resource('tree');
	});
	unitManager.create(snap, 'town', player1).position(250, 150);
	unitManager.create(snap, 'villager', player1).position(100, 50);
	unitManager.create(snap, 'villager', player1).position(100, 100);
	unitManager.create(snap, 'villager', player1).position(50, 150);
	unitManager.create(snap, 'villager', player1).position(200, 200);
	unitManager.create(snap, 'villager', player2).position(200, 250);
	unitManager.create(snap, 'tree', player_gaia).position(100, 150);
	unitManager.create(snap, 'tree', player_gaia).position(600, 150);
	unitManager.create(snap, 'tree', player_gaia).position(600, 200);
	unitManager.create(snap, 'tree', player_gaia).position(600, 250);
	unitManager.create(snap, 'tree', player_gaia).position(450, 200);
	unitManager.create(snap, 'tree', player_gaia).position(400, 300);
	unitManager.create(snap, 'tree', player_gaia).position(400, 250);
	unitManager.create(snap, 'tree', player_gaia).position(150, 50);

	var selected = null;
	unitManager.on('target', function(e) {
		if(selected) {
			if(selected instanceof Array) {
				selected.forEach(function(s) {
					s.move_to_target(e.unit);
				});
			}else{
				selected.move_to_target(e.unit);
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
					s.move_to_pos(e.pos);
				});
			}else{
				selected.move_to_pos(e.pos);
			}
		}
	});
	map.on('selected', function(units) {
		selected = units;
	});

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
}

module.exports = Game;