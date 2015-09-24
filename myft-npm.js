/*global process */
'use strict';
var MyFTApi = require('./src/myft-api.js');

module.exports = new MyFTApi({
	apiReadRoot: 'https://myft-api.ft.com/v1/',
	apiWriteRoot: 'https://ft-next-myft-api.herokuapp.com/v1',
	headers: {
		'X-API-KEY': process.env.USER_PREFS_API_KEY || process.env.MYFT_API_KEY
	}
});
