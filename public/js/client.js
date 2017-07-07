(function(){
	//var url = "http://my-avalon.herokuapp.com" ;
	var url = "http://localhost:8070" ;
	//var io = require('socket.io-client');
	//var url = "http://elefanfan.com:8070" ;
	//var url = "http://elefanfan.com:8060" ;
	var socket = io.connect(url);
	//var socket = io.connect('http://elefanfan.com:8070');
	//var socket = io.connect('http://localhost:8080');
	var gb = null 
	var role = null ;
	//var iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
	var godSet = false ;
	var goodRoleList2 =  ["派西維爾","好人"] ;
	var goodRoleList = ["派西維爾","好人"] ;
	var badRoleList = ["莫甘娜","莫德雷德","奧伯倫","壞人"] ;
	var badRoleList2 = ["莫甘娜","莫德雷德","奧伯倫","壞人"] ;
	var imageList = ["board_5.jpg","board_6.jpg","board_7.jpg","board_8.jpg","board_9.jpg","board_10.jpg","mission_token.png","vote_token.png","fail_token.png","success_token.png","梅林.jpg","好人.jpg","壞人.jpg","刺客.jpg","派西維爾.jpg","莫甘娜.jpg","莫德雷德.jpg","奧伯倫.jpg","yes.jpg","no.jpg","caption.jpg","mission.jpg","god.png","vote_token2.jpg","unknown.jpg","good.jpg","bad.jpg","camp.jpg"] ;
	var canvasMap = {} ;
	var loadImageProgress = 0 ;
	var imgMap = {} ;
	var userAmount = 5 ;
	var roles = [] ;
	var missionArray = [];
	var roleList = [] ;
	var nowRound = 1 ;
	var nowVote = 1 ;
	var isJoining = false ; 
	var isCreating = false ; 
	var missionArray = [] ;
	var uid ;
	var isLogin = false ;
	var userAmount = 5 ;
	var nowVote =  1 ;
	var missionArray = [] ;
	var nowRound = 1 ;

	socket.on("alert",function(data){
		alert("作者："+data);
	})

	socket.on("login", function(data){
		var status = data.status ;
		if ( data.status === "exist" ){
			enterRoomList({
				type : "login" ,
				name : data.name 
			});
		} else if ( data.status === "new" ){	
			resetPage("namePage");
		}
	})

	socket.on("new", function(data){
		if ( data.status === "success" ){
			enterRoomList({
				type : "login" ,
				name : data.name
			});
		} else if ( data.status === "fail" ){	
			alert("暱稱重複！");
		} else if ( data.status === "exist" ){
			alert("帳號已存在。");
		} else if ( data.status === "invalid" ){
			alert("暱稱無效。");
		}
	})

	document.getElementById("nameButton").addEventListener("click",function(){
		var name = document.getElementById("setNameInput").value ; 
		if ( name === "" ){
			alert("請輸入暱稱！") ;
		} else if (  name.length > 6 ){
			alert("最長只能六個字！")
		} else {
			if (stripHTML(name) === true ){
				alert("請輸入合法字元！")
			} else {
				socket.emit("new",{
					id : uid ,
					name : name 
				});
			}
		}
	})

	var login = window.login = function(data){
		uid = data.id ;	
		resetPage("loginingPage");
		socket.emit("login",{
			id : uid 
		});
	}

	var hide = self.hide = function(el){
		if ( !el )
			return ;
		el.style.display = "none" ;
	};

	var show = self.show = function(el){
		if ( !el )
			return ;
		el.style.display = "inline-block" ;
	};

	socket.on("save",function (data){
		localStorage.socketId = data.id ;
	})

	socket.on("recover",function (data){
		if ( data.status === "fail" ){
			alert("回復失敗！") ;
		} else {
			enterRoom(data);
		}
	})

	document.getElementById("recoverButton").addEventListener("click",function(){
		if ( localStorage.socketId !== undefined ){
			socket.emit("recover",{id:localStorage.socketId });
		} else {
			alert("沒有紀錄！") ;
		}
	})
	/*
	document.getElementById("uploadImage").addEventListener("change",function(e){
		e.preventDefault();
		var file = this.files[0],
		reader = new FileReader();
		reader.onload = function (event) {
			var img = new Image();
			img.src = event.target.result;
			userName = '<img height="20px" src="'+img.src+'"></img>' ;
			hide(document.getElementById("loginPage"));
			show(document.getElementById("roomPage"));
		};
		reader.readAsDataURL(file);
		return false;
	});

	document.getElementById("loginImageButton").addEventListener("click",function(){
		if ( document.getElementById("imageInput").value === "" ){
			alert("請輸入網址！") ;
		} else {
			if (stripHTML(document.getElementById("imageInput").value) === true ){
				alert("請輸入合法字元！")
			} else {
				hide(document.getElementById("loginPage"));
				show(document.getElementById("roomPage"));
				getRoomList();
				userName = '<img height="20px" src="'+document.getElementById("imageInput").value+'"></img>' ;
				localStorage.socketId = "" ;
			}
		}
	});
	*/

	var enterRoomList = function(data){

		var type = data.type ;
		var name = data.name ;	
		resetPage("roomPage");
		document.getElementById("consoleArea").innerHTML = "" ;
		document.getElementById("textArea").innerHTML = "" ;
		localStorage.socketId = "" ;
		if ( data.type !== "kick" && data.type !== "leave" && data.type !== "login" ){
			userName = name ;
			setUserName(name);
		} else if ( data.type === "leave" ){
			socket.emit("leave",{});
			getRoomList();
		} 
	}

	socket.on("setUserNameResult",function(data){
		getRoomList();
	});
	
	var updateRoomUserStatus = function(data){
		var create = data.create ;
		var isStart = data.isStart ;
		var index = data.index ;
		var users = data.players ;
		var voteDoneArray = data.voteDoneArray ;
		var number = data.number ,
			name = data.user ,
			bArray = [] ,
			mArray = [] ,
			gArray = [] ;

		setRoomSetting(data);

		document.getElementById("playerDiv").innerHTML = "" ;
		for ( var i = 0 ; i < users.length ; i ++ ){
			var player = document.createElement("div") ;
			player.classList.add("player");
			player.classList.add("w3-card-4");
			var name = document.createElement("div") ;
			name.setAttribute("data-index",i) ;
			name.classList.add("name") ;
			name.classList.add("w3-border");
			name.classList.add("w3-black");

			var indexSpan = document.createElement("span") ;
			var nameSpan = document.createElement("span") ;
			indexSpan.classList.add("w3-yellow");
			indexSpan.style.padding = indexSpan.style.margin = "1px";
			nameSpan.classList.add("nameSpan")
			indexSpan.innerHTML = (i + 1) + ". " ;
			nameSpan.innerHTML = users[i].name ;
			name.appendChild(indexSpan);
			name.appendChild(nameSpan);
			if ( users[i].isLogin === true ){
				var icon = document.createElement("i" ) ;
				icon.classList.add("fa");
				icon.classList.add("fa-facebook-square");
				icon.style.color = "#3b5998" ;
				icon.style.marginLeft = "5px" ;
				name.appendChild(icon);
			}

			player.appendChild(name) ;
			var roleDiv = document.createElement("Div") ;
			if ( create === true && isStart === false ){
				makeKickButton(name);
			}
			if ( isStart ){
				if ( data.index === i ){
					var role = imgMap[data.role+".jpg"].cloneNode(true) ;
					role.classList.add("roleImg2") ;			
					roleDiv.appendChild(role);	
					roleDiv.classList.add("roleDiv");
				} else {
					if ( data.role === "派西維爾" ){
						mArray = data.mArray ;
						if ( mArray.indexOf(i) !== -1 ){		
							var role = imgMap["梅林.jpg"].cloneNode(true) ;
							role.classList.add("roleImg2") ;			
							roleDiv.appendChild(role);	
							roleDiv.classList.add("roleDiv");
						} else {
							var role = imgMap["unknown.jpg"].cloneNode(true) ;
							role.classList.add("roleImg2") ;			
							roleDiv.appendChild(role);	
							roleDiv.classList.add("roleDiv");
						}
					} else {
						var role = imgMap["unknown.jpg"].cloneNode(true) ;
						role.classList.add("roleImg2") ;			
						roleDiv.appendChild(role);	
						roleDiv.classList.add("roleDiv");
					}
				}
				var tokenDiv = document.createElement("Div") ;
				tokenDiv.classList.add("tokenDiv");
				var tokenTopDiv = document.createElement("Div") ;
				tokenTopDiv.classList.add("tokenTopDiv");
				var tokenBottomDiv = document.createElement("Div") ;
				tokenBottomDiv.classList.add("tokenBottomDiv");
				player.appendChild(roleDiv) ;

				var roleGuessDiv = makeRoleGuess(i);
				tokenTopDiv.appendChild(roleGuessDiv) ;
				if ( i === data.index ){
					if ( data.role === "梅林" || data.role === "好人" || data.role === "派西維爾"){
						gb = "g" ;
						var campDiv = document.createElement("div") ;
						var campImg = imgMap["good.jpg"].cloneNode(true) ;
						campDiv.classList.add("campDiv") ;
						campImg.classList.add("campImg") ;
						campDiv.appendChild(campImg) ;
						tokenTopDiv.appendChild(campDiv) ;
					} else {
						gb = "b" ;
						var campDiv = document.createElement("div") ;
						var campImg = imgMap["bad.jpg"].cloneNode(true) ;
						campDiv.classList.add("campDiv") ;
						campImg.classList.add("campImg") ;
						campDiv.appendChild(campImg) ;
						tokenTopDiv.appendChild(campDiv) ;
					}
				} else if (data.role === "梅林" || (getRoleKind(data.role) === "bad" && data.role !== "奧伯倫") ){
					bArray = data.bArray ;
					if ( bArray.indexOf(i) !== -1 ){						
						var campDiv = document.createElement("div") ;
						campDiv.classList.add("campDiv") ;
						var campImg = imgMap["bad.jpg"].cloneNode(true) ;
						campImg.classList.add("campImg") ;
						campDiv.appendChild(campImg) ;
						tokenTopDiv.appendChild(campDiv) ;
					} else {
						var campDiv = document.createElement("div") ;
						campDiv.classList.add("campDiv") ;
						var campImg = imgMap["camp.jpg"].cloneNode(true) ;
						campImg.classList.add("campImg") ;
						campDiv.appendChild(campImg) ;
						tokenTopDiv.appendChild(campDiv) ;
					}
				} else {
					var campDiv = document.createElement("div") ;
					campDiv.classList.add("campDiv") ;
					var campImg = imgMap["camp.jpg"].cloneNode(true) ;
					campImg.classList.add("campImg") ;
					campDiv.appendChild(campImg) ;
					tokenTopDiv.appendChild(campDiv) ;
				}
				var vote_token2Div = document.createElement("div") ;
				vote_token2Div.classList.add("vote_token2Div") ;
				var vote_token2Img = imgMap["vote_token2.jpg"].cloneNode(true) ;
				vote_token2Img.classList.add("vote_token2Img") ;
				if ( voteDoneArray.indexOf(i) === -1 )
					vote_token2Img.style.display = "none" ;
				vote_token2Div.appendChild(vote_token2Img) ;
				tokenTopDiv.appendChild(vote_token2Div) ;

				var captionDiv = document.createElement("div") ;
				captionDiv.classList.add("captionDiv") ;
				var caption = imgMap["caption.jpg"].cloneNode(true) ;
				caption.style.display = "none" ;
				caption.classList.add("captionImg") ;
				captionDiv.appendChild(caption) ;
				tokenBottomDiv.appendChild(captionDiv) ;

				var missionDiv = document.createElement("div") ;
				missionDiv.classList.add("missionDiv") ;
				var mission = imgMap["mission.jpg"].cloneNode(true) ;
				mission.classList.add("mission") ;
				mission.style.display = "none" ;
				missionDiv.appendChild(mission) ;
				tokenBottomDiv.appendChild(missionDiv) ;

				var godDiv = document.createElement("div") ;
				godDiv.classList.add("godDiv") ;
				var god = imgMap["god.png"].cloneNode(true) ;
				god.style.display = "none" ;
				god.classList.add("godImg") ;
				godDiv.appendChild(god) ;
				tokenBottomDiv.appendChild(godDiv) ;

				tokenDiv.appendChild(tokenTopDiv);
				tokenDiv.appendChild(tokenBottomDiv);
				player.appendChild(tokenDiv);
			}
			document.getElementById("playerDiv").appendChild(player) ;
		}
		drawBoard(data);
	}

	var initGameStatus = function(data){
		updateRoomUserStatus(data);
		addConsole("遊戲開始了！");
		setRoleList(data);
		var number = data.number ;
		hide(document.getElementById("startButton"));
		document.getElementById("numberDiv").innerHTML = "房號 ： " + number ;

	}

	var setRoomSetting = function(data){

		var number = data.number ;
		var create = data.create ;

		document.getElementById("numberDiv").innerHTML = "房號 ： " + number ;
		var leaveButton = document.createElement("button") ;
		leaveButton.innerHTML = "離開房間" ;
		leaveButton.className = "w3-btn w3-round w3-red" ;
		leaveButton.id = "leaveButton" ;
		leaveButton.addEventListener("click",function(){
			enterRoomList({
				type : "leave" 
			})
		})

		document.getElementById("numberDiv").appendChild(leaveButton);
		if ( create === true ){
			var button = document.createElement("button") ;
			button.innerHTML = "開始" ;
			button.className = "w3-btn w3-round w3-indigo" ;
			button.id = "startButton" ;
			button.addEventListener("click",function(){
				socket.emit("start",{});
			})
			document.getElementById("numberDiv").appendChild(button);
			var god = document.createElement("button") ;
			god.innerHTML = "湖中女神" ;
			god.className = "w3-btn w3-round w3-indigo" ;
			god.id = "godButton" ;
			god.addEventListener("click",function(){
				socket.emit("godSet",{});
			})
			document.getElementById("numberDiv").appendChild(god);
		}

		document.getElementById("restartArea").innerHTML = "" ;

	}

	var enterRoom = function(data){
		var number = data.number ;	
		resetPage("gamePage");
		updateRoomUserStatus(data);
	}

	document.getElementById("loginButton").addEventListener("click",function(){
		if ( document.getElementById("nameInput").value === "" ){
			alert("請輸入暱稱！") ;
		} else if (  document.getElementById("nameInput").value.length > 6 ){
			alert("最長只能六個字！")
		} else {
			if (stripHTML(document.getElementById("nameInput").value) === true ){
				alert("請輸入合法字元！")
			} else {

				enterRoomList({
					type : "enter" ,
					name : document.getElementById("nameInput").value 
				});
			}
		}
	});
	document.getElementById("roomPlayingDisplayBox").onclick = function(){
		getRoomList();
	}
	var getRoomList = function(){
		socket.emit("getRoomList",{ } );
	}
	var setUserName = function(name){
		socket.emit("setUserName",{ name : name } );
	}
	socket.on("enterRoomList",function (data){
		resetPage("roomPage");
	});
	socket.on("getRoomList",function (data){
		document.getElementById("roomDisplayDiv").innerHTML = "" ;
		var roomList = data.roomList ;
		for ( var i = 0 ; i < roomList.length ; i ++ ){
			if ( document.getElementById("roomPlayingDisplayBox").checked === true ){
				if ( roomList[i].start )
					continue ;
			}
			var div = document.createElement("div") ;
			div.style.padding = "5px" ;
			div.style.border = "1px solid black" ;
			div.style.borderRadius = "5px" ;
			var number = document.createElement("span") ;
			var name = document.createElement("div") ;
			name.innerHTML = "室長：" + roomList[i].creater ;
			var people = document.createElement("div") ;
			people.innerHTML = "人數："+roomList[i].people + "/10";
			number.innerHTML = "房號："+roomList[i].number ;
			div.appendChild(name);
			div.appendChild(number);
			if ( !roomList[i].start ){
				var button = document.createElement("button") ;
				button.innerHTML = "進入" ;
				button.style.float = "right" ;
				div.appendChild(button);
				var password = document.createElement("input") ;
				password.id = "password" + roomList[i].number ;
				if ( roomList[i].password === true  ){
					password.style.float = "right" ;
					password.placeholder = "請輸入密碼" ;
					div.appendChild(password);
				}
				button.setAttribute("data-number",roomList[i].number);
				button.onclick = function(){
					if ( isJoining === false ){
						isJoining = true ;
						var passwordText = "" ;
						if ( document.getElementById("password"+this.getAttribute("data-number")) !== null ){
							passwordText = document.getElementById("password"+this.getAttribute("data-number")).value ;
						} 
						socket.emit("join",{number:parseInt(this.getAttribute("data-number")),password:passwordText}) ;
					}
				}

			}			
			if ( roomList[i].isLogin ){
				var loginSpan = document.createElement("span") ;
				loginSpan.innerHTML = "限定登入" ;
				loginSpan.style.float = "right" ;
				loginSpan.style.paddingRight = "10px" ;
				div.appendChild(loginSpan);
			}
			div.appendChild(people);
			document.getElementById("roomDisplayDiv").appendChild(div);
		}
	})
	socket.on("getUserList",function (data){
		document.getElementById("userListDiv").innerHTML = "" ;
		var userList = data.userList ;
		for ( var i = 0 ; i < userList.length ; i ++ ){
			var name = userList[i].name ;
			var number = userList[i].number ; 
			var state = userList[i].state ;
			var isLogin = userList[i].isLogin ; 
			if ( state === "disconnect" ){
				continue ;
			}
			var div = document.createElement("div") ;
			div.style.padding = "5px" ;
			div.style.border = "1px solid black" ;
			div.style.borderRadius = "5px" ;

			var nameSpan = document.createElement("span") ;
			nameSpan.innerHTML = name ;
			div.appendChild(nameSpan);
			var stateSpan = document.createElement("span") ;
			stateSpan.style.float = "right" ;
			if ( state === "play" ){
				stateSpan.innerHTML = "遊戲中" ;
			} else if ( state === "lobby" ){
				stateSpan.innerHTML = "遊戲大廳" ;
			} else if ( state === "room" ){
				stateSpan.innerHTML = "房間等待" ;
			} 
			div.appendChild(stateSpan);
			var numberSpan = document.createElement("span") ;
			numberSpan.innerHTML = number || "" ;
			numberSpan.style.float = "right" ;
			numberSpan.style.marginRight = "10px" ;
			div.appendChild(numberSpan);
			if ( isLogin === true ){
				var icon = document.createElement("i" ) ;
				icon.classList.add("fa");
				icon.classList.add("fa-facebook-square");
				icon.style.color = "#3b5998" ;
				icon.style.marginLeft = "5px" ;
				div.appendChild(icon);
			}
			document.getElementById("userListDiv").appendChild(div);
		}
	})
	socket.on("kick",function(data){
		enterRoomList({
			type : "kick"
		})
	})
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


	document.getElementById("createButton").addEventListener("click",function(){
		if ( isCreating === false ){
			isCreating = true ;
			createRoom();
		}
	});

	window.onbeforeunload = function() {
		//socket.emit("leave",{user:userName,number:roomNumber});
	};

	/*
	document.getElementById("joinButton").addEventListener("click",function(){
		if ( isJoining === false ){
			isJoining = true ;
			roomNumber = document.getElementById("roomInput").value ;
			socket.emit("join",{user:userName,number:roomNumber,password:document.getElementById("passwordJoin").value}) ;
		}
	});
	*/

	socket.on("godResult",function (data){
		notificationUser("女神結果出來了！");
		document.getElementById("godArea").innerHTML = "" ;
		var kind = data.kind ;
		var index = data.index ;
		document.querySelectorAll(".campDiv")[index].innerHTML = "" ;
		var campImg ;		
		if ( kind === "good" ){
			campImg = imgMap["good.jpg"].cloneNode(true) ;
		} else if ( kind === "bad" ){
			campImg = imgMap["bad.jpg"].cloneNode(true) ;
		}
		campImg.classList.add("campImg") ;
		document.querySelectorAll(".campDiv")[index].appendChild(campImg) ;
	})
	socket.on("changeCreater",function (data){
		notificationUser("室長更換！");
	})
	socket.on("resetRole",function (data){
		badRoleList = badRoleList2.slice(0) ;
		goodRoleList = goodRoleList2.slice(0) ;
		setRoleList(data);
	})
	socket.on("setRoomSetting",function (data){
		setRoomSetting(data);
	});
	socket.on("join",function (data){
		if ( data.status === "fail" ){
			alert("加入失敗！");
		} else {
			enterRoom(data);
		}
		isJoining = false ;
		isCreating = false ;
	});

	var makeKickButton = function(name){
		var kick = document.createElement("i") ;
		kick.classList.add("fa");
		kick.classList.add("fa-close");
		kick.classList.add("w3-text-red");
		kick.classList.add("w3-right");
		kick.classList.add("w3-padding-tiny");
		name.appendChild(kick);
		kick.addEventListener("click",function(){
			var index = name.getAttribute("data-index");
			socket.emit('kick', { index : index });
		})
	}
	socket.on("godSet",function(data){
		if ( data.status === "fail" ){
			alert("需要七人以上才能使用湖中女神。") ;
		} else {
			godSet = data.godSet ;
		}
	})
	
	socket.on("leave", function (data){
		updateRoomUserStatus(data);
	});

	var createRoom = function(){
		socket.emit('create', { password : document.getElementById("passwordCreate").value , isLogin : document.getElementById("isLimitLogin").checked });
		socket.on('create', function (data) {
			if ( data.status === "success" ){
				
			} 
		}); 
	}
	socket.on("restart", function (data){
		enterRoom(data);
	})
	socket.on("gameoverMessage" ,function (data){
		notificationUser( "遊戲結束！");
		document.getElementById("noticeArea").innerHTML = data ;
	});
	socket.on("restartResult" ,function (data){
		if ( data.status === "success" ){
			document.getElementById("restartArea").innerHTML = "" ;
			document.getElementById("eventArea").innerHTML = '<div id="chooseUserArea" class="w3-container"></div>' +
			'<div id="chooseVoteArea" class="w3-container"></div>' +
			'<div id="missionArea" class="w3-container"></div>' +
			'<div id="godArea" class="w3-container"></div>' + 
			'<div id="noticeArea" class="w3-container"></div>' +
			'<div id="assArea" class="w3-container"></div>' +
			'<div id="restartArea" class="w3-container"></div>' ;
			var create = data.create ;
			if ( create === true ){
				socket.emit("restart",{}) ;
			}
		} else {	
			document.getElementById("restartArea").innerHTML = "贊成未過半，重啟失敗！" ;
		}
	});
	socket.on("gameover" ,function (data){
		document.getElementById("noticeArea").innerHTML = data ;
		var create = data.create ;
		socket.emit("restart",{}) ;
	});
	var setRoleList = function(data){
		document.getElementById("roleDiv").innerHTML = "" ;
		var create = data.create ;
		if ( create === true ){
			var oldRole = data.oldRole ;
			if ( oldRole !== undefined ){
				if ( getRoleKind(oldRole) === "good" ){
					if ( goodRoleList.indexOf(oldRole) === -1 )
						goodRoleList.push(oldRole);
				} else if (getRoleKind(oldRole) === "bad" ) {
					if ( badRoleList.indexOf(oldRole) === -1 )
						badRoleList.push(oldRole);
				}
			}
		}
		if ( typeof data.role === 'string') return ;
		for ( var i = 0 ; i < data.role.length ; i ++ ){
			var div = document.createElement("li") ;
			if ( data.role[i] === "好人" || data.role[i] === "梅林" || data.role[i] === "派西維爾") {
				div.className = "w3-blue" ;
			} else {
				div.className = "w3-red" ;
			}
			var roleDiv = document.createElement("div") ;
			roleDiv.style.display = "inline-block" ;
			roleDiv.setAttribute("data-role",data.role[i]);
			var img = imgMap[data.role[i]+".jpg"].cloneNode(true) ;
			img.className = "roleImg" ;
			roleDiv.appendChild(img);
			if ( create === true ){

				roleDiv.classList.add("w3-dropdown-hover");
				var roleContentDiv = document.createElement("div") ;
				roleContentDiv.style.maxWidth = "240px" ;
				roleContentDiv.style.width = "45vw" ;
				roleContentDiv.style.backgroundColor = "transparent" ;
				roleContentDiv.classList.add("w3-dropdown-content");
				if ( getRoleKind(data.role[i]) === "good" && data.role[i] !== "梅林" ){
					for ( var j = 0 ; j < goodRoleList.length ; j ++ ){
						if ( goodRoleList[j] !==  data.role[i]) {
							var role = setRole("good",j,roleDiv) ;
							roleContentDiv.appendChild(role) ;
						}
					}
				} else if ( getRoleKind(data.role[i]) === "bad" && data.role[i] !== "刺客" ){
					for ( var j = 0 ; j < badRoleList.length ; j ++ ){
						if ( badRoleList[j] !== data.role[i] ){
							var role = setRole("bad",j,roleDiv) ;
							if ( data.role.length === 5 ){ 
								roleContentDiv.style.right = "0" ;
							} else if ( data.role.length === 6 ){
								;
							} else if ( data.role.length === 7 ){
								;
							} else if ( data.role.length === 8 ){
								;
							} else if ( data.role.length === 9 ){
								if ( i === 8 ){
									roleContentDiv.style.right = "0" ;
								}
							} else if ( data.role.length === 10 ){
								if ( i === 8 || i === 9 ){
									roleContentDiv.style.right = "0" ;
								} 
							}
							roleContentDiv.appendChild(role) ;
						}
					}
				}
				roleDiv.appendChild(roleContentDiv);
			}
			document.getElementById("roleDiv").appendChild(roleDiv);
		}
	}
	socket.on("role",function (data){
		setRoleList(data);
	})

	var setRole = function(kind,index,roleDiv){
		var role ;
		if ( kind === "good" ){
			role = imgMap[goodRoleList[index]+".jpg"].cloneNode(true) ;
		} else {
			role = imgMap[badRoleList[index]+".jpg"].cloneNode(true) ;
		}
		role.classList.add("roleContentImg") ;
		if ( kind === "good" ){
			role.addEventListener("click",function(){
				socket.emit("role",{
					oldRole : roleDiv.getAttribute("data-role") ,
					newRole : goodRoleList[index] 
				})
				goodRoleList.splice(index,1);
			})
		} else if ( kind === "bad" ){
			role.addEventListener("click",function(){
				socket.emit("role",{
					oldRole : roleDiv.getAttribute("data-role") ,
					newRole : badRoleList[index] 
				})
				badRoleList.splice(index,1);
			})
		}
		

		return role ;
	}

	var getRoleKind = function(src){
		if ( src === "好人" || src === "梅林" || src === "派西維爾" ){
			return "good" ;
		} else if ( src === "莫甘娜" || src === "莫德雷德" || src === "奧伯倫" || src === "壞人" || src === "刺客" ){
			return "bad" ;
		}
	};

	socket.on('message', function (data) {
		var index = data.index ;
		var text = document.createElement("div") ;
		notificationUser(index + ". " + data.user + " : " + data.text);
		text.innerHTML = index + ". " + data.user + " : " + data.text ;
		document.getElementById("textArea").appendChild(text);
		document.getElementById("textArea").scrollTop = document.getElementById("textArea").scrollHeight;
	}); 
	socket.on('messageFail', function (data) {
		if ( data.status === 1 ){
			alert("請輸入合法字元！") ;
		}
	}); 
	document.getElementById("textInput").addEventListener("keypress",function(e){
		if(e.keyCode === 13){ 
			document.getElementById("textButton").click();
		}
	})
	document.getElementById("textButton").addEventListener("click",function(){
		if (stripHTML(document.getElementById("textInput").value) === true) {
			alert("請輸入合法字元！") ;
		} else {
			socket.emit('message',{text:document.getElementById("textInput").value}) ;
			document.getElementById("textInput").value = "" ;
		}
	});

 	var makeRoleGuess = function(i){
		var roleGuessDiv = document.createElement("div") ;
		roleGuessDiv.classList.add("roleGuessDiv") ;
		var roleGuessImg = imgMap["unknown.jpg"].cloneNode(true) ;
		roleGuessImg.classList.add("roleGuessImg") ;
		roleGuessDiv.appendChild(roleGuessImg) ;

		roleGuessDiv.classList.add("w3-dropdown-hover");
		var roleGuessContentDiv = document.createElement("div") ;
		roleGuessContentDiv.style.maxWidth = "240px" ;
		roleGuessContentDiv.style.width = "45vw" ;
		roleGuessContentDiv.style.backgroundColor = "transparent" ;
		roleGuessContentDiv.classList.add("w3-dropdown-content");
		var roleGuessImg1 = imgMap["unknown.jpg"].cloneNode(true) ;
		roleGuessContentDiv.appendChild(roleGuessImg1);
		var roleGuessImg2 = imgMap["梅林.jpg"].cloneNode(true) ;
		roleGuessContentDiv.appendChild(roleGuessImg2);
		var roleGuessImg3 = imgMap["派西維爾.jpg"].cloneNode(true) ;
		roleGuessContentDiv.appendChild(roleGuessImg3);
		var roleGuessImg4 = imgMap["好人.jpg"].cloneNode(true) ;
		roleGuessContentDiv.appendChild(roleGuessImg4);
		var roleGuessImg5 = imgMap["刺客.jpg"].cloneNode(true) ;
		roleGuessContentDiv.appendChild(roleGuessImg5);
		var roleGuessImg6 = imgMap["莫甘娜.jpg"].cloneNode(true) ;
		roleGuessContentDiv.appendChild(roleGuessImg6);
		var roleGuessImg7 = imgMap["莫德雷德.jpg"].cloneNode(true) ;
		roleGuessContentDiv.appendChild(roleGuessImg7);
		var roleGuessImg8 = imgMap["奧伯倫.jpg"].cloneNode(true) ;
		roleGuessContentDiv.appendChild(roleGuessImg8);
		var roleGuessImg9 = imgMap["壞人.jpg"].cloneNode(true) ;
		roleGuessContentDiv.appendChild(roleGuessImg9);
		roleGuessImg1.onclick = roleGuessImg2.onclick = roleGuessImg3.onclick = roleGuessImg4.onclick = roleGuessImg5.onclick = roleGuessImg6.onclick = roleGuessImg7.onclick = roleGuessImg8.onclick = roleGuessImg9.onclick = function(){
			roleGuessImg.src = this.src ;
		}
		roleGuessContentDiv.style.maxWidth = "170px" ;
		if ( i % 2 === 1 ){
			roleGuessContentDiv.style.right = 0 ;
		}
		roleGuessImg1.className = roleGuessImg2.className = roleGuessImg3.className = roleGuessImg4.className = roleGuessImg5.className = roleGuessImg6.className = roleGuessImg7.className = roleGuessImg8.className = roleGuessImg9.className = "roleGuessOption" ;
		roleGuessDiv.appendChild(roleGuessContentDiv);
		return roleGuessDiv;
 	}

	var startGame = function(data){
		if ( data.status === "success" ){
			initGameStatus(data);
		}
	}
	socket.on("start", function (data){
		notificationUser("遊戲開始了！");
		startGame(data);
	})
	socket.on("captain",function (data){
		notificationUser("輪到你當隊長了！");
		var users = data.players ;
		var amount = data.amount ;
		document.getElementById("chooseUserArea").innerHTML = "" ;
		document.getElementById("chooseVoteArea").innerHTML = "" ;
		var d = [] ;
		for ( var i = 0 ; i < users.length ; i ++ ){
			d.push({"value": i , "text" : users[i].name }) ;
		} 
	    var selector = window.multiselect.render({
	        elementId: "chooseVoteArea",
	        data: d
	    });

		var button = document.createElement("button") ;
		button.className = "w3-btn w3-round" ;
		button.innerHTML = "送出" ;
	    button.addEventListener("click", function() {
	    	if ( selector.getSelectedIndexes().length !== amount ) {
				alert("人數不符！") ;
			} else {
				socket.emit("captain",{players:selector.getSelectedIndexes()}) ;
				button.parentNode.removeChild(button);
			}
	    });
	    document.getElementById("eventArea").appendChild(button);
	});
	socket.on("console",function (data){
		var isNotify = data.notify ;
		if ( data.notify === true ){
			notificationUser(data.console);
		}
		addConsole(data.console);
	});
	socket.on("god",function (data){
		notificationUser("輪到你使用女神！");
		var users = data.users ;
		document.getElementById("godArea").innerHTML = "" ;
		var select = document.createElement("select")  ;
		select.size = users.length ;
		for ( var i = 0 ; i < users.length ; i ++ ){
			var option = document.createElement("option") ;
			option.innerHTML = document.querySelectorAll(".nameSpan")[users[i]].innerHTML  ;
			option.value = users[i] ;
			select.appendChild(option) ; 
		} 
		document.getElementById("godArea").appendChild(select) ;
		var button = document.createElement("button") ;
		button.innerHTML = "查看" ;
		button.className = "w3-button w3-round" ;
		document.getElementById("godArea").appendChild(button);

		button.addEventListener("click",function(){
			var index = select.options[select.selectedIndex].value ;
			socket.emit("god",{newUser:index});
		})
	});
	socket.on("mission",function (data){
		notificationUser("輪到你出任務了！");
		document.getElementById("missionArea").innerHTML = "" ;
		var y = document.createElement("button") ;
		y.innerHTML = "成功" ;
		y.className = "w3-button w3-round" ;
		document.getElementById("missionArea").appendChild(y) ;
		y.addEventListener("click",function(){
			socket.emit("mission",{choose:"y"}) ;
			document.getElementById("missionArea").innerHTML = "" ;
		});
		if ( gb === "b" ){
			var n = document.createElement("button") ;
			n.innerHTML = "失敗" ;
			n.className = "w3-button w3-round" ;
			document.getElementById("missionArea").appendChild(n) ;
			n.addEventListener("click",function(){
				socket.emit("mission",{choose:"n"}) ;
				document.getElementById("missionArea").innerHTML = "" ;
			})
		} 
	});
	socket.on("voted",function (data){
		var index = data.index ;
		document.querySelectorAll(".vote_token2Div")[index].innerHTML = "" ; 
		var vote_token2Img = imgMap["vote_token2.jpg"].cloneNode(true) ;
		vote_token2Img.classList.add("vote_token2Img");
		document.querySelectorAll(".vote_token2Div")[index].appendChild(vote_token2Img) ;
	});
	socket.on("chooseUser",function (data){
		notificationUser("輪到你投票！");
		var users = data.players ;
		var missionDivs = document.querySelectorAll(".mission-div");
		for ( var i = 0 ; i < missionDivs.length ; i ++ ){
			if ( users.indexOf(i) !== -1 ){
				missionDivs[i].className = "mission-div fa fa-users fa-x" ;
			}
		}

		for ( var i = 0 ; i < document.querySelectorAll(".missionDiv").length ; i ++ ){
			document.querySelectorAll(".missionDiv")[i].querySelector("img").style.display = "none" ;
		}
		for ( var i = 0 ; i < document.querySelectorAll(".player").length ; i ++  ){
			document.querySelectorAll(".player")[i].classList.remove("w3-yellow") ;
		}
		for ( var i = 0 ; i < users.length ; i ++ ){
			document.querySelectorAll(".player")[users[i].index].classList.add("w3-yellow") ;
			document.querySelectorAll(".missionDiv")[users[i].index].querySelector("img").style.display = "" ;
		}
		document.getElementById("chooseUserArea").innerHTML = "" ;
		document.getElementById("chooseVoteArea").innerHTML = "" ;
		if ( data.nowVote === undefined ){
			var y = document.createElement("button") ;
			y.innerHTML = "贊成" ; 
			var n = document.createElement("button") ;
			n.innerHTML = "反對" ;
			y.className = n.className = "w3-button w3-round" ;
			document.getElementById("chooseVoteArea").appendChild(y);
			document.getElementById("chooseVoteArea").appendChild(n);
			y.addEventListener("click",function(){
				socket.emit("vote",{choose:"success"}) ;
				document.getElementById("chooseVoteArea").innerHTML = "" ;
			});
			n.addEventListener("click",function(){
				socket.emit("vote",{choose:"fail"}) ;
				document.getElementById("chooseVoteArea").innerHTML = "" ;
			});
		}
	});
	socket.on("voteResult",function (data){
		notificationUser("投票結果出來了！");
		var votes = data.votes ; 
		for ( var i = 0 ; i < document.querySelectorAll(".vote_token2Div").length ; i ++ ){
			document.querySelectorAll(".vote_token2Div")[i].innerHTML = "" ;
			var vote_token2Img ;
			if ( votes[i].vote === "success" ){
				vote_token2Img = imgMap["yes.jpg"].cloneNode(true) ;
			} else if ( votes[i].vote === "fail" ){
				vote_token2Img = imgMap["no.jpg"].cloneNode(true) ;
			}
			vote_token2Img.classList.add("vote_token2Img") ;
			document.querySelectorAll(".vote_token2Div")[i].appendChild(vote_token2Img);
		}
	});
	socket.on("status",function (data){
		var missionArray = data.missionArray ;
		var round = data.round ;
		var nowRound = round ;
		var amount = data.amount ;
		var cap = data.cap ;
		var vote = data.nowVote ;
		var success = data.success ;
		var fail = data.fail ;
		var nowVote = vote ;

		for ( var i = 0 ; i < document.querySelectorAll(".godDiv").length ; i ++ ){
			document.querySelectorAll(".godDiv")[i].querySelector("img").style.display = "none" ;
		}
		document.querySelectorAll(".godImg")[data.nowGod.index].style.display = "" ;

		if ( parseInt(round) === 4 && document.querySelectorAll(".player").length >= 7 ){
			document.getElementById("noticeArea").innerHTML = "本回合需要兩個失敗才會任務失敗！" ;
		} else {
			document.getElementById("noticeArea").innerHTML = "" ;
		}
		if ( parseInt(vote) === 5){
			document.getElementById("noticeArea").innerHTML += "<br>注意！這是最後一輪投票！" ;
		}
		
		for ( var i = 0 ; i < document.querySelectorAll(".captionDiv").length ; i ++ ){
			document.querySelectorAll(".captionDiv")[i].querySelector("img").style.display = "none" ;
		}

		document.querySelectorAll(".captionDiv")[data.nowCaptain.index].querySelector("img").style.display = "" ;
		drawBoard(data);
		
	});
	socket.on("ass",function (data){
		notificationUser("選擇暗殺對象！");
		var good = data.good ;
		document.getElementById("assArea").innerHTML = "" ;
		var select = document.createElement("select")  ;
		select.size = good.length ;
		for ( var i = 0 ; i < good.length ; i ++ ){
			var option = document.createElement("option") ;
			option.innerHTML = good[i].user ;
			option.value = good[i].index ;
			select.appendChild(option) ; 
		} 
		document.getElementById("assArea").appendChild(select) ;
		var button = document.createElement("button") ;
		button.innerHTML = "刺殺" ;
		document.getElementById("assArea").appendChild(button);

		button.addEventListener("click",function(){
			var index = select.options[select.selectedIndex].value ;
			socket.emit("ass",{index:index});
			document.getElementById("assArea").innerHTML = "" ;
		})
	});
	var addConsole = function(text){
		var div = document.createElement("div") ;
		div.innerHTML = text ;
		document.getElementById("consoleArea").appendChild(div) ;
		document.getElementById("consoleArea").scrollTop = document.getElementById("consoleArea").scrollHeight;
	}
	document.getElementById("restartButton").addEventListener("click",function(){
		socket.emit("restartRequest",{});
	})
	socket.on("restartRequest",function (data){
		var status = data.status ;
		var user = data.user ; 
		if ( status === "success" ){
			document.getElementById("restartArea").innerHTML = user + "發起重新遊戲的投票，是否要回到房間？" ;
			var yesButton = document.createElement("button") ;
			yesButton.innerHTML = "贊成" ;
			yesButton.addEventListener("click",function(){
				socket.emit("restartVote",{ result : true });
				document.getElementById("restartArea").innerHTML = "" ;
			})
			document.getElementById("restartArea").appendChild(yesButton) ;
			var noButton = document.createElement("button") ;
			noButton.innerHTML = "反對" ;
			noButton.addEventListener("click",function(){
				socket.emit("restartVote",{result : false });
				document.getElementById("restartArea").innerHTML = "" ;
			})
			document.getElementById("restartArea").appendChild(noButton) ;
		} else {
			alert("要求重啟失敗！") ;
		}
	})

	socket.on('disconnect', function() {
		resetPage("closePage");
	});

	//document.addEventListener('visibilitychange', visibleChangeHandler, false);
	var notification = window.Notification || window.mozNotification || window.webkitNotification;
	if ( notification !== undefined ){ 
		notification.requestPermission(function(permission){});
	}

	var originalTitle = '', messageCount = 0;
	function notificationUser(message)
	{
		if ( notification !== undefined ){
		    if (document['hidden']) {
		        Notify(message)
		    }
		}
	}

	function Notify(message)
	{
	    if (undefined === typeof notification)
	        return false;       //Not supported....
	    var noty = new notification(
	        "Avalon", {
	            body: message,
	            dir: 'auto', // or ltr, rtl
	            lang: 'EN', //lang used within the notification.
	            tag: 'notificationPopup', //An element ID to get/set the content
	            icon: '' //The URL of an image to be used as an icon
	        }
	    );
	    return true;
	}

	SlEEPBAG.canvasAutoResizer.load(function(self){
		self.canvasWidth = 480;
		self.canvasHeight = 310;
	    var canvas = document.createElement("canvas");
	    var gameArea = self.getGameArea();
	    document.body.appendChild(gameArea);
	    self.appendGameElement(canvas);
	});

	var resizer = SlEEPBAG.canvasAutoResizer;
	var boardCanvas = resizer.getGameElement();
	var boardCtx = boardCanvas.getContext("2d");
	document.getElementById("boardDiv").appendChild(boardCanvas);
	var resoultion = resizer.getResolution();
	resizer.setCenter();
	var makeCache  = function(index,img){
		img.onload = function(){
			var canvas = document.createElement('canvas');
			var ctx = canvas.getContext('2d');
			canvas.width = img.width ;
			canvas.height = img.height ;
			ctx.drawImage(img,0,0,img.width,img.height) ;
			canvasMap[imageList[index]] = canvas ;
			loadImageProgress ++ ;
		}
	}

	for ( var i = 0 ; i < imageList.length ; i ++ ){
		var img = new Image();
		img.src = "image/" + imageList[i] ;
		imgMap[imageList[i]] = img ;
		makeCache(i,img) ;
	}

	window.addEventListener("resize",function(){
		drawBoard();
	})

	var drawBoard = function(data){
		if ( data !== undefined ){ 
			userAmount = data.userAmount || 5 ;
			nowVote = data.nowVote || 1 ;
			missionArray = data.missionArray || [] ;
			nowRound = data.around || 1 ;
		}
		var b = 5 ;
		if ( userAmount >= 5 ){
			b = userAmount ;
		}
		boardCtx.drawImage(canvasMap["board_"+b+".jpg"],0,0);
		boardCtx.drawImage(canvasMap["vote_token.png"],(77*(nowVote-1))+8,238);
		for ( var i = 0 ; i < missionArray.length ; i ++ ){
			if (missionArray[i] === false )
				boardCtx.drawImage(canvasMap["fail_token.png"],(93*(i))+8,98);
			else {
				boardCtx.drawImage(canvasMap["success_token.png"],(93*(i))+8,98);
			}
		}
		boardCtx.drawImage(canvasMap["mission_token.png"],(92*(nowRound-1))+63,155);
	}

	var getNotice = function(){
		socket.emit("notice",{});
	}

	socket.on("notice",function (data){
		document.getElementById("noticeDiv").innerHTML = "<br>作者公告：<br>" + data.notice ;
	})
	getNotice();


	var resetPage = function(page){
		for ( var i = 0 ; i < document.querySelectorAll(".page").length ; i ++ ){
			document.querySelectorAll(".page")[i].style.display = "none" ;
		}
		document.getElementById(page).style.display = "" ;
	}

	resetPage("loginPage");

	//document.getElementById("emailButton").addEventListener("click",function(){
	//	resetPage("emailPage")
	//})

	document.getElementById("emailSendButton").addEventListener("click",function(){
		socket.emit("email",{
			title : document.getElementById("emailTitleInput").value ,
			content : document.getElementById("emailContentInput").value ,
			name : document.getElementById("emailNameInput").value ,
			email : document.getElementById("emailEmailInput").value 
		})
		this.style.display = "none" ;
	})

	socket.on("email", function (data){
		var status = data.status ;
		if ( status === "success" ){
			alert("傳送成功") ;
			resetPage("loginPage"); 
		} else {
			alert("傳送失敗");
			document.getElementById("emailSendButton").style.display = "" ;
		}
	})

	socket.on("ip",function(){
		resetPage("ipPage") ;
	})

	socket.on("logout",function(){
		window.location.reload();
	})

	document.getElementById("ipButton").addEventListener("click",function(){
		socket.emit("logout",{}) ;
	})

})();

