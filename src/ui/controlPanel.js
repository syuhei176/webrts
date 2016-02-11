function ControlPanel() {
	//var wrapper = document.createElement('div');
	//wrapper.classList.add('control-panel-wrapper');
	//document.body.appendChild(wrapper)
	this.infoElem = document.getElementById('cp-info');
}

ControlPanel.prototype.setTarget = function(target) {
	this.infoElem.innerHTML = target.amount;
}

module.exports = ControlPanel;