var Snap = require('../thirdparty/snap.svg');
var unitInfo = require('./unit');
var Game = require('./core');

function RTS() {

}

RTS.prototype.start = function() {
	window.addEventListener('load', function() {

		var requestAnimationFrame = getRequestAnimationFrame();

		//var item = new PanelItem();
		//gameを作成
		var game = new Game(requestAnimationFrame);
		//item.add(game);
	});
}

function getRequestAnimationFrame() {
	return window.requestAnimationFrame ||
	                window.webkitRequestAnimationFrame ||
	                window.mozRequestAnimationFrame    ||
	                window.oRequestAnimationFrame      ||
	                window.msRequestAnimationFrame     ||
	                null ;
}

window.RTS = new RTS();

module.exports = RTS;


function PanelItem() {

}