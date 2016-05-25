var Snap = require('../../thirdparty/snap.svg');
var EventEmitter = require('eventemitter2').EventEmitter2;
var util = require('util');
var RectangleSelector = require('../ui/rectangleSelector');
var Math2D = require('./math2d');

//click:タッチ
//click:選択状態でのタッチ
//target:右クリック

function Map(snap) {
	var that = this;
	EventEmitter.call(this);
	this.width = 80;
	this.height = 80;
	var width = 2000;
	var height = 2000;
	this.pos = new Math2D.Point2D(0, 0);
	RectangleSelector.snap = snap;
	this.snap = snap;
	this.group = this.snap.g();
	this.coll = snap.rect(0, 0, width, height);
	this.group.append(this.coll);
	this.coll.attr({
		fill : "#7f7"
	});
	this.coll.drag(function(dx, dy) {
		RectangleSelector.move(dx, dy);
	}, function(x, y, e) {
		console.log('start', e.pageX, e.pageY);
		RectangleSelector.start(e.pageX, e.pageY);
	}, function() {
		RectangleSelector.end();
		var units = that.unitManager.getTrainableUnits().filter(function(unit) {
			return RectangleSelector.isContain(that.global2screen(unit.position()));
		});
		that.unitManager.select(units);
		that.emit('selected', units);
	});
	this.clickHandler = function(e) {

	}
	this.coll.mousedown(function(e) {
		var pos = that.screen2global(e.pageX, e.pageY);
		that.clickHandler(e, function() {
			that.emit('click', {
				pos: pos
			});
			that.unitManager.select([]);
		}, function() {
			that.emit('target', {
				pos: pos
			});
			that.unitManager.select([]);
		});
	});
    window.addEventListener("contextmenu", function(e){
        e.preventDefault();
    }, false);
}

util.inherits(Map, EventEmitter);

Map.prototype.setUnitManager = function(unitManager) {
	var that = this;
	this.unitManager = unitManager;
	this.unitManager.setMap(this);
	this.group.append(this.unitManager.group);
	this.unitManager.on('click', function(e) {
		that.emit('selected', [e.unit]);
	});

}

Map.prototype.setClickHandler = function(clickHandler) {
	this.clickHandler = clickHandler;
}


Map.prototype.screen2global = function(x, y) {
	return (new Math2D.Point2D(x, y)).sub(this.pos)
}
Map.prototype.global2screen = function(pos) {
	return pos.add(this.pos)
}

Map.prototype.move = function(x, y) {
	this.pos = this.pos.add(new Math2D.Point2D(x, y));
	this.applyDisplay();
	console.log(this.pos);
}

Map.prototype.applyDisplay = function() {
	var myMatrix = new Snap.Matrix();
	myMatrix.translate(this.pos.x, this.pos.y);
	this.group.transform(myMatrix);
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

Map.prototype.getCollGraph = function(_options) {
	var options = _options || {};
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
	if(options.except) {
		options.except.forEach(function(e) {
			graph[e.getX()][e.getY()] = 1;
		});
	}
	return graph;
}

module.exports = Map;