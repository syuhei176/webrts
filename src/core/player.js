var EventEmitter = require('eventemitter2').EventEmitter2;
var util = require('util');
var uuid = require('uuid');

var colors = ["#00f", "#f00", "#0f0"];
var colorIndex = 0;

Player.TYPE_HUMAN = 1;
Player.TYPE_ENEMY = 2;
Player.TYPE_GAIA = 3;

function Player(_options) {
	var that = this;
	EventEmitter.call(this);
	this.options = _options || {};
	this._type = this.options.type || Player.TYPE_HUMAN;
	this._resources = {
		"tree" : 0,
		"food" : 0,
		"stone" : 0,
		"metal" : 0
	};
	this.color = colors[colorIndex];
	colorIndex++;
}

util.inherits(Player, EventEmitter);

Player.prototype.getColor = function() {
	return this.color;
}

Player.prototype.type = function() {
	return this._type;
}

Player.prototype.resource = function(type) {
	return this._resources[type];
}

Player.prototype.addResource = function(type, inc) {
	this._resources[type] += inc;
	this.emit('update', this);
}

Player.prototype.useResource = function(type, amount) {
	if(this._resources[type] >= amount) {
		this._resources[type] -= amount;
		return true;
	}
	return false;
}

module.exports = Player;