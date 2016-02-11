var util = require('util');
var Math2D = require('./math2d');
var BaseUnit = require('./BaseUnit');
var logger = require('../util/log').logger('BasePersonUnit');
var astar = require('../algorithm/astar');

function PersonUnitStatus() {
	return {
		status : PersonUnitStatus.STATUS_WAIT,
		dest : null,
		target : null,
		gathering : null,
		gathering_amount : 0
	}
}
PersonUnitStatus.STATUS_WAIT = 1;
PersonUnitStatus.STATUS_MOVING_TO_POS = 2;
PersonUnitStatus.STATUS_MOVING_TO_TARGET = 3;
PersonUnitStatus.STATUS_GATHERING = 4;
PersonUnitStatus.STATUS_ATTACKING = 5;

function BasePersonUnit(graphic, info, map, player) {
	var that = this;
	BaseUnit.call(this, graphic, info, map, player);
	this.status = new PersonUnitStatus();
	this.attack = 5;
	this.range = 3;
	this.speed = 4;
	this.nextDestination = null;
	this.queue = [];
	this.count = 0;
	this.count2 = 0;
}

util.inherits(BasePersonUnit, BaseUnit);

BasePersonUnit.prototype.draw = function(status) {
	//表示
}

BasePersonUnit.prototype.main = function() {
	if(this.status.status == PersonUnitStatus.STATUS_MOVING_TO_POS ||
		this.status.status == PersonUnitStatus.STATUS_MOVING_TO_TARGET) {
		if(this.nextDestination) {
			this.pos = this.pos.add(this.vec);
			if(this.map.hit(this)) {
				this.pos = this.pos.sub(this.vec);
				this.count2--;
				if(this.count2 <= 0) {
					if(this.status.status == PersonUnitStatus.STATUS_MOVING_TO_POS) {
						this.walk(this.status.dest);
					}else{
						this.target(this.status.target);
					}
				}
			}else{
				this.count--;
			}
			this.graphic.setPos(this.pos.getX(), this.pos.getY());
			if(this.count <= 0) this.nextDestination = null;
		}else{
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
	if(this.status.status == PersonUnitStatus.STATUS_MOVING_TO_TARGET) {
		var dis = Math2D.Point2D.distance( this.position(), this.status.target.position() );
		if(dis < 80) {
			if(this.status.target.info.type == "building") {
				console.log('Go To Gathering');
				this.player.addResource('tree', this.status.gathering_amount);
				this.status.gathering_amount = 0;
				if(this.status.gathering) {
					this.target(this.status.gathering);
				}else{
					var nature = this.map.unitManager.getNearNature();
					this.status.gathering = nature[0];
					this.target(this.status.gathering);
				}
			}else if(this.status.target.info.type == "nature") {
				console.log('Gathering');
				this.count = 200;
				this.status.status = PersonUnitStatus.STATUS_GATHERING;
				this.status.gathering = this.status.target;
			}
		}
	}else if(this.status.status == PersonUnitStatus.STATUS_GATHERING){
		this.count--;
		if(this.count <= 0) {
			this.status.gathering_amount += this.status.gathering.decrease(10);
			if(this.status.gathering_amount == 0) {
				this.status.gathering = null;
			}
			console.log('building');
			var buildings = this.map.unitManager.getNearBuilding();
			this.target( buildings[0] );
		}
	}
}



BasePersonUnit.prototype.move = function(d) {
	this.queue.push(d);
}

BasePersonUnit.prototype.target = function(unit) {
	this.walk(unit.position());
	this.status.status = PersonUnitStatus.STATUS_MOVING_TO_TARGET;
	this.status.target = unit;
}

BasePersonUnit.prototype.walk = function(x, y) {
	if(x instanceof Math2D.Point2D) {
		y = x.getY();
		x = x.getX();
	}
	var that = this;

	//clear
	this.count--;
	this.queue = [];

	this.status.status = PersonUnitStatus.STATUS_MOVING_TO_POS;
	this.status.dest = new Math2D.Point2D(x, y);

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

module.exports = BasePersonUnit;