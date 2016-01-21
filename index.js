(function(){
	var express = require('express');
	var app = express();
	var server = require('http').createServer(app);
	var io = require('socket.io')(server);
	var port = 8080 ;

	app.listen(port, function () {
	  console.log('Server listening at port %d', port);
	});

	//app.use(express.static(__dirname ));

	app.get('/', function (req, res) {
	  res.render('index.html');
	});

})();