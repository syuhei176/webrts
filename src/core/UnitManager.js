var EventEmitter = require('eventemitter2').EventEmitter2;
var util = require('util');
var Math2D = require('./math2d');
var UnitGraphic = require('../graphic/unitGraphic');
var BaseMobileUnit = require('./BaseMobileUnit');
var BaseNatureUnit = require('./BaseNatureUnit');
var BaseBuildingUnit = require('./BaseBuildingUnit');

function UnitManager(snap) {
	EventEmitter.call(this);
	this.metaUnits = {};
	this.units = {};
	this.snap = snap;
	this.group = snap.g();
	this.selected = null;
	this.cursors = [];
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

UnitManager.prototype.create = function(metaUnitId, player) {
	var that = this;
	var metaUnit = this.metaUnits[metaUnitId];
	var ug = new UnitGraphic(this.snap, this.group, {
		path : 'images/' + metaUnit.graphic.path,
		width : metaUnit.graphic.width,
		height : metaUnit.graphic.height,
	});
	if(metaUnit.unitinfo.type == 'nature') {
		var person = new BaseNatureUnit(ug, metaUnit.unitinfo, this.map, player);
	}else if(metaUnit.unitinfo.type == 'building') {
		var person = new BaseBuildingUnit(ug, metaUnit.unitinfo, this.map, player);
	}else{
		var person = new BaseMobileUnit(ug, metaUnit.unitinfo, this.map, player);
	}
	person.on('click', function(e) {
		that.clickHandler(e, function() {
			that.select([person]);
			that.emit('click', {unit : person, event : e});
		}, function() {
			that.emit('target', {unit : person, event : e});
		});
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

UnitManager.prototype.getNearTrainableUnits = function(selfUnit, player) {
	var that = this;
	return Object.keys(this.units).map(function(k) {
		return that.units[k];
	}).filter(function(unit) {
		return unit.info.type == 'trainable' && (unit.player.type() != player.type());
	}).filter(function(unit) {
		var dis = Math2D.Point2D.distance( selfUnit.position(), unit.position() );
		return (dis < 100*100);
	});
}

UnitManager.prototype.select = function(target) {
	var that = this;
	this.selected = target;
	this.cursors.forEach(function(c) {
		c.remove();
	});
	if(this.selected) {
		this.cursors = this.selected.map(function(u) {
			var pos = u.position();
			var c = that.snap.circle(40, 40, 50);
			c.attr({
				fill: "none",
				stroke: "#1010f0",
				strokeWidth: 3
			});
			u.graphic.group.append(c);
			return c;
		});
	}
}

UnitManager.prototype.setClickHandler = function(clickHandler) {
	this.clickHandler = clickHandler;
}


module.exports = UnitManager;