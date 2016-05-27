var EventEmitter = require('eventemitter2').EventEmitter2;
var util = require('util');
var uuid = require('uuid');


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
}

util.inherits(Player, EventEmitter);

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

module.exports = Player;