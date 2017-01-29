var util = require('util');
var BaseUnit = require('./BaseUnit');
var Math2D = require('./math2d');

BaseBuildingUnit.STATUS = {};
BaseBuildingUnit.STATUS.WAITING = 0;
BaseBuildingUnit.STATUS.PROCESSING = 1;

function BaseBuildingUnit(graphic, info, map, player) {
	BaseUnit.call(this, graphic, info, map, player);
	this.queue = [];
	this.processing_job = null;
	this.status = BaseBuildingUnit.STATUS.WAITING;
	this.count = 0;
}

util.inherits(BaseBuildingUnit, BaseUnit);

BaseBuildingUnit.prototype.main = function() {
	switch(this.status) {
		case BaseBuildingUnit.STATUS.WAITING:
			var newUnit = this.queue.shift();
			this.processing_job = newUnit;
			this.status = BaseBuildingUnit.STATUS.PROCESSING;
			this.count = 100;
			break;
		case BaseBuildingUnit.STATUS.PROCESSING:
			this.count--;
			if(this.count <= 0) {
				if(this.processing_job) {
					var unit = this.map.unitManager.create('villager', this.player);
					unit.position(this.position().getX()-100, this.position().getY());
					var pos = new Math2D.Point2D(this.position().getX()-100, this.position().getY()+120);
					unit.move_to_pos(pos);
				}
				this.status = BaseBuildingUnit.STATUS.WAITING;
			}
			break;
	}
}

BaseBuildingUnit.prototype.addUnitCreationQueue = function() {
	this.queue.push({});
}

BaseBuildingUnit.prototype.getInfo = function() {
	return "<div>"+this.queue.length+"</div>";
}

BaseBuildingUnit.prototype.getPallet = function() {
	return "<div></div>";
}


module.exports = BaseBuildingUnit;
