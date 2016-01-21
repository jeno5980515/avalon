(function(){
	var express = require('express');
	var app = express();
	var server = require('http').createServer(app);
	var io = require('socket.io')(server);
	var port = 8080 ;

	server.listen(port, function () {
	  console.log('Server listening at port %d', port);
	});

	app.use(express.static(__dirname ));


	var room = {} ;
	var clients = {} ;
	io.sockets.on('connection', function (socket) { 
		clients[socket.id] = socket ; 
	    socket.on('create', function (data) {
	    	var u = data.user ;
	    	var number = makeRoom(u) ;
		   	socket.emit('create', {number:number,status:"success"} );
		   	socket.join(number);
		   	room[number].id.push(socket.id) ;
		   	io.sockets.in(number).emit("join",{status:"success",users:room[number].user,user:u,number:number});
	    });
	    socket.on('message',function (data){
			io.sockets.in(data.number).emit('message', {user:data.user,text:data.text});
	    });

		socket.on("join",function (data){
			var user = data.user ;
			var number = data.number ;
			if ( room[number] === undefined ){
				socket.emit("join",{status:"fail"});
			} else {
				var users = room[number].user ;
				users.push(user);
		   		room[number].id.push(socket.id) ;
				socket.join(number);
				io.sockets.in(number).emit("join",{status:"success",users:users,"user":user});
				showRole(number);
			}
		});

		socket.on('leave', function (data) {
			var user = data.user ;
			var number = data.number ;
			if ( number !== null && number !== undefined  ){
				var index = room[number].user.indexOf(number) ;
				room[number].user.splice(index, 1);
				room[number].id.splice(index, 1);
				io.sockets.in(number).emit('leave', {user:user,users:room[number].user});
			}
		});
		socket.on("role",function (data){
			var number = data.number ;
			var r = data.role ;
			var index = room[number].role.indexOf(r) ;
			if ( index === -1 ){
				room[number].role.push(r) ;
			} else {
				room[number].role.splice(index, 1);
				room[number].id.splice(index, 1);
			}
			showRole(number);
		})
		socket.on("start", function (data){
			var number = data.number ;
			var user = data.user ;
			if ( room[number].create !== user ){
				socket.emit("start",{status:"fail"}) ;
			} else {
				var id = room[number].id;
				var u = room[number].user ;
				var newId = [] ;
				var newU = [] ;
				var maxNum = 4;  
				var minNum = 0;  
				while ( maxNum >= 0 ){
					var n = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
					newId.push(id[n]);
					newU.push(u[n]);
					id.splice(n, 1);
					u.splice(n, 1);
					maxNum -- ;
				}
				room[number].id = newId ;
				room[number].user = newU ;
				io.sockets.in(number).emit("rearrange",{users:room[number].user});

				room[number].c = [] ;
				var a = ["梅林","刺客","好人","好人","壞人"] ;
				room[number].amount = [2,3,2,3,3] ;
				var maxNum = 4;  
				var minNum = 0;  
				while ( maxNum >= 0 ){
					var n = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
					room[number].c.push(a[n]) ;
					a.splice(n, 1);
					maxNum -- ;
				}
				var bArray = [] ;
				for ( var i = 0 ; i < room[number].c.length ; i ++ ){
					if ( room[number].c[i] === "刺客" || room[number].c[i] === "壞人"){
						bArray.push(i) ;
					}
				}
				for ( var i = 0 ; i < room[number].c.length ; i ++ ){
					if ( room[number].c[i] === "梅林" || room[number].c[i] === "刺客" || room[number].c[i] === "壞人"){
						clients[room[number].id[i]].emit("start",{c:room[number].c[i],status:"success",b:bArray}) ;
					} else {
						clients[room[number].id[i]].emit("start",{c:room[number].c[i],status:"success"}) ;
					}
				}
				io.sockets.in(number).emit('status', {round:room[number].round,vote:room[number].vote,amount:room[number].amount[room[number].round-1],cap:room[number].cap,success:room[number].successAmount,fail:room[number].failAmount});
				io.sockets.in(number).emit('console',{console:"隊長正在選擇隊員。"})
				clients[room[number].id[room[number].cap]].emit("caption",{amount:room[number].amount[room[number].round-1],users:room[number].user}) ;
			}
		})
		socket.on("caption",function (data){
			var number = data.number ;
			room[number].mission = [] ;
			for ( var i = 0 ; i < data.users.length ; i ++ ){
				room[number].mission.push(data.users[i]) ;
			} 
			io.sockets.in(number).emit('chooseUser',{users:data.users}) ;
			io.sockets.in(number).emit('console',{console:"隊長選擇好隊員了 請投票。"}) ;
		})
		socket.on("vote",function (data){
			var number = data.number ;
			var user = data.user ;
			var choose = data.choose ;
			room[number].voteArray.push({id:socket.id,"user":user,"choose":choose});
			io.sockets.in(number).emit('console',{console:user+" 已經投好票了。"}) ;
			if ( room[number].voteArray.length >= room[number].user.length ){
				var y = 0 ;
				var n = 0 ; 
				for ( var i = 0 ; i < room[number].voteArray.length ; i ++ ){
					if ( room[number].voteArray[i].choose === "y" ){
						y ++ ;
						io.sockets.in(number).emit('console',{console:room[number].voteArray[i].user+" 贊成。"}) ;
					} else {
						n ++ ;
						io.sockets.in(number).emit('console',{console:room[number].voteArray[i].user+" 反對。"}) ;
					}
				}
				io.sockets.in(number).emit('console',{console:"贊成："+y +"，反對："+n}) ;
				if ( y > n ){
					room[number].vote = 1 ;
					io.sockets.in(number).emit('console',{console:"贊成過半！隊員正在出任務中。"}) ;
					for ( var i = 0 ; i < room[number].mission.length ; i ++ ){
						clients[room[number].id[room[number].mission[i]]].emit("mission","mission") ;
					}

				} else {
					io.sockets.in(number).emit('console',{console:"贊成未過半！隊長替換成下一位玩家！"}) ;
					room[number].vote ++ ;
					if ( room[number].vote > 5 ){
						io.sockets.in(number).emit('console',{console:"壞人獲勝！"}) ;
					} else {
						if ( room[number].vote === 5 ) {
							io.sockets.in(number).emit('console',{console:"注意！這是最後一次投票！"}) ;
						}
						room[number].voteArray = [] ;
						room[number].cap ++ ;
						if ( room[number].cap >= room[number].user.length ){
							room[number].cap = 0 ;
						}
						io.sockets.in(number).emit('status', {round:room[number].round,vote:room[number].vote,amount:room[number].amount[room[number].round-1],cap:room[number].cap,success:room[number].successAmount,fail:room[number].failAmount});
						io.sockets.in(number).emit('console',{console:"隊長正在選擇隊員。"});
						clients[room[number].id[room[number].cap]].emit("caption",{amount:room[number].amount[room[number].round-1],users:room[number].user}) ;
					}
				}
			}
		});	
		socket.on("mission",function (data){
			var number = data.number ;
			var user = data.user ;
			var choose = data.choose ;
			room[number].missionAmount ++ ;
			if ( choose === "n" ){
				room[number].missionResult ++  ;
			}
			io.sockets.in(number).emit('console',{console:user+" 已經出完任務了。"}) ;
			if ( room[number].missionAmount >= room[number].mission.length ){
				io.sockets.in(number).emit('console',{console:"成功："+(room[number].missionAmount-room[number].missionResult)+"，失敗："+room[number].missionResult}) ;
				if ( room[number].missionResult === 0 ){
					room[number].successAmount ++ ;
					io.sockets.in(number).emit('console',{console:"任務成功。"}) ;
				} else {
					room[number].failAmount ++ ;
					io.sockets.in(number).emit('console',{console:"任務失敗。"}) ;
				}
				if ( room[number].successAmount >= 3 ){
					io.sockets.in(number).emit('console',{console:"好人獲勝。"}) ;
					io.sockets.in(number).emit('console',{console:"壞人現身，刺客選擇刺殺對象。"}) ;
					var good = [] ;
					var ass ;
					for ( var i = 0 ; i < room[number].c.length ; i ++ ){
						if ( room[number].c[i] === "壞人" || room[number].c[i] === "刺客" ){
							io.sockets.in(number).emit('console',{console:room[number].user[i]+" 身份："+room[number].c[i]}) ;
							if ( room[number].c[i] === "刺客"  ){
								ass = i ;
							}
						} else {
							good.push({index:i,user:room[number].user[i]});
						}
					}
					io.sockets.in(number).emit('status', {round:room[number].round,vote:room[number].vote,amount:room[number].amount[room[number].round-1],cap:room[number].cap,success:room[number].successAmount,fail:room[number].failAmount});
					clients[room[number].id[ass]].emit("ass",{good:good}) ;
				} else if ( room[number].failAmount >= 3 ){
					io.sockets.in(number).emit('console',{console:"壞人獲勝。"}) ;
					for ( var i = 0 ; i < room[number].c.length ; i ++ ){
						io.sockets.in(number).emit('console',{console:room[number].user[i]+" 身份："+room[number].c[i]}) ;
					}
					io.sockets.in(number).emit('status', {round:room[number].round,vote:room[number].vote,amount:room[number].amount[room[number].round-1],cap:room[number].cap,success:room[number].successAmount,fail:room[number].failAmount});
				} else {
					room[number].round ++ ;
					room[number].voteArray = [] ;
					room[number].cap ++ ;
					if ( room[number].cap >= room[number].user.length ){
						room[number].cap = 0 ;
					}
					room[number].vote = 1 ;
					room[number].mission = [] ;
					room[number].missionResult = 0 ;
					room[number].missionAmount = 0 ;
					io.sockets.in(number).emit('console',{console:"替換下一名隊長。"});
					io.sockets.in(number).emit('status', {round:room[number].round,vote:room[number].vote,amount:room[number].amount[room[number].round-1],cap:room[number].cap,success:room[number].successAmount,fail:room[number].failAmount});
					io.sockets.in(number).emit('console',{console:"隊長正在選擇隊員。"});
					clients[room[number].id[room[number].cap]].emit("caption",{amount:room[number].amount[room[number].round-1],users:room[number].user}) ;
				}
			}

		});
		socket.on("ass",function (data){
			var user = data.user ;
			var index = data.index ;
			var number = data.number ;
			if ( room[number].c[index] === "梅林" ){
				io.sockets.in(number).emit('console',{console:"刺中梅林！壞人獲勝！"}) ;
			} else {
				io.sockets.in(number).emit('console',{console:"刺殺失敗！好人獲勝！"}) ;
			}
			for ( var i = 0 ; i < room[number].c.length ; i ++ ){
				if (room[number].c[i] !== "壞人" || room[number].c[i] !== "刺客" )
					io.sockets.in(number).emit('console',{console:room[number].user[i]+" 身份："+room[number].c[i]}) ;
			}
		});
	});

	var showRole = function(number){
		io.sockets.in(number).emit('role', {role:room[number].role});
	}

	var makeRoom = function(creater){
		var maxNum = 4000;  
		var minNum = 6000;  
		var number = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
		while ( room.number !== undefined ){
			number = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
		}
		room[number] = {} ;
		room[number].role = [] ;
		room[number].create = creater ;
		room[number].user = [] ;
		room[number].id = [] ;
		room[number].c = [] ;
		room[number].cap = 0 ;
		room[number].round = 1 ;
		room[number].vote = 1 ;
		room[number].voteArray = [] ;
		room[number].amount = [] ;
		room[number].mission = [] ;
		room[number].missionResult = 0 ;
		room[number].missionAmount = 0 ;
		room[number].successAmount = 0 ;
		room[number].failAmount = 0 ;
		room[number].user.push(creater) ;
		return number ;
	}
})();