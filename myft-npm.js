'use strict';

const MyFTApi = require('./src/myft-api.js');

module.exports = new MyFTApi({
	apiRoot: process.env.MYFT_API_URL,
	headers: {
		'X-API-KEY': process.env.MYFT_API_KEY
	}
});
