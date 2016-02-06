var Snap = require('../../thirdparty/snap.svg');

function UnitGraphic(s, options) {
	var that = this;
	this.group = s.g();
	this.bound = {x:0,y:0};
	this._rotate = 0;
	this.options = options;
	Snap.load(options.path, function (f) {
		console.log(options.path + ' loaded svg.', f);
	    g = f.select("g");
	    that.group.append(g);
	});
}

UnitGraphic.prototype.click = function(cb) {
	this.group.click(cb);
}

UnitGraphic.prototype.getPos = function() {
	
}
UnitGraphic.prototype.getWidth = function() {

}

UnitGraphic.prototype.setPos = function(x, y) {
	this.bound.x = x;
	this.bound.y = y;
	this.applyDisplay();
}

UnitGraphic.prototype.rotate = function(r) {
	this._rotate = r;
	this.applyDisplay();
}

UnitGraphic.prototype.setSize = function(sizeX, sizeY) {
	this._scaleX = sizeX / this.options.width;
	this._scaleY = sizeY / this.options.height;
	this.applyDisplay();
}

UnitGraphic.prototype.applyDisplay = function() {
	var myMatrix = new Snap.Matrix();
	myMatrix.translate(this.bound.x, this.bound.y);
	myMatrix.scale(this._scaleX, this._scaleY);
	myMatrix.rotate(this._rotate);
	myMatrix.translate(-(this.options.width/2), -(this.options.height/2));
	this.group.transform(myMatrix);
}

module.exports = UnitGraphic;