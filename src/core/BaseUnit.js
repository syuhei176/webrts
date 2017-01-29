var EventEmitter = require('eventemitter2').EventEmitter2;
var util = require('util');
var uuid = require('uuid');
var Math2D = require('./math2d');

function BaseUnit(graphic, info, map, player) {
	var that = this;
	EventEmitter.call(this);
	that.graphic = graphic;
	this.info = info;
	this.id = uuid();
	this.map = map;
	this.player = player;
	this.pos = new Math2D.Point2D(0, 0);
	if(info.size instanceof Array) {
		that.graphic.setSize(info.size[0] * 50, info.size[1] * 50);
	}else{
		that.graphic.setSize(info.size * 50, info.size * 50);
	}
	this.graphic.click(function(e) {
		console.log("mouseup", e.button);
		that.emit('click', e);
	});
	this.graphic.setPlayerColor(this.player);
}

util.inherits(BaseUnit, EventEmitter);

BaseUnit.prototype.getId = function() {
	return this.id;
}

BaseUnit.prototype.remove = function() {
	return this.graphic.remove();
}

BaseUnit.prototype.collBound = function() {
	var offset = 5;
	var info = this.info;
	if(info.type == 'trainable') offset = 5;
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

BaseUnit.prototype.position = function(x, y) {
	if(x === undefined && y == undefined) return this.pos;
	this.pos.setLocation(x, y);
	this.graphic.setPos(x, y);
}

BaseUnit.prototype.positionTile = function(x, y) {
	if(x === undefined && y == undefined) return new Math2D.Point2D( Math.floor(this.pos.getX() / 50), Math.floor(this.pos.getY() / 50));
	x *= 50;
	y *= 50;
	this.pos.setLocation(x, y);
	this.graphic.setPos(x, y);
}

module.exports = BaseUnit;