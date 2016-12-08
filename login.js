(function(){
	var express = require('express');
	var app = express();
	var path  = require("path");
	var server = require('http').createServer(app);
	var io = require('socket.io').listen(server);
	app.use(function (req, res, next) {
	  res.header("Access-Control-Allow-Origin", "http://localhost:8080");
	  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	  res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type");
	  res.header("Access-Control-Allow-Credentials", "true");
	  next();
	});

	var bodyParser = require('body-parser')
	app.use( bodyParser.json() );       // to support JSON-encoded bodies
	app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
	  extended: true
	})); 
	
	server.listen(8070);
	app.get('/',function(req,res){
       
	    res.sendFile(path.join(__dirname+'/login.html'));

	});

	var checkUserExist = function(connection,id,existCallback,newCallback){
		var queryString = 'SELECT * FROM `avalon_user` WHERE `id` = "' + id + '"' ;
		connection.query(queryString, function(err, rows, fields) {
		    if (err) throw err;
		    if ( rows.length > 0 ){
		    	existCallback(rows);
  			} else {
  				newCallback();
  			}
		});
	}

	app.post("/login", function (req, res) {
		var id = req.body.id ;
		var mysql = require('mysql');
		var connection = mysql.createConnection({
		    host: '182.254.219.127',
		    user: 'avalon_user',
		    password: 'avalon_user',
		    database: 'user',
	    	insecureAuth: true
		});
		connection.connect();
		checkUserExist(connection,id,function (rows){ 
  			res.send({status : "exist" , name : rows[0].name });
			connection.end();
		},function(){
  			res.send({status : "new"});
			connection.end();
		});

		/*
		var data = {
		    id: id,
		    name: '345'
		};

		connection.query('INSERT INTO `avalon_user` SET ?', data, function(error){
		    if(error){
		        console.log('寫入資料失敗！');
		        throw error;
		    }
		});
		*/
	});

	function stripHTML(input) {
		if ( input !== input.replace(/(<([^>]+)>)/ig,"") )
			return true ; 
		else 
			return false ;
	}

	app.post("/new", function (req, res) {
		var id = req.body.id ;
		var name = req.body.name ;
		if ( name === "" ||  name.length > 6 || stripHTML(name) === true ){
			res.send({status : "invalid"});
		} else {
			var mysql = require('mysql');
			var connection = mysql.createConnection({
			    host: '182.254.219.127',
			    user: 'avalon_user',
			    password: 'avalon_user',
			    database: 'user',
		    	insecureAuth: true
			});
			connection.connect();		
			checkUserExist(connection,id,function(){
	  			res.send({status : "exist"});
				connection.end();
			},function(){
				var queryString = 'SELECT * FROM `avalon_user` WHERE `name` = "' + name + '"' ;
				connection.query(queryString, function(err, rows, fields) {
				    if (err) throw err;
				    if ( rows.length > 0 ){
		  				res.send({status : "fail"});
						connection.end();
		  			} else {
				  		var data = {
						    id: id,
						    name: name
						};
						connection.query('INSERT INTO `avalon_user` SET ?', data, function(error){
						    if(error){
						        console.log('寫入資料失敗！');
						        throw error;
						    }
							connection.end();
						});
		  				res.send({status : "success"});
		  			}
				});
			}
		});


	});

})();