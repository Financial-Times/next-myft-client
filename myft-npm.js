/*global process */
'use strict';
var MyFTApi = require('./src/myft-api.js');

module.exports = new MyFTApi({
	//apiRoot: process.env.MYFT_API_URL,
	apiRoot: 'https://ft-next-myft-api.herokuapp.com/v2/',
	headers: {
		'X-API-KEY': process.env.USER_PREFS_API_KEY || process.env.MYFT_API_KEY
	}
});
