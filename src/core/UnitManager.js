var EventEmitter = require('eventemitter2').EventEmitter2;
var util = require('util');
var UnitGraphic = require('../graphic/unitGraphic');
var BasePersonUnit = require('./BasePersonUnit');

function UnitManager() {
	EventEmitter.call(this);
	this.metaUnits = {};
	this.units = {};
}

util.inherits(UnitManager, EventEmitter);

UnitManager.prototype.setMap = function(map) {
	this.map = map;
}

UnitManager.prototype.load = function(units) {
	var that = this;
	units.map(function(unit) {
		that.metaUnits[unit.id] = unit;
	});
}

UnitManager.prototype.main = function() {
	var that = this;
	Object.keys(this.units).map(function(k) {
		that.units[k].main();
	});
}

UnitManager.prototype.create = function(snap, metaUnitId) {
	var that = this;
	var metaUnit = this.metaUnits[metaUnitId];
	var ug = new UnitGraphic(snap, {
		path : 'images/' + metaUnit.graphic.path,
		width : metaUnit.graphic.width,
		height : metaUnit.graphic.height,
	});
	var person = new BasePersonUnit(ug, metaUnit.unitinfo, this.map);
	person.on('click', function(e) {
		that.emit('click', {unit : person, event : e});
	});
	this.units[person.id] = person;
	return person;
}

UnitManager.prototype.getTrainableUnits = function() {
	var that = this;
	return Object.keys(this.units).map(function(k) {
		return that.units[k];
	}).filter(function(unit) {
		return unit.info.type == 'trainable';
	});
}

UnitManager.prototype.getCollUnits = function() {
	var that = this;
	return Object.keys(this.units).map(function(k) {
		return that.units[k];
	}).filter(function(unit) {
		return unit.info.type == 'building' || unit.info.type == 'nature';
	});
}

module.exports = UnitManager;