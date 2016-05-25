function Menu(baseDom) {
	var that = this;
	var wrapper = document.createElement('div');
	wrapper.classList.add('menu-panel-wrapper');
	baseDom.appendChild(wrapper);

	this.treeDom = document.createElement('div');
	wrapper.appendChild(this.treeDom);

}

Menu.prototype.update = function(name, value) {
	this.treeDom.textContent = value;
};


module.exports = Menu;