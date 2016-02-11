var util = require('util');
var BaseUnit = require('./BaseUnit');

function NatureUnitStatus() {
	return {
		status : NatureUnitStatus.STATUS_BUILDING,
		dist : null
	}
}
NatureUnitStatus.STATUS_BUILDING = 1;
NatureUnitStatus.STATUS_NORMAL = 2;

function BaseNatureUnit(graphic, info, map) {
	BaseUnit.call(this, graphic, info, map);
	this.amount = 100;
}

util.inherits(BaseNatureUnit, BaseUnit);

BaseNatureUnit.prototype.decrease = function(amount) {
	this.amount -= amount;
	if(this.amount < 0) {
		var left = -1 * this.amount;
		this.amount = 0;
		this.map.unitManager.remove(this.getId());
		console.log(left);
		return amount - left;
	}else{
		return amount;
	}
}

BaseNatureUnit.prototype.main = function() {
}

module.exports = BaseNatureUnit;
