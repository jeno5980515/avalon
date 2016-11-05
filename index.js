(function(){
	var express = require('express');
	var app = express();
	var server = require('http').createServer(app);
	var io = require('socket.io').listen(server);
	server.listen(process.env.PORT || 8080);
	//server.listen(8080);
	app.use(express.static(__dirname ));
	var amountList = [0,1,2,3,4,
		[2,3,2,3,3],
		[2,3,4,3,4],
		[2,3,3,4,4],
		[3,4,4,5,5],
		[3,4,4,5,5],
		[3,4,4,5,5]
	]

	var bgamount = [0,1,2,3,4,
		["梅林","好人","好人","刺客","壞人"],
		["梅林","好人","好人","好人","刺客","壞人"],
		["梅林","好人","好人","好人","刺客","壞人","壞人"],
		["梅林","好人","好人","好人","好人","刺客","壞人","壞人"],
		["梅林","好人","好人","好人","好人","好人","刺客","壞人","壞人"],
		["梅林","好人","好人","好人","好人","好人","刺客","壞人","壞人","壞人"]
	]

	var bodyParser = require('body-parser')
	app.use( bodyParser.json() );       // to support JSON-encoded bodies
	app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
	  extended: true
	})); 
	
	// delete the notice part!

	var updateNotice = function(data){
		var fs = require('fs');
		fs.writeFile("notice", data, function(err) {
		    if(err) {
		        console.log(err);
		    } else {
		        //console.log("The file was saved!");
		    }
		});
	}

	var room = {} ;
	var clients = {} ;
	var Users = {} ;

	function stripHTML(input) {
		if ( input !== input.replace(/(<([^>]+)>)/ig,"") )
			return true ; 
		else 
			return false ;
		/*
	    var output = '';
	    if(typeof(input)=='string'){
	        var output = input.replace(/(<([^>]+)>)/ig,"");
	    }
	    return output;
	    */
	}

	function randomString(length, chars) {
	    var result = '';
	    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
	    return result;
	}


	io.sockets.on('connection', function (socket) { 
		clients[socket.id] = socket ; 
		socket.on("getRoomList",function (data){
			socket.join("roomList");
			getRoomList(socket);
		});
	    socket.on('create', function (data) {
	    	var password = data.password ;
	    	socket.leave("roomList");
	    	var u = data.user ;
	    	var number = makeRoom(u) ;
	    	room[number].password = password ;
	    	room[number].createId = socket.id ;
			Users[socket.id] = {} ;
			Users[socket.id].user = u ;
			Users[socket.id].number = number ;
		   	socket.emit('create', {number:number,status:"success"} );
		   	socket.join(number);
		   	room[number].id.push(socket.id) ;
		   	var isStart = false ;
		   	if ( room[number] !== undefined ){
		   		isStart = room[number].start ;
		   	}
		   	io.sockets.in(number).emit("join",{status:"success",users:room[number].user,user:u,number:number,isStart:isStart});
		   	getRoomList();
	    });
	    socket.on('message',function (data){
	    	var text = data.text ;
			if (stripHTML(text) === true) {
				socket.emit('messageFail',{status:1}) ;
			} else {
				io.sockets.in(data.number).emit('message', {user:data.user,text:data.text});
			}
	    });

		socket.on("join",function (data){
			var user = data.user ;
			var number = data.number ;
			var password = data.password ;
			if ( room[number] === undefined || room[number].start === true || room[number].isFull === true ){
				socket.emit("join",{status:"fail"});
			} else if ( room[number].password === "" || room[number].password === password ){
	    		socket.leave("roomList");
				Users[socket.id] = {} ;
				Users[socket.id].user = user ;
				Users[socket.id].number = number ;
				var users = room[number].user ;
				users.push(user);
		   		room[number].id.push(socket.id) ;
				socket.join(number);
			   	var isStart = false ;
			   	if ( room[number] !== undefined ){
			   		isStart = room[number].start ;
			   	}
				io.sockets.in(number).emit("join",{status:"success",users:users,"user":user,number:number,isStart:isStart});
				showRole(number);
				if ( room[number].user.length >= 10 ){
					room[number].isFull = true ;
				} else {
					room[number].isFull = false ;
				}
			} else {
				socket.emit("join",{status:"fail"});
			}
			getRoomList();
		});
		socket.on('disconnect', function() {
			console.log(socket.id);
			if ( Users[socket.id] !== undefined ){
				var number = Users[socket.id].number  ;
				if ( room[number] !== undefined )
					room[number].disconnectCount ++ ;
				if ( room[number] !== undefined && room[number].start === false ){
					var index = room[number].id.indexOf(socket.id) ;
					if ( index !== -1 ){
						var user = room[number].user[index] ;
						room[number].user.splice(index,1) ;
						room[number].id.splice(index,1) ;
						socket.leave(number);
						io.sockets.in(number).emit("leave",{status:"success",users:room[number].user,"user":user,number:number});
						resetRole(number);
						showRole(number);
						if ( room[number].user.length >= 10 ){
							room[number].isFull = true ;
						} else {
							room[number].isFull = false ;
						}
						getRoomList();
						if ( room[number].create === Users[socket.id].user ){
							if ( room[number].user.length !== 0 ){
								room[number].create = room[number].user[0] ;
								io.sockets.in(number).emit('console',{console: "室長替換成 "+ room[number].user[0] , notify : true  }) ;
								clients[room[number].id[0]].emit('changeCreater',{});
								resetRole(number);
								showRole(number);
								io.sockets.in(number).emit("restart",{status:"success",users:room[number].user,number:number});
							}  else {
								delete room[number] ;
								getRoomList();
							}
						} 			
					}	
				} else {
					if ( room[number] !== undefined ){
						room[number].disUser.push(socket.id);
						var index = room[number].id.indexOf(socket.id) ;
						if ( index !== -1 ){
							var user = room[number].user[index] ;
							io.sockets.in(number).emit('console',{console:user+" 斷線，請等候回復。" , notify : true }) ;
							if ( room[number].disconnectCount === room[number].user.length ){
								delete room[number] ;
								getRoomList();
							}
						}
					}
				}
			} 
		});
		socket.on('leave', function (data) {
			var user = data.user ;
			var number = data.number ;
			if ( room[number] !== undefined && room[number].start === false ){
				var index = room[number].id.indexOf(socket.id) ;
				if ( index !== -1 ){
					var user = room[number].user[index] ;
					room[number].user.splice(index,1) ;
					room[number].id.splice(index,1) ;
					socket.leave(number);
					io.sockets.in(number).emit("leave",{status:"success",users:room[number].user,"user":user,number:number});
					resetRole(number);
					showRole(number);
					if ( room[number].user.length >= 10 ){
						room[number].isFull = true ;
					} else {
						room[number].isFull = false ;
					}
					getRoomList();
					if ( room[number].create === Users[socket.id].user ){
						if ( room[number].user.length !== 0 ){
							room[number].create = room[number].user[0] ;
							io.sockets.in(number).emit('console',{console: "室長替換成 "+ room[number].user[0] , notify : true  }) ;
							clients[room[number].id[0]].emit('changeCreater',{});
							resetRole(number);
							showRole(number);
							io.sockets.in(number).emit("restart",{status:"success",users:room[number].user,number:number});
						}  else {
							delete room[number] ;
							getRoomList();
						}
					} 	
					socket.join("roomList");
					getRoomList();
				}
			}
		});
		socket.on("role",function (data){
			if ( data.oldRole === undefined ){ 
				var number = data.number ;
				var r = data.role ;
				if ( room[number] !== undefined ){
					var index = room[number].role.indexOf(r) ;
					room[number].role.push(r) ;

					showRole(number);
				}
				/*
				if ( index === -1 ){
					room[number].role.push(r) ;
				} else {
					room[number].role.splice(index, 1);
					room[number].id.splice(index, 1);
				}
				*/
			} else {
				var oldRole = data.oldRole ;
				var newRole = data.newRole ;
				var number = data.number ;
				if ( room[number] !== undefined ){ 
					var index = room[number].role.indexOf(oldRole) ;
					room[number].role[index] = newRole ;
					io.sockets.in(number).emit('console',{console:"室長將 " + oldRole + " 替換成 " + newRole , notify : true }) ;

					showRole(number,oldRole);
				}
			}
		});
		var resetRole = function(number){
			if ( room[number] !== undefined ){
				clients[room[number].createId].emit("resetRole",{role:room[number].role});
				if ( room[number].user.length > 5 ){
					room[number].role = bgamount[room[number].user.length].slice();
					showRole(number);
				} else {
					room[number].role = bgamount[5].slice();
					showRole(number);							
				}
			}
		}
		socket.on("resetRole",function (data){
			resetRole(data.number);
		});
		socket.on("restartVote",function (data){
			var user = data.user ;
			var number = data.number ;
			var result = data.result ;
			if ( room[number] !== undefined ){
				if ( room[number].isRestart === true && room[number].start === true ){
					if ( result === true ){
						room[number].restartVote ++ ;
						if ( room[number].restartVote >= Math.ceil(room[number].user.length / 2) ){
							io.sockets.in(number).emit('console',{console:"投票過半，回到房間。", notify : true}) ;
							while ( room[number].disUser.length > 0 ){
								var index = room[number].id.indexOf(room[number].disUser[0]) ;
								if ( index !== -1 ){
									clients[room[number].id[index]].leave(number);
									var oldUser = room[number].user[index] ;
									room[number].id.splice(index,1) ;
									room[number].user.splice(index,1) ;
									io.sockets.in(number).emit("leave",{status:"success",users:room[number].user,"user":oldUser,number:number});
									if ( oldUser === room[number].create ){
										room[number].create = room[number].user[0] ;
										io.sockets.in(number).emit('console',{console: "室長替換成 "+ room[number].user[0] , notify : true  }) ;
										clients[room[number].id[0]].emit('changeCreater',{});
										resetRole(number);
										showRole(number);
									}
								} 
								room[number].disUser.splice(0,1) ;
							}
							io.sockets.in(number).emit('restartResult',{status:"success"}) ;

						} 
					} else {
						room[number].restartVoteNo ++ ;
						if ( room[number].restartVoteNo >= Math.ceil(room[number].user.length / 2) ){
							room[number].restartVote = 0 ;
							room[number].restartVoteNo = 0 ;
							room[number].isRestart = false ;
							io.sockets.in(number).emit('restartResult',{status:"fail"}) ;
						} 
					}
				}
			}
		})
		socket.on("restartRequest",function (data){
			var number = data.number;
			var user = data.user ;
			if ( room[number] !== undefined ){
				if ( room[number].isRestart === false  && room[number].start === true ){
					room[number].isRestart = true ;
					io.sockets.in(number).emit("restartRequest",{status:"success" , user:user });
				} else {
					socket.emit("restartRequest",{status:"fail"});
				}
			}
		})
		socket.on("godSet",function (data){
			var number = data.number;
			var godSet = data.godSet ;
			if ( room[number] !== undefined ){
				if ( room[number].god === false && godSet === true ){
					room[number].god = true ;
					io.sockets.in(number).emit('console',{console:"室長開啟湖中女神。", notify : true}) ;
				} else if ( room[number].god === true && godSet === false ){
					room[number].god = false ;
					io.sockets.in(number).emit('console',{console:"室長關閉湖中女神。", notify : true}) ;
				}
			}
		})
		socket.on("restart", function (data){

			var number = data.number ;
			room[number].role = [] ;
			room[number].disconnectCount = 0 ;
			room[number].c = [] ;
			room[number].cap = 0 ;
			room[number].round = 1 ;
			room[number].missionArray = [];
			room[number].vote = 1 ;
			room[number].disUser = [] ;
			room[number].restartVote = 0 ;
			room[number].restartVoteNo = 0 ;
			room[number].voteArray = [] ;
			room[number].voteDoneArray = [] ;
			room[number].amount = [] ;
			room[number].mission = [] ;
			room[number].isFull = false ;
			room[number].missionResult = 0 ;
			room[number].missionAmount = 0 ;
			room[number].successAmount = 0 ;
			room[number].failAmount = 0 ;
			room[number].wait = [] ;
			room[number].isRestart = false ;
			room[number].god = false ;
			room[number].godArray = [] ;
			room[number].godNumber = 0 ;
			room[number].start = false ;
			room[number].role = bgamount[room[number].user.length];
			io.sockets.in(number).emit("console",{console:"回到房間"});
			io.sockets.in(number).emit("restart",{status:"success",users:room[number].user,number:number});
			showRole(number);
		});
		socket.on("start", function (data){
			var number = data.number ;
			var user = data.user ;
			if ( room[number] !== undefined ){
				if ( room[number].create !== user ){
					socket.emit("start",{status:"fail"}) ;
				} else {
					if ( room[number].user.length < 5 ){
						io.sockets.in(number).emit('console',{console:"人數需要五個人以上。"}) ;
					} else {
						room[number].start = true ;
						for ( var i = 0 ; i < room[number].role.length ; i ++ ){
							room[number].wait.push("n") ;
						}
						var id = room[number].id;
						var u = room[number].user ;
						var newId = [] ;
						var newU = [] ;
						var maxNum = room[number].user.length - 1 ;  
						var minNum = 0;  
						while ( maxNum >= 0 ){
							var n = Math.floor(Math.random() * (maxNum - minNum + 1) + minNum);
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
						var a = room[number].role.slice() ;
						room[number].amount = amountList[room[number].user.length] ;
						var maxNum = room[number].user.length - 1 ;  
						var minNum = 0;  
						while ( maxNum >= 0 ){
							var n = Math.floor(Math.random() * (maxNum - minNum + 1) + minNum);
							room[number].c.push(a[n]) ;
							a.splice(n, 1);
							maxNum -- ;
						}
						var bArray = [] ;
						var bArray2 = [] ;
						var mArray = [] ;
						for ( var i = 0 ; i < room[number].c.length ; i ++ ){
							if ( room[number].c[i] === "刺客" || room[number].c[i] === "壞人"  ||  room[number].c[i] === "莫甘娜" ){
								bArray.push(i) ;
								bArray2.push(i) ;
							} else if ( room[number].c[i] === "奧伯倫" ){
								bArray.push(i) ;
							} else if ( room[number].c[i] === "莫德雷德") {
								bArray2.push(i) ;
							}
						}
						for ( var i = 0 ; i < room[number].c.length ; i ++ ){
							if ( room[number].c[i] === "梅林" || room[number].c[i] === "莫甘娜" ){
								mArray.push(i) ;
							}
						}
						room[number].godNumber = room[number].c.length - 1 ; 
						room[number].godArray.push(room[number].c.length - 1) ;
						for ( var i = 0 ; i < room[number].c.length ; i ++ ){
							clients[room[number].id[i]].emit("save",{id:room[number].id[i]});
							if ( room[number].c[i] === "梅林" ) {
								clients[room[number].id[i]].emit("start",{c:room[number].c[i],status:"success",b:bArray,role:room[number].role,index:i,user:room[number].user,voteDoneArray:room[number].voteDoneArray}) ;
							} else if ( room[number].c[i] === "刺客" || room[number].c[i] === "壞人" || room[number].c[i] === "莫甘娜" || room[number].c[i] === "莫德雷德") {
								clients[room[number].id[i]].emit("start",{c:room[number].c[i],status:"success",b:bArray2,role:room[number].role,index:i,user:room[number].user,voteDoneArray:room[number].voteDoneArray}) ;
							} else if ( room[number].c[i] === "派西維爾") {
								clients[room[number].id[i]].emit("start",{c:room[number].c[i],status:"success",m:mArray,role:room[number].role,index:i,user:room[number].user,voteDoneArray:room[number].voteDoneArray}) ;
							} else {
								clients[room[number].id[i]].emit("start",{c:room[number].c[i],status:"success",role:room[number].role,index:i,user:room[number].user,voteDoneArray:room[number].voteDoneArray}) ;
							}
						}
						io.sockets.in(number).emit('console',{console:"隊長是 " +room[number].user[room[number].cap]}) ;
						io.sockets.in(number).emit('status', {round:room[number].round,vote:room[number].vote,amount:room[number].amount[room[number].round-1],cap:room[number].user[room[number].cap],success:room[number].successAmount,fail:room[number].failAmount,godNumber:room[number].godNumber,godArray:room[number].godArray,capIndex:room[number].cap,missionArray:room[number].missionArray });
						io.sockets.in(number).emit('console',{console:"隊長正在選擇隊員。"});
						room[number].wait[room[number].cap] = "c" ;
						clients[room[number].id[room[number].cap]].emit("caption",{amount:room[number].amount[room[number].round-1],users:room[number].user}) ;
						getRoomList();
					}
				}
			}
		});
		socket.on("caption",function (data){
			var number = data.number ;
			if ( room[number] !== undefined ){
				room[number].mission = [] ;
				for ( var i = 0 ; i < room[number].user.length ; i ++ ){
					room[number].wait[i] = "n" ;
				}
				var list = "隊員：" ;
				for ( var i = 0 ; i < data.users.length ; i ++ ){
					list += room[number].user[data.users[i]] + " " ;
					room[number].mission.push(data.users[i]) ;
				} 
				io.sockets.in(number).emit('chooseUser',{users:data.users}) ;
				io.sockets.in(number).emit('console',{console:"隊長選擇好隊員了 請投票。"}) ;
				io.sockets.in(number).emit('console',{console:list}) ;
				for ( var i = 0 ; i < room[number].user.length ; i ++ ){
					room[number].wait[i] = "v" ;
				}
			}
		});
		socket.on("vote",function (data){
			var number = data.number ;
			var user = data.user ;
			var choose = data.choose ;
			if ( room[number] !== undefined ){
				room[number].voteArray.push({id:socket.id,"user":user,"choose":choose});
				io.sockets.in(number).emit('console',{console:user+" 已經投好票了。"}) ;
				for ( var i = 0 ; i < room[number].id.length ; i ++ ){
					if ( room[number].id[i] === socket.id ){
						room[number].voteDoneArray.push(i);
						io.sockets.in(number).emit('voted',{index:i}) ;
						room[number].wait[i] = "n" ;
						break ;
					}
				}
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
					var v = [] ;
					for ( var i = 0 ; i < room[number].id.length  ; i ++ ){
						for ( var j = 0 ; j < room[number].voteArray.length  ; j ++ ){
							if ( room[number].voteArray[j].id === room[number].id[i] ){
								v.push(room[number].voteArray[j].choose);
								break ;
							}
						}
					}
					io.sockets.in(number).emit('voteResult',{votes:v}) ;
					if ( y > n ){
						room[number].vote = 1 ;
						io.sockets.in(number).emit('console',{console:"贊成過半！隊員正在出任務中。"}) ;
						for ( var i = 0 ; i < room[number].mission.length ; i ++ ){
							clients[room[number].id[room[number].mission[i]]].emit("mission","mission") ;
							room[number].wait[room[number].mission[i]] = "m" ;
						}

					} else {
						room[number].vote ++ ;
						if ( room[number].vote > 5 ){
							var msg = "投票超過五次！壞人獲勝！" ;
							io.sockets.in(number).emit('console',{console:msg}) ;
							io.sockets.in(number).emit('gameoverMessage',msg);
							clients[room[number].createId].emit("gameover",msg) ;
						} else {
							if ( room[number].vote === 5 ) {
								io.sockets.in(number).emit('console',{console:"注意！這是最後一次投票！"}) ;
							}
							room[number].voteDoneArray = [] ;
							room[number].voteArray = [] ;
							room[number].cap ++ ;
							if ( room[number].cap >= room[number].user.length ){
								room[number].cap = 0 ;
							}
							io.sockets.in(number).emit('console',{console:"贊成未過半！隊長替換成 " +room[number].user[room[number].cap]}) ;
							io.sockets.in(number).emit('status', {round:room[number].round,vote:room[number].vote,amount:room[number].amount[room[number].round-1],cap:room[number].user[room[number].cap],success:room[number].successAmount,fail:room[number].failAmount,godNumber:room[number].godNumber,godArray:room[number].godArray,capIndex:room[number].cap,missionArray:room[number].missionArray  });
							io.sockets.in(number).emit('console',{console:"隊長正在選擇隊員。"});
							room[number].wait[room[number].cap] = "c" ;

							io.sockets.in(number).emit('voteResult',{votes:v}) ;
							clients[room[number].id[room[number].cap]].emit("caption",{amount:room[number].amount[room[number].round-1],users:room[number].user}) ;
						}
					}
				}
			}
		});	
		socket.on("mission",function (data){
			var number = data.number ;
			var user = data.user ;
			var choose = data.choose ;
			if ( room[number] !== undefined ){
				room[number].missionAmount ++ ;
				if ( choose === "n" ){
					room[number].missionResult ++  ;
				}
				io.sockets.in(number).emit('console',{console:user+" 已經出完任務了。"}) ;
				for ( var i = 0 ; i < room[number].id.length ; i ++ ){
					if ( room[number].id[i] === socket.id ){
						room[number].wait[i] = "n" ;
						break ;
					}
				}
				if ( room[number].missionAmount >= room[number].mission.length ){
					io.sockets.in(number).emit('console',{console:"成功："+(room[number].missionAmount-room[number].missionResult)+"，失敗："+room[number].missionResult}) ;
					if ( room[number].round === 4 && room[number].user.length >= 7 ){
						if ( room[number].missionResult < 2 ){
							room[number].successAmount ++ ;
							room[number].missionArray.push(true);
							io.sockets.in(number).emit('console',{console:"任務成功。"}) ;
						} else {
							room[number].failAmount ++ ;
							room[number].missionArray.push(false);
							io.sockets.in(number).emit('console',{console:"任務失敗。"}) ;
						}
					} else {
						if ( room[number].missionResult === 0 ){
							room[number].successAmount ++ ;
							room[number].missionArray.push(true);
							io.sockets.in(number).emit('console',{console:"任務成功。"}) ;
						} else {
							room[number].failAmount ++ ;
							room[number].missionArray.push(false);
							io.sockets.in(number).emit('console',{console:"任務失敗。"}) ;
						}
					}
					if ( room[number].successAmount >= 3 ){
						io.sockets.in(number).emit('console',{console:"好人獲勝。"}) ;
						io.sockets.in(number).emit('console',{console:"壞人現身，刺客選擇刺殺對象。"}) ;
						var good = [] ;
						var ass ;
						for ( var i = 0 ; i < room[number].c.length ; i ++ ){
							if ( room[number].c[i] === "壞人" || room[number].c[i] === "刺客" || room[number].c[i] === "莫甘娜"  || room[number].c[i] === "莫德雷德" ){
								io.sockets.in(number).emit('console',{console:room[number].user[i]+" 身份："+room[number].c[i]}) ;
								if ( room[number].c[i] === "刺客"  ){
									ass = i ;
								}
							} else {
								good.push({index:i,user:room[number].user[i]});
							}
						}
						io.sockets.in(number).emit('status', {round:room[number].round,vote:room[number].vote,amount:room[number].amount[room[number].round-1],cap:room[number].user[room[number].cap],success:room[number].successAmount,fail:room[number].failAmount,godNumber:room[number].godNumber,godArray:room[number].godArray,capIndex:room[number].cap,missionArray:room[number].missionArray });
						clients[room[number].id[ass]].emit("ass",{good:good}) ;
						room[number].wait[ass] = "a" ;
					} else if ( room[number].failAmount >= 3 ){
						var msg = "三次任務失敗，壞人獲勝。" ;
						io.sockets.in(number).emit('console',{console:msg}) ;
						for ( var i = 0 ; i < room[number].c.length ; i ++ ){
							io.sockets.in(number).emit('console',{console:room[number].user[i]+" 身份："+room[number].c[i]}) ;
						}
						io.sockets.in(number).emit('gameoverMessage',msg);
						clients[room[number].createId].emit("gameover",msg) ;
						io.sockets.in(number).emit('status', {round:room[number].round,vote:room[number].vote,amount:room[number].amount[room[number].round-1],cap:room[number].user[room[number].cap],success:room[number].successAmount,fail:room[number].failAmount,godNumber:room[number].godNumber,godArray:room[number].godArray,capIndex:room[number].cap ,missionArray:room[number].missionArray });
					} else {
						room[number].round ++ ;
						room[number].voteDoneArray = [] ;
						room[number].voteArray = [] ;
						room[number].cap ++ ;
						if ( room[number].cap >= room[number].user.length ){
							room[number].cap = 0 ;
						}
						room[number].vote = 1 ;
						room[number].mission = [] ;
						room[number].missionResult = 0 ;
						room[number].missionAmount = 0 ;
						if ( room[number].god === true && room[number].role.length >= 7 && room[number].round >= 3 && room[number].round <= 5 ){
							room[number].wait[room[number].godNumber] = "g" ;
							io.sockets.in(number).emit('console',{console:room[number].user[room[number].godNumber]+" 正在使用湖中女神。"});
							var g = [] ;
							for ( var i = 0 ; i < room[number].user.length ; i ++ ){
								var index = room[number].godArray.indexOf(i) ;
								if ( index === -1 ){
									g.push(i) ;
								}
							}
							clients[room[number].id[room[number].godNumber]].emit("god",{users:g}) ;
						} else {
							io.sockets.in(number).emit('console',{console:"隊長替換成 " +room[number].user[room[number].cap]}) ;
							io.sockets.in(number).emit('status', {round:room[number].round,vote:room[number].vote,amount:room[number].amount[room[number].round-1],cap:room[number].user[room[number].cap],success:room[number].successAmount,fail:room[number].failAmount,godNumber:room[number].godNumber,godArray:room[number].godArray ,capIndex:room[number].cap,missionArray:room[number].missionArray });
							io.sockets.in(number).emit('console',{console:"隊長正在選擇隊員。"});
							room[number].wait[room[number].cap] = "c" ;
							clients[room[number].id[room[number].cap]].emit("caption",{amount:room[number].amount[room[number].round-1],users:room[number].user}) ;
						}
					}
				}
			}
		});
		socket.on("god",function (data){
			var oldUser = data.oldUser ;
			var newIndex = parseInt(data.newUser) ;
			var number = data.number ;
			if ( room[number] !== undefined ){
				var oldIndex = room[number].godNumber ;
				var newUser = room[number].user[newIndex] ;
				var kind ;
				room[number].wait[room[number].godNumber] = "n" ;
				if ( room[number].c[newIndex] === "好人" || room[number].c[newIndex] === "梅林" || room[number].c[newIndex] === "派西維爾" ){
					kind = "good"
				} else if ( room[number].c[newIndex] === "莫甘娜" || room[number].c[newIndex] === "莫德雷德" || room[number].c[newIndex] === "奧伯倫" || room[number].c[newIndex] === "壞人" || room[number].c[newIndex] === "刺客" ){
					kind = "bad" ;
				}
				clients[room[number].id[oldIndex]].emit("godResult",{kind:kind,index:newIndex}) ;
				room[number].godNumber = newIndex ;
				room[number].godArray.push(newIndex) ;
				io.sockets.in(number).emit('console',{console:room[number].user[oldIndex] + " 查看了 " + room[number].user[newIndex] + " 的陣營。"});
				io.sockets.in(number).emit('console',{console:"隊長替換成 " +room[number].user[room[number].cap]}) ;
				io.sockets.in(number).emit('status', {round:room[number].round,vote:room[number].vote,amount:room[number].amount[room[number].round-1],cap:room[number].user[room[number].cap],success:room[number].successAmount,fail:room[number].failAmount,godNumber:room[number].godNumber,godArray:room[number].godArray,capIndex:room[number].cap ,missionArray:room[number].missionArray });
				io.sockets.in(number).emit('console',{console:"隊長正在選擇隊員。"});
				room[number].wait[room[number].cap] = "c" ;
				clients[room[number].id[room[number].cap]].emit("caption",{amount:room[number].amount[room[number].round-1],users:room[number].user}) ;
			}
		});
		socket.on("ass",function (data){
			var user = data.user ;
			var index = data.index ;
			var number = data.number ;
			if ( room[number] !== undefined ){
				var msg = "刺客選擇刺殺 "+room[number].user[index] ;
				io.sockets.in(number).emit('console',{console:"刺客選擇刺殺 "+msg}) ;
				if ( room[number].c[index] === "梅林" ){
					var m1 = "刺中梅林！壞人獲勝！" ;
					msg += "<br>" + m1 ;
					io.sockets.in(number).emit('console',{console:m1}) ;
				} else {
					var m2 = "刺殺失敗！好人獲勝！" ;
					msg += "<br>" + m2 ;
					io.sockets.in(number).emit('console',{console:m2}) ;
				}
				io.sockets.in(number).emit('gameoverMessage',msg);
				for ( var i = 0 ; i < room[number].c.length ; i ++ ){
					if (room[number].c[i] !== "壞人" || room[number].c[i] !== "刺客" )
						io.sockets.in(number).emit('console',{console:room[number].user[i]+" 身份："+room[number].c[i]}) ;
				}
				while ( room[number].disUser.length > 0 ){
					var index = room[number].id.indexOf(room[number].disUser[0]) ;
					if ( index !== -1 ){
						clients[room[number].id[index]].leave(number);
						var oldUser = room[number].user[index] ;
						room[number].id.splice(index,1) ;
						room[number].user.splice(index,1) ;
						io.sockets.in(number).emit("leave",{status:"success",users:room[number].user,"user":oldUser,number:number});
						if ( oldUser === room[number].create ){
							room[number].create = room[number].user[0] ;
							io.sockets.in(number).emit('console',{console: "室長替換成 "+ room[number].user[0] , notify : true  }) ;
							clients[room[number].id[0]].emit('changeCreater',{});
							resetRole(number);
							showRole(number);
						}
					} 
					room[number].disUser.splice(0,1) ;
				}
				clients[room[number].createId].emit("gameover",msg) ;
			}
		});

		socket.on("recover",function (data){
			var socketId = data.id ;
			if ( clients[socketId] === undefined ){
				socket.emit("recover",{status:"fail"}) ;
			} else {
				var number = Users[socketId].number ;
				if ( room[number] !== undefined ){
					if ( room[number].id.indexOf(socketId) === -1 ){
						socket.emit("recover",{status:"fail"}) ;
					} else {
						var disIndex = room[number].disUser.indexOf(socketId)  ;
						if ( disIndex !== -1 ){
							room[number].disUser.splice(disIndex,1);
						} 
						var user = Users[socketId].user ;
						var index ;
						for ( var i = 0 ; i < room[number].id.length ; i ++ ){
							if ( room[number].id[i] === socketId ){
								room[number].id[i] = socket.id ;
								index = i ;
								break ;
							}
						}
						room[number].disconnect -- ;
						Users[socket.id] = {} ;
						Users[socket.id].user = user ;
						Users[socket.id].number = number ;
						socket.emit("save",{id:socket.id});
						var users = room[number].user ;
						socket.join(number);
						var isStart = false ;
						if ( room[number] !== undefined ){
							isStart = room[number].start ;
						}
						io.sockets.in(number).emit("join",{status:"success",users:users,"user":user,number:number,isStart:isStart});
						showRole(number);
						var bArray = [] ;
						var bArray2 = [] ;
						var mArray = [] ;
						for ( var i = 0 ; i < room[number].c.length ; i ++ ){
							if ( room[number].c[i] === "刺客" || room[number].c[i] === "壞人"  ||  room[number].c[i] === "莫甘娜" ){
								bArray.push(i) ;
								bArray2.push(i) ;
							} else if ( room[number].c[i] === "奧伯倫" ){
								bArray.push(i) ;
							} else if ( room[number].c[i] === "莫德雷德") {
								bArray2.push(i) ;
							}
						}
						for ( var i = 0 ; i < room[number].c.length ; i ++ ){
							if ( room[number].c[i] === "梅林" || room[number].c[i] === "莫甘娜" ){
								mArray.push(i) ;
							}
						}
						if ( room[number].c[index] === "梅林" ) {
							socket.emit("start",{c:room[number].c[index],status:"success",b:bArray,role:room[number].role,index:index,user:room[number].user,voteDoneArray:room[number].voteDoneArray}) ;
						} else if ( room[number].c[index] === "刺客" || room[number].c[index] === "壞人" || room[number].c[index] === "莫甘娜" || room[number].c[index] === "莫德雷德") {
							socket.emit("start",{c:room[number].c[index],status:"success",b:bArray2,role:room[number].role,index:index,user:room[number].user,voteDoneArray:room[number].voteDoneArray}) ;
						} else if ( room[number].c[index] === "派西維爾") {
							socket.emit("start",{c:room[number].c[index],status:"success",m:mArray,role:room[number].role,index:index,user:room[number].user,voteDoneArray:room[number].voteDoneArray}) ;
						} else {
							socket.emit("start",{c:room[number].c[index],status:"success",role:room[number].role,index:index,user:room[number].user,voteDoneArray:room[number].voteDoneArray}) ;
						}
						socket.emit("recover",{user:user,number:number,wait:room[number].wait}) ;
						socket.emit('status', {round:room[number].round,vote:room[number].vote,amount:room[number].amount[room[number].round-1],cap:room[number].user[room[number].cap],success:room[number].successAmount,fail:room[number].failAmount,godNumber:room[number].godNumber,godArray:room[number].godArray,capIndex:room[number].cap,missionArray:room[number].missionArray });
						if ( room[number].wait[index] === "c" ){
							socket.emit("caption",{amount:room[number].amount[room[number].round-1],users:room[number].user}) ;
						} else if (room[number].wait[index] === "v"){
							socket.emit('chooseUser',{users:room[number].mission}) ;	
						} else if (room[number].wait[index] === "m"){
							socket.emit('chooseUser',{users:room[number].mission,vote:"no"}) ;
							socket.emit("mission","mission") ;
						} else if (room[number].wait[index] === "a"){
							var good = [] ;
							var ass ;
							for ( var i = 0 ; i < room[number].c.length ; i ++ ){
								if ( room[number].c[i] === "壞人" || room[number].c[i] === "刺客" || room[number].c[i] === "莫甘娜"  || room[number].c[i] === "莫德雷德" ){
									;
								} else {
									good.push({index:i,user:room[number].user[i]});
								}
							}
							socket.emit("ass",{good:good}) ;
						} else if ( room[number].wait[index] === "g" ){
							var g = [] ;
							for ( var i = 0 ; i < room[number].user.length ; i ++ ){
								for ( var j = 0 ; j < room[number].godArray.length ; j ++ ){
									if ( room[number].godArray[j] === i ){
										break ;
									} else if ( j === room[number].godArray.length - 1 ) {
										g.push(i);
									}
								}
							}
							socket.emit("god",{users:g}) ;
						}
					}
				}
			}
		});
		socket.on("notice",function (data){
			console.log(1);
			var fs = require("fs"),
			    filename = "notice",
			    encode = "utf8";

			fs.readFile(filename, encode, function(err, file) {
				console.log(file);
			  socket.emit("notice",{notice:file});
			});
		});
	});

	var showRole = function(number,oldRole){
		if ( room[number] !== undefined ){
			io.sockets.in(number).emit('role', {role:room[number].role,oldRole:oldRole});
		}
	}

	var getRoomList = function(socket){
		var roomList = [] ;
		for ( var key in room ){
			var p = true ;
			if ( room[key].password === "")
				p = false ;
			roomList.push({number:key,start:room[key].start,password:p,creater:room[key].create,people:room[key].user.length}) ;
		}
		if ( socket !== undefined)
			socket.emit("getRoomList",{roomList:roomList});
		else {
		   	io.sockets.in("roomList").emit("getRoomList",{roomList:roomList});
		}
	}

	var makeRoom = function(creater){
		var maxNum = 2000;  
		var minNum = 6000;  
		var number = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
		while ( room.number !== undefined ){
			number = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
		}
		room[number] = {} ;
		room[number].role = [] ;
		room[number].create = creater ;
		room[number].disconnectCount = 0 ;
		room[number].user = [] ;
		room[number].disUser = [] ;
		room[number].restartVote = 0 ;
		room[number].restartVoteNo = 0 ;
		room[number].id = [] ;
		room[number].c = [] ;
		room[number].cap = 0 ;
		room[number].round = 1 ;
		room[number].vote = 1 ;
		room[number].voteDoneArray = [] ;
		room[number].isFull = false ;
		room[number].isRestart = false ;
		room[number].voteArray = [] ;
		room[number].amount = [] ;
		room[number].missionArray = [];
		room[number].mission = [] ;
		room[number].missionResult = 0 ;
		room[number].missionAmount = 0 ;
		room[number].successAmount = 0 ;
		room[number].failAmount = 0 ;
		room[number].wait = [] ;
		room[number].god = false ;
		room[number].godArray = [] ;
		room[number].godNumber = 0 ;
		room[number].user.push(creater) ;
		room[number].start = false ;
		return number ;
	}
})();
