function BuildingUnitStatus() {
	return {
		status : BuildingUnitStatus.STATUS_BUILDING,
		dist : null
	}
}
BuildingUnitStatus.STATUS_BUILDING = 1;
BuildingUnitStatus.STATUS_NORMAL = 2;

function BaseBuildingUnit() {
}

BaseBuildingUnit.prototype.draw = function(status) {
	//表示
}
