(function(){
	var express = require('express');
	var app = express();

	app.use('/avalon', require('./avalon'));
	var port = Number(process.env.PORT || 8080);
	app.listen(port);
})();