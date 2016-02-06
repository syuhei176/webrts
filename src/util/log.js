module.exports = {
	name : "*",
	logger : function(name) {
		return function() {
			if(name.match(this.name)) {
				console.log.apply(console, arguments);
				/*
				var dom = document.createElement('div');
				dom.textContent = JSON.stringify(arguments);
				document.getElementById('debug').appendChild(dom);
				*/
			}
		}
	}
}