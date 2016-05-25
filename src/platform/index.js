var pc = require('./pc');
var sp = require('./sp');
var UserAgent = require('../platform/ua');

module.exports = function() {
	var ua = UserAgent();
	if(ua.mobile[0] || ua.tablet) {
		return sp();
	}else{
		return pc();
	}
}