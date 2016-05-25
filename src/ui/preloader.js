function PreLoader(baseDom) {
	var that = this;
	var wrapper = document.createElement('div');
	wrapper.classList.add('loading-animation');
	var ballsDom = document.createElement('div');
	ballsDom.classList.add('balls');
	wrapper.appendChild(ballsDom);
	baseDom.appendChild(wrapper);

	this.wrapper = wrapper;
}

PreLoader.prototype.show = function() {
	this.wrapper.style["display"] = "block";
}

PreLoader.prototype.hide = function() {
	this.wrapper.style["display"] = "none";
}

module.exports = PreLoader;