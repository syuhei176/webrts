var EventEmitter = require('eventemitter2').EventEmitter2;
var util = require('util');

function BaseUnit(graphic, info) {
	var that = this;
	EventEmitter.call(this);
	that.graphic = graphic;
	this.info = info;
	if(info.size instanceof Array) {
		that.graphic.setSize(info.size[0] * 50, info.size[1] * 50);
	}else{
		that.graphic.setSize(info.size * 50, info.size * 50);
	}
}

util.inherits(BaseUnit, EventEmitter);

BaseUnit.prototype.init = function(info) {
	//表示
}


BaseUnit.prototype.draw = function(status) {
	//表示
}

module.exports = BaseUnit;