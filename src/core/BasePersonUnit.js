var util = require('util');
var uuid = require('uuid');
var Math2D = require('./math2d');
var BaseUnit = require('./BaseUnit');
var logger = require('../util/log').logger('BasePersonUnit');
var astar = require('../algorithm/astar');

function PersonUnitStatus() {
	return {
		status : PersonUnitStatus.STATUS_WAIT,
		dest : null,
		target : null
	}
}
PersonUnitStatus.STATUS_WAIT = 1;
PersonUnitStatus.STATUS_MOVING_TO_POS = 2;
PersonUnitStatus.STATUS_MOVING_TO_TARGET = 3;
PersonUnitStatus.STATUS_ATTACKING = 4;

function BasePersonUnit(graphic, info, map) {
	var that = this;
	BaseUnit.call(this, graphic, info);
	this.id = uuid();
	this.map = map;
	this.status = new PersonUnitStatus();
	this.attack = 5;
	this.range = 3;
	this.speed = 4;
	this.pos = new Math2D.Point2D(0, 0);
	this.nextDestination = null;
	this.queue = [];
	this.count = 0;
	this.count2 = 0;
	//init
	this.graphic.click(function(e) {
		that.emit('click', e);
	});
}

util.inherits(BasePersonUnit, BaseUnit);

BasePersonUnit.prototype.getId = function() {
	return this.id;
}

BasePersonUnit.prototype.draw = function(status) {
	//表示
}

BasePersonUnit.prototype.main = function() {
	if(this.status.status == PersonUnitStatus.STATUS_MOVING_TO_POS) {
		if(this.nextDestination) {
			this.pos = this.pos.add(this.vec);
			if(this.map.hit(this)) {
				this.pos = this.pos.sub(this.vec);
				this.count2--;
				if(this.count2 <= 0) this.count = 0;
			}else{
				this.count--;
			}
			this.graphic.setPos(this.pos.getX(), this.pos.getY());
			if(this.count <= 0) this.nextDestination = null;
		}else{
			this.count = 0;
			this.nextDestination = this.queue.shift();
			if(this.nextDestination) {
				var vec = this.nextDestination.sub(this.pos);
				this.graphic.rotate( Math.atan(vec.getY() / vec.getX()) / Math.PI * 180 + 90 );
				this.vec = vec.times(1/50);
				this.count = 50;
				this.count2 = 150;
			}
		}
	}
}

BasePersonUnit.prototype.collBound = function() {
	var offset = 5;
	var info = this.info;
	if(info.type == 'trainable') offset = 15;
	if(info.size.length == 2) {
		var w = info.size[0] * 50;
		var h = info.size[1] * 50;
	}else{
		var w = info.size * 50;
		var h = info.size * 50;
	}
	return {
		x : this.pos.getX()+offset,
		y : this.pos.getY()+offset,
		w : w - offset*2,
		h : h - offset*2
	}
}

BasePersonUnit.prototype.position = function(x, y) {
	if(x === undefined && y == undefined) return this.pos;
	this.pos.setLocation(x, y);
	this.graphic.setPos(x, y);
}

BasePersonUnit.prototype.positionTile = function(x, y) {
	if(x === undefined && y == undefined) return new Math2D.Point2D( Math.floor(this.pos.getX() / 50), Math.floor(this.pos.getY() / 50));
	x *= 50;
	y *= 50;
	this.pos.setLocation(x, y);
	this.graphic.setPos(x, y);
}

BasePersonUnit.prototype.move = function(d) {
	this.queue.push(d);
}

BasePersonUnit.prototype.walk = function(x, y) {
	var that = this;

	//clear
	this.count--;
	this.queue = [];

	this.status.status = PersonUnitStatus.STATUS_MOVING_TO_POS;
	this.status.dest = new Math2D.Point2D(x, y);

	var collGraph = this.map.getCollGraph();
	var graph = new astar.Graph(collGraph);
	var startPos = this.positionTile();
	var endPos = new Math2D.Point2D(Math.floor(x / 50), Math.floor(y / 50));
	logger('walkFrom', startPos.getX(), startPos.getY());
	logger('walkTo', endPos.getX(), endPos.getY());
    var start = graph.grid[startPos.getX()][startPos.getY()];
    var end = graph.grid[ endPos.getX() ][ endPos.getY() ];
    var result = astar.astar.search(graph, start, end);
    result.map(function(gridNode) {
		that.queue.push(new Math2D.Point2D(gridNode.x*50, gridNode.y*50));
    });
}

module.exports = BasePersonUnit;