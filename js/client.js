(function(){
	//var socket = io.connect('http://avalon-test.herokuapp.com/');
	// var socket = io.connect('http://my-avalon.herokuapp.com/');
	var socket = io.connect('localhost:8080');
	var gb = null 
	var roomNumber = null ;
	var role = null ;
	var userName = null ;
	//var iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
	var create = false ;
	var creater = false ;
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
	var gArray = [] ;
	var bArray = [] ;
	var mArray = [] ;
	var roleList = [] ;
	var nowRound = 1 ;
	var nowVote = 1 ;
	var isJoining = false ; 
	var isCreating = false ; 
	var missionArray = [] ;

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
			hide(document.getElementById("loginPage"));
			hide(document.getElementById("roomPage"));
			var number = data.number ;
			var user = data.user ;
			userName = user ;
			roomNumber = number ;
			document.getElementById("numberDiv").innerHTML = "房號 ： " + roomNumber ;
		}
	})

	document.getElementById("recoverButton").addEventListener("click",function(){
		if ( localStorage.socketId !== undefined ){
			socket.emit("recover",{id:localStorage.socketId });
		} else {
			alert("有紀錄！") ;
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
	*/

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

	document.getElementById("loginButton").addEventListener("click",function(){
		if ( document.getElementById("nameInput").value === "" ){
			alert("請輸入暱稱！") ;
		} else if (  document.getElementById("nameInput").value.length > 6 ){
			alert("最長只能六個字！")
		} else {
			if (stripHTML(document.getElementById("nameInput").value) === true ){
				alert("請輸入合法字元！")
			} else {
				hide(document.getElementById("loginPage"));
				show(document.getElementById("roomPage"));
				getRoomList();
				userName = document.getElementById("nameInput").value ;
				localStorage.socketId = "" ;
			}
		}
	});
	document.getElementById("roomPlayingDisplayBox").onclick = function(){
		getRoomList();
	}
	var getRoomList = function(){
		socket.emit("getRoomList",{});
	}
	socket.on("getRoomList", function(data) {
		const roomDisplayDiv = document.getElementById("roomDisplayDiv");
		roomDisplayDiv.innerHTML = "";
		const roomList = data.roomList;
		
		roomList.forEach(room => {
			if (document.getElementById("roomPlayingDisplayBox").checked && room.start) {
				return;
			}

			const roomItem = document.createElement("div");
			roomItem.className = "room-item" + (room.start ? " room-in-progress" : "");

			// Add click handler for the entire room
			if (!room.start) {
				roomItem.onclick = function(e) {
					// Only trigger if clicking on the room item itself or the join button
					if (e.target.classList.contains('room-password') || 
						e.target.closest('.room-password')) {
						return;
					}
					
					handleRoomJoin(room.number);
				};
			}

			const roomInfo = document.createElement("div");
			roomInfo.className = "room-info";
			
			const statusIcon = room.start ? 
				'<i class="fa fa-play-circle status-icon playing"></i>' : 
				'<i class="fa fa-pause-circle status-icon waiting"></i>';

			roomInfo.innerHTML = `
				<div class="room-status">${statusIcon}</div>
				<div class="room-details">
					<div class="room-leader">
						<i class="fa fa-user"></i>
						<span>室長：${room.creater}</span>
					</div>
					<div class="room-number">
						<i class="fa fa-hashtag"></i>
						<span>房號：${room.number}</span>
					</div>
					<div class="room-players">
						<i class="fa fa-users"></i>
						<span>人數：${room.people}/10</span>
					</div>
				</div>
			`;

			roomItem.appendChild(roomInfo);

			if (!room.start) {
				const roomActions = document.createElement("div");
				roomActions.className = "room-actions";

				if (room.password) {
					const passwordInput = document.createElement("input");
					passwordInput.type = "password";
					passwordInput.id = "password" + room.number;
					passwordInput.placeholder = "請輸入密碼";
					passwordInput.className = "room-password";
					passwordInput.autocomplete = "off";
					
					passwordInput.addEventListener('click', (e) => {
						e.stopPropagation();
					});
					
					passwordInput.addEventListener('focus', (e) => {
						e.currentTarget.parentElement.parentElement.style.transform = 'none';
					});
					
					passwordInput.addEventListener('blur', (e) => {
						e.currentTarget.parentElement.parentElement.style.transform = '';
					});
					
					roomActions.appendChild(passwordInput);
				}

				const joinButton = document.createElement("button");
				joinButton.innerHTML = '<i class="fa fa-sign-in"></i> 進入';
				joinButton.className = "header-btn btn-join";
				joinButton.onclick = function(e) {
					e.stopPropagation(); // Prevent room click
					handleRoomJoin(room.number);
				};
				roomActions.appendChild(joinButton);
				roomItem.appendChild(roomActions);
			}

			roomDisplayDiv.appendChild(roomItem);
		});
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


	document.getElementById("createButton").addEventListener("click", function() {
		if (isCreating === false) {
			isCreating = true;
			createRoom();
		}
	});

	document.getElementById("joinButton").addEventListener("click", function(e) {
		e.preventDefault();
		e.stopPropagation();
		if (!isJoining) {
			isJoining = true;
			const roomNumber = document.getElementById("roomInput").value;
			const password = document.getElementById("passwordJoin").value;
			
			if (roomNumber === "") {
				alert("請輸入房號！");
				isJoining = false;
			} else {
				socket.emit("join", {
					user: userName,
					number: parseInt(roomNumber),
					password: password
				});
			}
		}
	});

	window.onbeforeunload = function() {
		socket.emit("leave",{user:userName,number:roomNumber});
	};

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
		create = true ;
		creater = true ;
	})
	socket.on("resetRole",function (data){
		badRoleList = badRoleList2.slice(0) ;
		goodRoleList = goodRoleList2.slice(0) ;
		setRoleList(data);
	})
	socket.on("join",function (data){
		if ( data.status === "fail" ){
			alert("加入失敗！");
		} else {
			var users = data.users ;
			userAmount = users.length ;
			var number = data.number ;
			roomNumber = number ;
			socket.emit("resetRole",{number:number}) ;
			document.getElementById("numberDiv").innerHTML = "房號 ： " + roomNumber ;
			var leaveButton = document.createElement("button") ;
			leaveButton.innerHTML = "離開房間" ;
			leaveButton.className = "header-btn btn-danger" ;
			leaveButton.id = "leaveButton" ;
			leaveButton.addEventListener("click",function(){
				socket.emit("leave",{user:userName,number:roomNumber});
				show(document.getElementById("roomPage"));
				hide(document.getElementById("gamePage"));
				document.getElementById("consoleArea").innerHTML = "" ;
				document.getElementById("textArea").innerHTML = "" ;
				localStorage.socketId = "" ;
			})
			document.getElementById("numberDiv").appendChild(leaveButton);
			if ( create === true ){
				var button = document.createElement("button") ;
				button.innerHTML = "開始" ;
				button.className = "header-btn btn-success" ;
				button.id = "startButton" ;
				button.addEventListener("click",function(){
					socket.emit("start",{user:userName,number:roomNumber});
				})
				document.getElementById("numberDiv").appendChild(button);
				var god = document.createElement("button") ;
				god.innerHTML = "湖中女神" ;
				god.className = "header-btn btn-primary" ;
				god.id = "godButton" ;
				god.addEventListener("click",function(){
					if ( users.length < 7 ){
						alert("需要七人以上才能使用湖中女神。") ;
					} else {
						if ( godSet === true ){
							godSet = false ;
						} else {
							godSet = true ;
						}
						socket.emit("godSet",{godSet:godSet,number:roomNumber});
					}
				})
				document.getElementById("numberDiv").appendChild(god);
			}
			hide(document.getElementById("roomPage"));
			show(document.getElementById("gamePage"));
			var user = data.user ;
			var d = document.createElement("div") ;
			d.innerHTML = user +" 加入房間" ;
			d.className = "console-message";
			notificationUser(user +" 加入房間");
			document.getElementById("consoleArea").appendChild(d) ;

			if ( data.isStart === false || document.getElementById("playerDiv").innerHTML === "" ){
				document.getElementById("playerDiv").innerHTML = "" ;
				for ( var i = 0 ; i < users.length ; i ++ ){
					var u = document.createElement("div") ;
					u.className = "player-card";
					var name = document.createElement("div") ;
					name.className = "player-name";
					name.innerHTML = users[i] ;
					u.appendChild(name) ;
					document.getElementById("playerDiv").appendChild(u) ;
				}
			}
			drawBoard();
		}
		isJoining = false ;
		isCreating = false ;
	});

	socket.on("leave", function(data) {
		var users = data.users;
		var user = data.user;
		userAmount = users.length;
		notificationUser(user + "離開房間了！");
		
		var d = document.createElement("div");
		d.innerHTML = user + " 離開房間";
		d.className = "console-message";
		document.getElementById("consoleArea").appendChild(d);
		
		document.getElementById("playerDiv").innerHTML = "";
		for (var i = 0; i < users.length; i++) {
			var u = document.createElement("div");
			u.className = "player-card";
			
			var name = document.createElement("div");
			name.className = "player-name";
			name.innerHTML = users[i];
			u.appendChild(name);
			
			document.getElementById("playerDiv").appendChild(u);
		}
		drawBoard();
	});

	var createRoom = function(){
		socket.emit('create', { user : userName , password : document.getElementById("passwordCreate").value });
		socket.on('create', function (data) {
			if ( data.status === "success" ){
				notificationUser("房間創建完成！");
				create = true ;
				creater = true ;
				roomNumber = data.number ;
				document.getElementById("numberDiv").innerHTML = "房號 ： " + roomNumber ;
				hide(document.getElementById("roomPage"));
				show(document.getElementById("gamePage"));

				socket.emit("role",{ role : "梅林" , number : roomNumber } );
				socket.emit("role",{ role : "好人" , number : roomNumber } );
				socket.emit("role",{ role : "好人" , number : roomNumber });
				socket.emit("role",{ role : "刺客" , number : roomNumber });
				socket.emit("role",{ role : "壞人" , number : roomNumber });
				drawBoard();
				isCreating = false ;
			} 
		}); 
	}
	socket.on("restart", function (data){
		document.getElementById("restartArea").innerHTML = "";
		if (creater === true) {
			create = true;
		}
		
		var users = data.users;
		var number = data.number;
		roomNumber = number;
		socket.emit("resetRole", {number: number});
		
		// Update room number with new format
		updateRoomNumber(roomNumber);

		const headerRight = document.querySelector('.header-right');
		headerRight.innerHTML = ''; // Clear existing buttons
		
		if (create === true) {
			// Start button
			const startButton = createHeaderButton(
				"startButton",
				"fa-play",
				"開始",
				"btn-indigo",
				"開始遊戲",
				function() {
					socket.emit("start", {user: userName, number: roomNumber});
				}
			);
			headerRight.appendChild(startButton);

			// God mode button
			const godButton = createHeaderButton(
				"godButton",
				"fa-crown",
				"湖中女神",
				"btn-indigo",
				"切換湖中女神模式",
				function() {
					if (users.length < 7) {
						alert("需要七人以上才能使用湖中女神。");
					} else {
						godSet = !godSet;
						godButton.classList.toggle('active');
						socket.emit("godSet", {godSet: godSet, number: roomNumber});
					}
				}
			);
			headerRight.appendChild(godButton);
		}

		// Leave button
		const leaveButton = createHeaderButton(
			"leaveButton",
			"fa-sign-out-alt",
			"離開房間",
			"btn-red",
			"離開當前房間",
			function() {
				socket.emit("leave", {user: userName, number: roomNumber});
				show(document.getElementById("roomPage"));
				hide(document.getElementById("gamePage"));
				document.getElementById("consoleArea").innerHTML = "";
				document.getElementById("textArea").innerHTML = "";
				localStorage.socketId = "";
			}
		);
		headerRight.appendChild(leaveButton);

		hide(document.getElementById("roomPage"));
		show(document.getElementById("gamePage"));
	});
	socket.on("gameoverMessage" ,function (data){
		notificationUser( "遊戲結束");
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
			socket.emit("restart",{number:roomNumber}) ;
		} else {	
			document.getElementById("restartArea").innerHTML = "贊成未過半，重啟失敗！" ;
		}
	});
	socket.on("gameover" ,function (data){
		document.getElementById("noticeArea").innerHTML = data ;
		if ( creater === true ){
			socket.emit("restart",{number:roomNumber}) ;
		}
		/*
		if ( creater === true ){
			var restart = document.createElement("button") ;
			restart.className = "w3-button w3-round" ;
			restart.innerHTML = "重新開始" ;
			restart.addEventListener("click",function(){
				socket.emit("restart",{number:roomNumber}) ;
			})
			document.getElementById("restartArea").appendChild(restart) ;
		}
		*/
	});
	var setRoleList = function(data){
		document.getElementById("roleDiv").innerHTML = "" ;
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
				let availableOptions = [];
				
				if (getRoleKind(data.role[i]) === "good" && data.role[i] !== "梅林") {
					availableOptions = goodRoleList.filter(role => role !== data.role[i]);
				} else if (getRoleKind(data.role[i]) === "bad" && data.role[i] !== "刺客") {
					availableOptions = badRoleList.filter(role => role !== data.role[i]);
				}

				if (availableOptions.length > 0) {
					roleDiv.className = "w3-dropdown-hover roleDiv";
					var roleContentDiv = document.createElement("div");
					roleContentDiv.className = "w3-dropdown-content w3-bar-block w3-border";
					roleContentDiv.style.backgroundColor = "#fff";
					roleContentDiv.style.zIndex = "10000";
					roleContentDiv.style.whiteSpace = "nowrap";
					roleContentDiv.style.textAlign = "center";

					availableOptions.forEach(role => {
						var roleElement = setRole(getRoleKind(data.role[i]), 
									   getRoleKind(data.role[i]) === "good" ? 
									   goodRoleList.indexOf(role) : 
									   badRoleList.indexOf(role), 
									   roleDiv);
						var container = document.createElement("div");
						container.className = "w3-bar-item";
						container.style.display = "inline-block";
						container.appendChild(roleElement);
						roleContentDiv.appendChild(container);
					});

					roleDiv.appendChild(roleContentDiv);
				}
			}
			document.getElementById("roleDiv").appendChild(roleDiv);
		}
		drawBoard();
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
					newRole : goodRoleList[index] ,
					number : roomNumber 
				})
				goodRoleList.splice(index,1);
			})
		} else if ( kind === "bad" ){
			role.addEventListener("click",function(){
				socket.emit("role",{
					oldRole : roleDiv.getAttribute("data-role") ,
					newRole : badRoleList[index] ,
					number : roomNumber 
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
		const messageDiv = document.createElement('div');
		messageDiv.classList.add('chat-message');
		
		const timestamp = new Date().toLocaleTimeString();
		
		messageDiv.innerHTML = `
			<span class="username">${data.user}</span>
			<span class="message">${data.text}</span>
			<span class="timestamp">${timestamp}</span>
		`;
		
		const textArea = document.getElementById('textArea');
		textArea.appendChild(messageDiv);
		textArea.scrollTop = textArea.scrollHeight;
		
		// Keep existing notification
		notificationUser(`${data.user} : ${data.text}`);
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
			socket.emit('message',{number:roomNumber,text:document.getElementById("textInput").value,user:userName}) ;
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
		var roleGuessImg7 = imgMap["莫德雷.jpg"].cloneNode(true) ;
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
			bArray = [] ;
			mArray = [] ;
			gArray = [] ;
			var user = data.user ;
			var voteDoneArray = data.voteDoneArray ;
			document.getElementById("numberDiv").innerHTML = "房號 ： " + roomNumber ;
			hide(document.getElementById("roomPage"));
			show(document.getElementById("gamePage"));
			document.getElementById("playerDiv").innerHTML = "" ;
			for ( var i = 0 ; i < user.length ; i ++ ){
				var player = document.createElement("div") ;
				player.classList.add("player");
				player.classList.add("w3-card-4");
				var name = document.createElement("div") ;
				name.classList.add("name") ;
				name.classList.add("w3-border");
				name.classList.add("w3-black");
				name.innerHTML = user[i] ;
				player.appendChild(name) ;
				var roleDiv = document.createElement("Div") ;
				player.querySelector(".name").innerHTML = user[i] ;

				if ( data.index === i ){
					var role = imgMap[data.c+".jpg"].cloneNode(true) ;
					role.classList.add("roleImg2") ;			
					roleDiv.appendChild(role);	
					roleDiv.classList.add("roleDiv");
				} else {
					if ( data.c === "派西維爾" ){
						mArray = data.m ;
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
					if ( data.c=== "梅林" || data.c === "好" || data.c=== "派西維爾"){
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
				} else if (data.c === "梅林" || (getRoleKind(data.c) === "bad" && data.c !== "奧伯倫") ){
					bArray = data.b ;
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
				document.getElementById("playerDiv").appendChild(player);
			}
			addConsole("遊戲開始了！");
			hide(document.getElementById("startButton"));
			create = false ;
			setRoleList(data);

		}
	}
	socket.on("start", function (data){
		notificationUser("遊戲開始了！");
		startGame(data);
	})
	socket.on("caption",function (data){
		notificationUser("輪到你當隊長了！");
		var users = data.users ;
		var amount = data.amount ;
		document.getElementById("chooseUserArea").innerHTML = "" ;
		document.getElementById("chooseVoteArea").innerHTML = "" ;
		var d = [] ;
		for ( var i = 0 ; i < users.length ; i ++ ){
			d.push({"value": i,"text":users[i]}) ;
		} 
	    var selector = window.multiselect.render({
	        elementId: "chooseVoteArea",
	        data: d
	    });

		var button = document.createElement("button") ;
		button.className = "header-btn btn-success" ;
		button.innerHTML = "送出" ;
	    button.addEventListener("click", function() {
	    	if ( selector.getSelectedIndexes().length !== amount ) {
				alert("人數不符！") ;
			} else {
				socket.emit("caption",{users:selector.getSelectedIndexes(),number:roomNumber}) ;
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
			option.innerHTML = document.querySelectorAll(".player")[users[i]].querySelector(".name").innerHTML  ;
			option.value = users[i] ;
			select.appendChild(option) ; 
		} 
		document.getElementById("godArea").appendChild(select) ;
		var button = document.createElement("button") ;
		button.innerHTML = "查看" ;
		button.className = "header-btn btn-primary" ;
		document.getElementById("godArea").appendChild(button);

		button.addEventListener("click",function(){
			var index = select.options[select.selectedIndex].value ;
			socket.emit("god",{oldUser:userName,newUser:index,number:roomNumber});
		})
	});
	socket.on("mission",function (data){
		notificationUser("輪到你出任務了！");
		document.getElementById("missionArea").innerHTML = "" ;
		var y = document.createElement("button") ;
		y.innerHTML = "成功" ;
		y.className = "header-btn btn-primary" ;
		document.getElementById("missionArea").appendChild(y) ;
		y.addEventListener("click",function(){
			socket.emit("mission",{choose:"y",number:roomNumber,user:userName}) ;
			document.getElementById("missionArea").innerHTML = "" ;
		});
		if ( gb === "b" ){
			var n = document.createElement("button") ;
			n.innerHTML = "失敗" ;
			n.className = "header-btn btn-danger" ;
			document.getElementById("missionArea").appendChild(n) ;
			n.addEventListener("click",function(){
				socket.emit("mission",{choose:"n",number:roomNumber,user:userName}) ;
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
		var users = data.users ;
		missionArray = users;			
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
			document.querySelectorAll(".player")[users[i]].classList.add("w3-yellow") ;
			document.querySelectorAll(".missionDiv")[users[i]].querySelector("img").style.display = "" ;
		}
		document.getElementById("chooseUserArea").innerHTML = "" ;
		document.getElementById("chooseVoteArea").innerHTML = "" ;
		/*
		var p = document.createElement("i") ;
		p.className = "fa fa-male w3-xxxlarge" ;
		document.getElementById("chooseUserArea").appendChild(p) ;
		document.getElementById("chooseVoteArea").innerHTML = "" ;
		for ( var i = 0 ; i < users.length ; i ++ ){
			var span = document.createElement("span") ;
			span.className = "w3-xxxlarge w3-tag w3-purple w3-round" ;
			span.innerHTML = document.getElementById("userArea").childNodes[0].childNodes[users[i]].innerHTML ;
			document.getElementById("chooseUserArea").appendChild(span);
		}
		*/
		if ( data.vote === undefined ){
			var y = document.createElement("button") ;
			y.innerHTML = "贊成" ; 
			var n = document.createElement("button") ;
			n.innerHTML = "反對" ;
			y.className = n.className = "header-btn btn-success" ;
			document.getElementById("chooseVoteArea").appendChild(y);
			document.getElementById("chooseVoteArea").appendChild(n);
			y.addEventListener("click",function(){
				socket.emit("vote",{number:roomNumber,choose:"y",user:userName}) ;
				document.getElementById("chooseVoteArea").innerHTML = "" ;
			});
			n.addEventListener("click",function(){
				socket.emit("vote",{number:roomNumber,choose:"n",user:userName}) ;
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
			if ( votes[i] === "y" ){
				vote_token2Img = imgMap["yes.jpg"].cloneNode(true) ;
			} else if ( votes[i] === "n" ){
				vote_token2Img = imgMap["no.jpg"].cloneNode(true) ;
			}
			vote_token2Img.classList.add("vote_token2Img") ;
			document.querySelectorAll(".vote_token2Div")[i].appendChild(vote_token2Img);
		}
		var voteDivs = document.querySelectorAll(".vote-div");
		for ( var i = 0 ; i < voteDivs.length ; i ++ ){
			if ( votes[i] === "y" ){
				voteDivs[i].className = "vote-div fa fa-circle-o" ;
			} else if ( votes[i] === "n" ){
				voteDivs[i].className = "vote-div fa fa-close" ;
			}
		}
	});
	socket.on("rearrange",function (data){

	});
	socket.on("status",function (data){
		missionArray = data.missionArray ;
		var round = data.round ;
		nowRound = round ;
		var amount = data.amount ;
		var cap = data.cap ;
		var vote = data.vote ;
		var success = data.success ;
		var fail = data.fail ;
		var godArray = data.godArray ;
		nowVote = vote ;

		for ( var i = 0 ; i < document.querySelectorAll(".godDiv").length ; i ++ ){
			document.querySelectorAll(".godDiv")[i].querySelector("img").style.display = "none" ;
		}

		document.querySelectorAll(".godDiv")[godArray[godArray.length-1]].querySelector("img").style.display = "" ;

		if ( parseInt(round) === 4 && document.querySelectorAll(".player").length >= 7 ){
			document.getElementById("noticeArea").innerHTML = "本回合需要兩個失敗才會任務失敗！" ;
		} else {
			document.getElementById("noticeArea").innerHTML = "" ;
		}
		if ( parseInt(vote) === 5){
			document.getElementById("noticeArea").innerHTML += "<br>注意！這是最後一輪投票" ;
		}
		
		for ( var i = 0 ; i < document.querySelectorAll(".captionDiv").length ; i ++ ){
			document.querySelectorAll(".captionDiv")[i].querySelector("img").style.display = "none" ;
		}

		document.querySelectorAll(".captionDiv")[data.capIndex].querySelector("img").style.display = "" ;
		drawBoard();
		
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
		button.innerHTML = "殺";
		button.className = "header-btn btn-danger" ;
		document.getElementById("assArea").appendChild(button);

		button.addEventListener("click",function(){
			var index = select.options[select.selectedIndex].value ;
			socket.emit("ass",{index:index,number:roomNumber,user:userName});
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
		socket.emit("restartRequest",{number:roomNumber , user:userName});
	})
	socket.on("restartRequest",function (data){
		var status = data.status ;
		var user = data.user ; 
		if ( status === "success" ){
			document.getElementById("restartArea").innerHTML = user + "發起重新遊戲的投票，是否要回到房間？" ;
			var yesButton = document.createElement("button") ;
			yesButton.innerHTML = "贊成" ;
			yesButton.addEventListener("click",function(){
				socket.emit("restartVote",{number:roomNumber , user:userName , result : true });
				document.getElementById("restartArea").innerHTML = "" ;
			})
			document.getElementById("restartArea").appendChild(yesButton) ;
			var noButton = document.createElement("button") ;
			noButton.innerHTML = "反對" ;
			noButton.addEventListener("click",function(){
				socket.emit("restartVote",{number:roomNumber , user:userName , result : false });
				document.getElementById("restartArea").innerHTML = "" ;
			})
			document.getElementById("restartArea").appendChild(noButton) ;
		} else {
			alert("要求重啟失敗！") ;
		}
	})


	hide(document.getElementById("roomPage"));
	hide(document.getElementById("gamePage"));

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
			if ( loadImageProgress === imageList.length ){
				drawBoard();
			}
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

	var drawBoard = function(){
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

	// var getNotice = function(){
	// 	socket.emit("notice",{});
	// }

	// socket.on("notice",function (data){
	// 	document.getElementById("noticeDiv").innerHTML = "<br>作者公告：<br>" + data.notice ;
	// })
	// getNotice();

	// Add this function definition
	function handleRoomJoin(roomNumber) {
		if (!isJoining) {
			isJoining = true;
			const passwordInput = document.getElementById("password" + roomNumber);
			const passwordText = passwordInput ? passwordInput.value : "";
			socket.emit("join", {
				user: userName,
				number: parseInt(roomNumber),
				password: passwordText
			});
		}
	}

	// Update room number display function
	function updateRoomNumber(number) {
		const numberDiv = document.getElementById('numberDiv');
		numberDiv.className = 'room-info';
		numberDiv.innerHTML = `
			<div class="room-status-wrapper">
				<div class="room-basic-info">
					<span class="room-label">房間</span>
					<span class="room-id">#${String(number).padStart(4, '0')}</span>
				</div>
				<div class="room-status">
					<span class="status-dot"></span>
					<span class="status-text">進行中</span>
				</div>
			</div>
		`;
	}

	// Helper function to create standardized buttons
	function createHeaderButton(id, icon, text, className, tooltip, clickHandler) {
		const button = document.createElement("button");
		button.innerHTML = `<i class="fa ${icon}"></i><span>${text}</span>`;
		button.className = `header-btn ${className} no-outline`;
		button.id = id;
		button.setAttribute('tabindex', '-1');
		if (tooltip) {
			button.setAttribute('data-tooltip', tooltip);
		}
		button.addEventListener("click", clickHandler);
		return button;
	}

	// Add these functions to handle chat messages
	function addChatMessage(username, message, isSystem = false) {
		const messageDiv = document.createElement('div');
		messageDiv.classList.add('chat-message');
		if (isSystem) messageDiv.classList.add('system');
		
		const timestamp = new Date().toLocaleTimeString();
		
		messageDiv.innerHTML = `
			${!isSystem ? `<span class="username">${username}</span>` : ''}
			<span class="message">${message}</span>
			<span class="timestamp">${timestamp}</span>
		`;
		
		const chatMessages = document.getElementById('textArea');
		chatMessages.appendChild(messageDiv);
		chatMessages.scrollTop = chatMessages.scrollHeight;
	}

	// Update the existing chat input handling
	document.getElementById('textInput').addEventListener('keypress', function(e) {
		if (e.key === 'Enter') {
			sendMessage();
		}
	});

	document.getElementById('textButton').addEventListener('click', sendMessage);

	function sendMessage() {
		const input = document.getElementById('textInput');
		const message = input.value.trim();
		
		if (message) {
			// Assuming you have a socket connection and username
			socket.emit('chat message', {
				username: currentUsername,
				message: message
			});
			
			input.value = '';
		}
	}

	// Handle incoming messages
	socket.on('chat message', function(data) {
		addChatMessage(data.username, data.message);
	});

	// Handle system messages
	socket.on('system message', function(message) {
		addChatMessage(null, message, true);
	});
})();