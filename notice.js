(function(){
	//var socket = io.connect('http://avalon-test.herokuapp.com/');
	///var socket = io.connect('http://my-avalon.herokuapp.com/');
	//var socket = io.connect('localhost:8080');
	var fs = require('fs');
	fs.writeFile("notice", "Hello!\noutput file\nby Node.js", function(err) {
	    if(err) {
	        console.log(err);
	    } else {
	        console.log("The file was saved!");
	    }
	});

})();