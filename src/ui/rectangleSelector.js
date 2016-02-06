module.exports = {
	snap : null,
	start : function(x, y) {
		this.x = x;
		this.y = y;
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
		this.width = dx;
		this.height = dy;
		this.rect.attr({
			width : dx,
			height : dy
		});
	},
	isContain : function(pos) {
		return this.x < pos.getX() && this.y < pos.getY() && (pos.getX() < this.x + this.width) && (pos.getY() < this.y + this.height);
	}
}