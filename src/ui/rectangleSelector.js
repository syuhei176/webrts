module.exports = {
	snap : null,
	start : function(x, y) {
		this.x = x;
		this.y = y;
		this.start_x = x;
		this.start_y = y;
		this.rect = this.snap.rect(x, y, 1, 1);
		this.rect.attr({
			fill : "none",
			stroke : "#333",
			strokeWidth : 2
		});
	},
	end : function() {
		this.rect.remove();
	},
	move : function(dx, dy) {
		if(dx < 0) this.x = this.start_x + dx;
		if(dy < 0) this.y = this.start_y + dy;
		this.width = Math.abs(dx);
		this.height = Math.abs(dy);
		this.rect.attr({
			x : this.x,
			y : this.y,
			width : this.width,
			height : this.height
		});
	},
	isContain : function(pos) {
		return this.x < pos.getX() && this.y < pos.getY() && (pos.getX() < this.x + this.width) && (pos.getY() < this.y + this.height);
	}
}