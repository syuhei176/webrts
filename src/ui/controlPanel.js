function ControlPanel(baseDom) {
	var that = this;
	var wrapper = document.createElement('div');
	wrapper.classList.add('control-panel-wrapper');
	baseDom.appendChild(wrapper);

	var mapDom = document.createElement('div');
	var infoDom = document.createElement('div');
	var palletDom = document.createElement('div');

	mapDom.classList.add('map-panel-wrapper');
	infoDom.classList.add('info-panel-wrapper');
	palletDom.classList.add('pallet-panel-wrapper');
	wrapper.appendChild(mapDom);
	wrapper.appendChild(infoDom);
	wrapper.appendChild(palletDom);

	this.infoElem = infoDom;
	this.target = null;
	setInterval(function() {
		if(that.target) that.infoElem.innerHTML = that.target.getInfo();
	}, 2000);
}

ControlPanel.prototype.setTarget = function(target) {
	this.target = target;
	this.infoElem.innerHTML = target.getInfo();
}

module.exports = ControlPanel;