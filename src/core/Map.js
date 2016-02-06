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
	console.log(graph);
	this.unitManager.getCollUnits().map(function(u) {
		return u.positionTile();
	}).forEach(function(p) {
		graph[p.getX()][p.getY()] = 0;
	});
	return graph;
}

module.exports = Map;