var Snap = require('../../thirdparty/snap.svg');

function UnitGraphic(snap, group, options, onLoad) {
	var that = this;
	this.snap = snap;
	this.group = snap.g();
	this.unitGroup = snap.g();
	this.bound = {x:0,y:0};
	this._rotate = 0;
	this.options = options;
	group.append(this.group);
	Snap.load(options.path, function (f) {
		console.log(options.path + ' loaded svg.', f);
	    g = f.select("g");
	    that.group.append(g);
	    if(onLoad) onLoad();
	});
	this.statusText = this.snap.text(0,32,"").attr({
		"font-size": 20
	});
	this.group.append(this.statusText);
}

UnitGraphic.prototype.setPlayerColor = function(player) {
	var circle = this.snap.circle(0, 0, 10);
	circle.attr({
		fill: player.getColor() || "#00f"
	});
	this.group.append(circle);
}

UnitGraphic.prototype.setStatus = function(text) {
	this.statusText.attr({
		text: text
	});
}

UnitGraphic.prototype.flashing = function() {
	var text = this.snap.text(0,0,"Damage").attr({
		"font-size": 20
	});
	this.group.append(text);
	text.stop().animate({
		"font-size": 32
	}, 100, null, function() {
		text.remove();
	});
}

UnitGraphic.prototype.remove = function() {
	this.group.remove();
}

UnitGraphic.prototype.click = function(cb) {
	this.group.mouseup(cb);
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
	this._width = sizeX;
	this._height = sizeY;
	this._scaleX = sizeX / this.options.width;
	this._scaleY = sizeY / this.options.height;
	this.applyDisplay();
}

UnitGraphic.prototype.applyDisplay = function() {
	var myMatrix = new Snap.Matrix();
	myMatrix.translate(this.bound.x+(this._width/2), this.bound.y+(this._height/2));
	myMatrix.rotate(this._rotate);
	myMatrix.scale(this._scaleX, this._scaleY);
	myMatrix.translate(-(this.options.width/2), -(this.options.height/2));
	this.group.transform(myMatrix);
}

module.exports = UnitGraphic;