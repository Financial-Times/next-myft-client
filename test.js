function rot13 (s) {
	return (s ? s : this)
		.split('')
		.map(function (_) {
			if (!_.match(/[A-Za-z]/)) return _;
			const c = Math.floor(_.charCodeAt(0) / 97);
			const k = (_.toLowerCase().charCodeAt(0) - 83) % 26 || 26;
			return String.fromCharCode(k + (c === 0 ? 64 : 96));
		})
		.join('');
}

// eslint-disable-next-line no-console
console.log('Variable is:', rot13(process.env.SAFE_TO_LOG));
