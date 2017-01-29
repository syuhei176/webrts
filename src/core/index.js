var Snap = require('../../thirdparty/snap.svg');
var UnitManager = require('./UnitManager');
var unitInfo = require('../unit');
var ControlPanel = require('../ui/controlPanel');
var Menu = require('../ui/menu');
var Preloader = require('../ui/preloader');
var Map = require('./map');
var Player = require('./player');
var Platform = require('../platform');

function Game(mainDom, requestAnimationFrame) {
	this.start(mainDom, requestAnimationFrame);
}

Game.prototype.start = function(mainDom, requestAnimationFrame) {
	var platform = Platform();
	var controlPanel = new ControlPanel(mainDom);
	var menu = new Menu(mainDom);
	var preloader = new Preloader(mainDom);
	preloader.show();
	var svgWrapper = document.createElement('div');
	var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	var width = window.innerWidth;
	var height = window.innerHeight;
    svg.setAttributeNS(null, 'width', width);
    svg.setAttributeNS(null, 'height', height);
    svg.setAttributeNS(null, 'viewBox', '0 0 '+width+' '+height);
    svgWrapper.appendChild(svg);
	mainDom.appendChild(svgWrapper);

	var snap = Snap(svg);
	var map = new Map(snap);
	var unitManager = new UnitManager(snap);
	unitManager.load(unitInfo);
	//map.generate(0);

	map.setUnitManager(unitManager);
	var player1 = new Player({type: Player.TYPE_HUMAN});
	var player2 = new Player({type: Player.TYPE_ENEMY});
	var player_gaia = new Player({type: Player.TYPE_GAIA});


	menu.update('tree', 0);
	player1.on('update', function() {
		menu.update('tree', player1.resource('tree'));
	});
	unitManager.create('town', player1).position(400, 100);
	unitManager.create('villager', player1).position(50, 50);
	unitManager.create('villager', player1).position(100, 50);
	unitManager.create('villager', player1).position(50, 100);
	unitManager.create('villager', player1).position(100, 100);
	unitManager.create('villager', player2).position(425, 525);
	unitManager.create('villager', player2).position(425, 550);
	unitManager.create('villager', player2).position(450, 525);
	unitManager.create('villager', player2).position(450, 550);
	unitManager.create('villager', player2).position(475, 525);
	unitManager.create('villager', player2).position(475, 550);
	unitManager.create('villager', player2).position(500, 525);
	unitManager.create('villager', player2).position(500, 550);
	unitManager.create('villager', player2).position(525, 525);
	unitManager.create('villager', player2).position(525, 550);
	unitManager.create('tree', player_gaia).position(150, 200);
	unitManager.create('tree', player_gaia).position(150, 250);
	unitManager.create('tree', player_gaia).position(150, 300);
	unitManager.create('tree', player_gaia).position(200, 300);
	unitManager.create('tree', player_gaia).position(300, 300);

	var selected = null;
	unitManager.on('target', function(e) {
		console.log(e);
		if(selected) {
			if(selected instanceof Array) {
				selected.forEach(function(s) {
					select_target(s, e.unit);
				});
			}else{
				select_target(selected, e.unit);
			}
		}
		function select_target(selected, target) {
			if(target.player && target.player.type() == Player.TYPE_ENEMY) {
				selected.move_to_enemy(target);
			}else{
				selected.move_to_target(target);
			}
		}
	});
	map.on('target', function(e) {
		if(selected) {
			if(selected instanceof Array) {
				selected.forEach(function(s) {
					move_to_pos(s, e.pos);
				});
			}else{
				move_to_pos(selected, e.pos);
			}
		}
		function move_to_pos(selected, pos) {
			if(selected.player && selected.player.type() == Player.TYPE_HUMAN) {
				selected.move_to_pos(e.pos);
			}
		}
	});
	map.on('click', function(e) {
		if(player1.useResource('tree', 50)) {
			unitManager.create('town', player1).position(e.pos.x, e.pos.y);
		}
	});
	map.on('selected', function(units) {
		selected = units;
		if(selected.length > 0)
			controlPanel.setTarget(selected[0]);
		console.log(units);
		units.forEach(function(unit) {
			if(unit.info.type == "building") {
				unit.addUnitCreationQueue();
			}
		});
	});
	platform.setupMap(map);
	platform.setupUnitManager(unitManager);

	function gameLoop() {
		unitManager.main();
	}
	var recursiveAnim = function() {
		gameLoop();
		requestAnimationFrame(recursiveAnim)
	}
	requestAnimationFrame(recursiveAnim)

	var graph = map.getCollGraph();
	/*
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
	*/
}

module.exports = Game;