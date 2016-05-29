var util = require('util');
var BaseUnit = require('./BaseUnit');

function BaseBuildingUnit(graphic, info, map, player) {
	BaseUnit.call(this, graphic, info, map, player);
}

util.inherits(BaseBuildingUnit, BaseUnit);


BaseBuildingUnit.prototype.main = function() {
}

BaseBuildingUnit.prototype.getInfo = function() {
	return "<div></div>"
}


module.exports = BaseBuildingUnit;
