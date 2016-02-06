module.exports = [{
	id : 'villager',
	name : '市民',
	graphic : {
		path : 'unit/city.svg',
		width : 80,
		height : 80,
	},
	unitinfo : {
		type : 'trainable',
		size : 1
	}
},{
	id : 'militia',
	name : '市民',
	graphic : {
		path : 'unit/sword.svg',
		width : 80,
		height : 80,
	},
	unitinfo : {
		type : 'trainable',
		size : 1
	}
},{
	id : 'town',
	name : '町の中心',
	graphic : {
		path : 'building/town.svg',
		width : 80,
		height : 80,
	},
	unitinfo : {
		type : 'building',
		size : [5, 5]
	}
},{
	id : 'tree',
	name : '木',
	graphic : {
		path : 'nature/tree.svg',
		width : 160,
		height : 160
	},
	unitinfo : {
		type : 'nature',
		size : 2
	}
},{
	id : 'fruit',
	name : '果物',
	graphic : {
		path : 'nature/fruits.svg',
		width : 160,
		height : 160
	},
	unitinfo : {
		type : 'nature',
		size : 1
	}
}]