var EventEmitter = require('eventemitter2').EventEmitter2;
var util = require('util');
var RectangleSelector = require('../ui/rectangleSelector');

function Map(snap) {
	var that = this;
	EventEmitter.call(this);
	this.width = 80;
	this.height = 80;
	var width = 1000;
	var height = 500;
	RectangleSelector.snap = snap;
	this.coll = snap.rect(0, 0, width, height);
	this.coll.attr({
		fill : "#7f7"
	});
	this.coll.drag(function(dx, dy) {
		RectangleSelector.move(dx, dy);
	}, function(x, y) {
		console.log('start', x, y);
		RectangleSelector.start(x, y);
	}, function() {
		RectangleSelector.end();
		var units = that.unitManager.getTrainableUnits().filter(function(unit) {
			return RectangleSelector.isContain(unit.position())
		});
		that.emit('selected', units);
	});
	this.coll.mousedown(function(e) {
		console.log(e.clientX);
		if(e.button == 0) {
			that.emit('click', {
				x : e.clientX,
				y : e.clientY
			});
		}else if(e.button == 2) {
			that.emit('target', {
				x : e.clientX,
				y : e.clientY
			});
		}
	});
    window.addEventListener("contextmenu", function(e){
        e.preventDefault();
    }, false);
}

util.inherits(Map, EventEmitter);

Map.prototype.setUnitManager = function(unitManager) {
	this.unitManager = unitManager;
}

Map.prototype.hit = function(targetUnit) {
	return this.unitManager.getUnits().filter(function(unit) {
		return unit.getId() != targetUnit.getId();
	}).map(function(u) {
		return u.collBound();
	}).filter(function(bound) {
		var targetBound = targetUnit.collBound();
		return (bound.x < targetBound.x + targetBound.w &&  targetBound.x < bound.x + bound.w &&
			bound.y < targetBound.y + targetBound.h &&  targetBound.y < bound.y + bound.h);
	}).length > 0;
}

Map.prototype.getCollGraph = function() {
	var that = this;
	var graph = [];
	for(var i=0;i < this.width;i++) {
		var wGraph = []
		for(var j=0;j < this.height;j++) {
			wGraph.push(1);
		}
		graph.push(wGraph);
	}
	this.unitManager.getCollUnits().map(function(u) {
		if(u.info.size.length == 2) {
			var w = u.info.size[0];
			var h = u.info.size[1];
		}else{
			var w = u.info.size;
			var h = u.info.size;
		}
		return {x:u.positionTile().getX(), y:u.positionTile().getY(), w:w, h:h};　
	}).forEach(function(p) {
		for(var i = p.x;i < p.x + p.w;i++) {
			for(var j = p.y;j < p.y + p.h;j++) {
				graph[i][j] = 0;
			}
		}
	});
	return graph;
}

module.exports = Map;