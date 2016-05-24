var util = require('util');
var Math2D = require('./math2d');
var BaseUnit = require('./BaseUnit');
var logger = require('../util/log').logger('BaseMobileUnit');
var astar = require('../algorithm/astar');

function MobileUnitContext() {
	return {
		status : MobileUnitContext.STATUS_WAIT,
		dest : null,
		target : null,
		gathering_amount : 0
	}
}

MobileUnitContext.STATUS = {
	WAITING: 1,
	MOVING_TO_POS: 2,
	MOVING_TO_BUILDING: 3,
	MOVING_TO_RESOURCE: 4,
	MOVING_TO_UNIT: 5,
	RETURNING: 6,
	ATTACKING: 7,
	GATHERING: 8,
	REPAIRING: 9,
	BUILDING: 10
}

function BaseMobileUnit(graphic, info, map, player) {
	var that = this;
	BaseUnit.call(this, graphic, info, map, player);
	this.context = new MobileUnitContext();
	this.attack = 5;
	this.range = 3;
	this.speed = 4;
	//次の目的地
	this.nextDestination = null;
	this.queue = [];
	this.count = 0;
	this.count2 = 0;
}

util.inherits(BaseMobileUnit, BaseUnit);

BaseMobileUnit.prototype.draw = function(status) {
	//表示
}

BaseMobileUnit.prototype.toString = function() {
	return JSON.stringify(this.context.status);
}


BaseMobileUnit.prototype.main = function() {
	switch(this.context.status) {
		case MobileUnitContext.STATUS.WAITING:
			this.execute_waiting(event);
			break;
		case MobileUnitContext.STATUS.MOVING_TO_POS:
			this.execute_moving_to_pos(event);
			break;
		case MobileUnitContext.STATUS.MOVING_TO_BUILDING:
			this.execute_moving_to_building(event);
			break;
		case MobileUnitContext.STATUS.MOVING_TO_RESOURCE:
			this.execute_moving_to_resource(event);
			break;
		case MobileUnitContext.STATUS.MOVING_TO_UNIT:
			this.execute_moving_to_unit(event);
			break;
		case MobileUnitContext.STATUS.RETURNING:
			this.execute_returning(event);
			break;
		case MobileUnitContext.STATUS.ATTACKING:
			this.execute_attacking(event);
			break;
		case MobileUnitContext.STATUS.GATHERING:
			this.execute_gathering(event);
			break;
		case MobileUnitContext.STATUS.REPAIRING:
			this.execute_repairing(event);
			break;
		case MobileUnitContext.STATUS.building:
			break;
	}
}

BaseMobileUnit.prototype.execute_waiting = function(event) {
}

BaseMobileUnit.prototype.execute_moving_to_pos = function(event) {
	this.movingProcess();
	if(!this.context.dist) return;
	var dis = Math2D.Point2D.distance( this.position(), this.context.dist );
	if(dis < 80) {
		this.context.status = MobileUnitContext.STATUS.WAITING;
	}
}

BaseMobileUnit.prototype.execute_moving_to_building = function(event) {
	this.movingProcess();
	var dis = Math2D.Point2D.distance( this.position(), this.context.target.position() );
	if(dis < 80) {
		this.context.status = MobileUnitContext.STATUS.WAITING;
	}
}

BaseMobileUnit.prototype.execute_moving_to_resource = function(event) {
	this.movingProcess();
	var dis = Math2D.Point2D.distance( this.position(), this.context.target.position() );
	if(dis < 80) {
		this.count = 20;
		this.context.status = MobileUnitContext.STATUS.GATHERING;
	}
}

BaseMobileUnit.prototype.execute_moving_to_unit = function(event) {

}

BaseMobileUnit.prototype.execute_returning = function(event) {
	this.movingProcess();
	var dis = Math2D.Point2D.distance( this.position(), this.context.target.position() );
	if(dis < 80) {
		console.log("returned");
		this.player.addResource('tree', this.context.gathering_amount);
		this.context.gathering_amount = 0;
		this.count = 20;
		var nature = this.map.unitManager.getNearNature();
		this.context.target = nature[0];
		this.move_to_target(this.context.target);
	}

}

