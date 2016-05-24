function ControlPanel() {
	var that = this;
	//var wrapper = document.createElement('div');
	//wrapper.classList.add('control-panel-wrapper');
	//document.body.appendChild(wrapper)
	this.infoElem = document.getElementById('cp-info');
	this.target = null;
	setInterval(function() {
		if(that.target) that.infoElem.innerHTML = that.target.toString();
	}, 2000);
}

ControlPanel.prototype.setTarget = function(target) {
	this.target = target;
	this.infoElem.innerHTML = target.toString();
}

module.exports = ControlPanel;