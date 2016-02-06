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
		this.rect.attr({
			width : this.x + dx,
			height : this.y + dy
		});
	}
}