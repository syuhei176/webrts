var EventEmitter = require('eventemitter2').EventEmitter2;
var util = require('util');
var UnitGraphic = require('../graphic/unitGraphic');
var BaseMobileUnit = require('./BaseMobileUnit');
var BaseNatureUnit = require('./BaseNatureUnit');

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
		if(that.units[k]) that.units[k].main();
	});
}

UnitManager.prototype.create = function(snap, metaUnitId, player) {
	var that = this;
	var metaUnit = this.metaUnits[metaUnitId];
	var ug = new UnitGraphic(snap, {
		path : 'images/' + metaUnit.graphic.path,
		width : metaUnit.graphic.width,
		height : metaUnit.graphic.height,
	});
	if(metaUnit.unitinfo.type == 'nature') {
		var person = new BaseNatureUnit(ug, metaUnit.unitinfo, this.map, player);
	}else{
		var person = new BaseMobileUnit(ug, metaUnit.unitinfo, this.map, player);
	}
	person.on('click', function(e) {
		if(e.button == 2) {
			that.emit('target', {unit : person, event : e});
		}else{
			//TODO:
			that.selected = person;
			//
			that.emit('click', {unit : person, event : e});
		}
	});
	this.units[person.id] = person;
	return person;
}

UnitManager.prototype.remove = function(id) {
	if(this.units[id]) {
		this.units[id].remove();
		delete this.units[id];
	}
}

UnitManager.prototype.getUnits = function() {
	var that = this;
	return Object.keys(this.units).map(function(k) {
		return that.units[k];
	});	
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
	})/*.filter(function(unit) {
		return unit.info.type == 'building' || unit.info.type == 'nature';
	});*/
}

UnitManager.prototype.getNearNature = function() {
	var that = this;
	return Object.keys(this.units).map(function(k) {
		return that.units[k];
	}).filter(function(unit) {
		return unit.info.type == 'nature';
	});
}

UnitManager.prototype.getNearBuilding = function() {
	var that = this;
	return Object.keys(this.units).map(function(k) {
		return that.units[k];
	}).filter(function(unit) {
		return unit.info.type == 'building';
	});
}


module.exports = UnitManager;