BaseMobileUnit.prototype.execute_attacking = function(event) {
	if(event.name == "within range") {
		return {
			state: STATE.ATTACKING,
			target: event.context.target
		}
	}else if(event.name == "not within range") {
		return {
			state: STATE.MOVING,
			target: event.context.target
		}
	}
}

BaseMobileUnit.prototype.execute_gathering = function(event) {
	this.count--;
	if(this.count <= 0) {
		this.count = 20;
		this.context.gathering_amount += this.context.target.decrease(1);
		if(this.context.gathering_amount == 10) {
			var buildings = this.map.unitManager.getNearBuilding();
			this.return_to_target( buildings[0] );
		}
	}
}

BaseMobileUnit.prototype.execute_repairing = function(event) {

}

BaseMobileUnit.prototype.movingProcess = function() {
	if(this.nextDestination) {
		//次の目的地がある場合
		this.pos = this.pos.add(this.vec);
		if(this.map.hit(this)) {
			this.pos = this.pos.sub(this.vec);
			this.count2--;
			if(this.count2 <= 0) {
				if(this.context.status == MobileUnitContext.STATUS.MOVING_TO_POS) {
					this.move_to_pos(this.context.dest);
				}else{
					this.move_to_target(this.context.target);
				}
			}
		}else{
			this.count--;
		}
		this.graphic.setPos(this.pos.getX(), this.pos.getY());
		//nextDestinationについた場合
		if(this.count <= 0) this.nextDestination = null;
	}else{
		//次の目的地がない場合
		this.count = 0;
		this.nextDestination = this.queue.shift();
		if(this.nextDestination) {
			var vec = this.nextDestination.sub(this.pos);
			this.graphic.rotate( Math.atan(vec.getY() / vec.getX()) / Math.PI * 180 + 90 );
			this.vec = vec.times(1/50);
			this.count = 50;
			this.count2 = 200;
		}
	}
}


BaseMobileUnit.prototype.move = function(d) {
	this.queue.push(d);
}

BaseMobileUnit.prototype.move_to_pos = function(pos) {
	this.make_route( pos );
	this.context.status = MobileUnitContext.STATUS.MOVING_TO_POS;
	this.context.dest = new Math2D.Point2D(pos.x, pos.y);
}

BaseMobileUnit.prototype.move_to_target = function(unit) {
	this.make_route( unit.position() );
	if(unit.info.type == "nature") {
		this.context.status = MobileUnitContext.STATUS.MOVING_TO_RESOURCE;
	}else if(unit.info.type == "building") {
		this.context.status = MobileUnitContext.STATUS.MOVING_TO_BUILDING;
	}
	this.context.target = unit;
}

BaseMobileUnit.prototype.return_to_target = function(unit) {
	if(unit.info.type == "building") {
		this.make_route( unit.position() );
		this.context.status = MobileUnitContext.STATUS.RETURNING;
		this.context.target = unit;
	}else{
		throw new Error("invalid unit type");
	}
}

BaseMobileUnit.prototype.make_route = function(x, y) {
	if(x instanceof Math2D.Point2D) {
		y = x.getY();
		x = x.getX();
	}
	var that = this;

	//clear
	this.count--;
	this.queue = [];

	var startPos = this.positionTile();
	var endPos = new Math2D.Point2D(Math.floor(x / 50), Math.floor(y / 50));

	var collGraph = this.map.getCollGraph({
		except : [startPos, endPos]
	});
	var graph = new astar.Graph(collGraph);
	logger('walkFrom', startPos.getX(), startPos.getY());
	logger('walkTo', endPos.getX(), endPos.getY());
    var start = graph.grid[startPos.getX()][startPos.getY()];
    var end = graph.grid[ endPos.getX() ][ endPos.getY() ];
    var result = astar.astar.search(graph, start, end);

    result.map(function(gridNode) {
		that.queue.push(new Math2D.Point2D(gridNode.x*50, gridNode.y*50));
    });
}

module.exports = BaseMobileUnit;