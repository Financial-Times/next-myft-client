'use strict';

const sanitizeBoolean = (str) => {
	if(str === 'true') return true;
	if(str === 'false') return false;
	return str;
};

function isPlainObject (datum) {
	return (typeof datum === 'object' && Object.prototype.toString.call(datum) === '[object Object]');
}

function findStringValues (object) {
	if (Array.isArray(object)) {
		object.forEach(item => {
			findStringValues(item);
		});
	} else if (isPlainObject(object)) {
		Object.keys(object).forEach(key => {
			if(typeof object[key] === 'string') {
				object[key] = sanitizeBoolean(object[key]);
			} else if (Array.isArray(object[key])) {
				object[key].forEach(item => {
					findStringValues(item);
				});
			} else if (isPlainObject(object[key])) {
				findStringValues(object[key]);
			}
		});
	}
	return object;
}

module.exports = (data) => {
	if (data) {
		return findStringValues(data);
	} else {
		return data;
	}
};
