(function(){
	var socket = io.connect('http://my-avalon.herokuapp.com/');
	//var socket = io.connect('localhost:8080');
	var gb = null 
	var roomNumber = null ;
	var role = null ;
	var userName = null ;
	var create = false ;
	var creater = false ;
	var godSet = false ;
	var goodRoleList2 =  ["派西維爾","好人"] ;
	var goodRoleList = ["派西維爾","好人"] ;
	var badRoleList = ["莫甘娜","莫德雷德","奧伯倫","壞人"] ;
	var badRoleList2 = ["莫甘娜","莫德雷德","奧伯倫","壞人"] ;
	var roles = [] ;
	var gArray = [] ;
	var bArray = [] ;
	var mArray = [] ;
	var isJoining = false ; 
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
			}
		}
	});

	document.getElementById("loginButton").addEventListener("click",function(){
		if ( document.getElementById("nameInput").value === "" ){
			alert("請輸入暱稱！") ;
		} else {
			if (stripHTML(document.getElementById("nameInput").value) === true ){
				alert("請輸入合法字元！")
			} else {
				hide(document.getElementById("loginPage"));
				show(document.getElementById("roomPage"));
				getRoomList();
				userName = document.getElementById("nameInput").value ;
			}
		}
	});
	document.getElementById("roomPlayingDisplayBox").onclick = function(){
		getRoomList();
	}
	var getRoomList = function(){
		socket.emit("getRoomList",{});
	}
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
			var number = document.createElement("span") ;
			number.innerHTML = roomList[i].number ;
			div.appendChild(number);
			if ( !roomList[i].start ){
				var button = document.createElement("button") ;
				button.innerHTML = "進入" ;
				button.style.float = "right" ;
				div.appendChild(button);
				var password = document.createElement("input") ;
				if ( roomList[i].password === true  ){
					password.style.float = "right" ;
					password.placehoder = "請輸入密碼" ;
					div.appendChild(password);
				}
				button.setAttribute("data-number",roomList[i].number);
				button.onclick = function(){
					if ( isJoining === false ){
						isJoining = true ;
						socket.emit("join",{user:userName,number:parseInt(this.getAttribute("data-number")),password:password.value}) ;
					}
				}

			}
			document.getElementById("roomDisplayDiv").appendChild(div);
		}
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
		createRoom();
	});

	window.onbeforeunload = function() {
		socket.emit("leave",{user:userName,number:roomNumber});
	};

	document.getElementById("joinButton").addEventListener("click",function(){
		if ( isJoining === false ){
			isJoining = true ;
			roomNumber = document.getElementById("roomInput").value ;
			socket.emit("join",{user:userName,number:roomNumber,password:document.getElementById("passwordJoin").value}) ;
		}
	});
	socket.on("godResult",function (data){
		notificationUser("女神結果出來了！");
		document.getElementById("godArea").innerHTML = "" ;
		var kind = data.kind ;
		var index = data.index ;
		var result = document.createElement("span");
		if ( kind === "good" ){
			result.className = "w3-tag w3-blue w3-round" ;
		} else if ( kind === "bad" ){
			result.className = "w3-tag w3-red w3-round" ;
		}
		result.innerHTML = document.getElementById("userArea").childNodes[0].childNodes[index].innerHTML ;
		document.getElementById("godResultArea").innerHTML = ""   ;
		document.getElementById("godResultArea").appendChild(result);
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
			var number = data.number ;
			roomNumber = number ;
			socket.emit("resetRole",{number:number}) ;
			document.getElementById("numberDiv").innerHTML = "房號 ： " + roomNumber ;
			if ( create === true ){
				var button = document.createElement("button") ;
				button.innerHTML = "開始" ;
				button.className = "w3-btn w3-round w3-indigo" ;
				button.id = "startButton" ;
				button.addEventListener("click",function(){
					socket.emit("start",{user:userName,number:roomNumber});
				})
				document.getElementById("numberDiv").appendChild(button);
				var god = document.createElement("button") ;
				god.innerHTML = "湖中女神" ;
				god.className = "w3-btn w3-round w3-indigo" ;
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
			document.getElementById("userArea").innerHTML = "" ;
			var user = data.user ;
			var d = document.createElement("div") ;
			d.innerHTML = user +" 加入房間" ;
			notificationUser(user +" 加入房間");
			document.getElementById("consoleArea").appendChild(d) ;

			var ul = document.createElement("ul") ;
			ul.className = "w3-ul w3-card-4" ;
			for ( var i = 0 ; i < users.length ; i ++ ){
				var u = document.createElement("li") ;
				u.innerHTML = users[i] ;
				ul.appendChild(u) ;
			}
			document.getElementById("userArea").appendChild(ul);

		}
		isJoining = false ;
	});

	socket.on("leave", function (data){
		var users = data.users ;
		var user = data.user ;
		notificationUser(user + "離開房間了！");
		var d = document.createElement("div") ;
		d.innerHTML = user +" 離開房間" ;
		document.getElementById("consoleArea").appendChild(d) ;

		document.getElementById("userArea").innerHTML = "" ;
		var ul = document.createElement("ul") ;
		ul.className = "w3-ul w3-card-4" ;
		for ( var i = 0 ; i < users.length ; i ++ ){
			var u = document.createElement("li") ;
			u.innerHTML = users[i] ;
			ul.appendChild(u) ;
		}
		document.getElementById("userArea").appendChild(ul);
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

			} 
		}); 
	}
	socket.on("restart", function (data){
		document.getElementById("bArea").innerHTML = "" ;
		document.getElementById("gameInfoArea").innerHTML = "" ;
		document.getElementById("restartArea").innerHTML = "" ;
		if ( creater === true ){
			create = true ;
		}
		var users = data.users ;
		var number = data.number ;
		roomNumber = number ;
		socket.emit("resetRole",{number:number}) ;
		document.getElementById("numberDiv").innerHTML = "房號 ： " + roomNumber ;
		if ( create === true ){
			var button = document.createElement("button") ;
			button.innerHTML = "開始" ;
			button.className = "w3-btn w3-round w3-indigo" ;
			button.id = "startButton" ;
			button.addEventListener("click",function(){
				socket.emit("start",{user:userName,number:roomNumber});
			})
			document.getElementById("numberDiv").appendChild(button);
			var god = document.createElement("button") ;
			god.innerHTML = "湖中女神" ;
			god.className = "w3-btn w3-round w3-indigo" ;
			god.id = "godButton" ;
			god.addEventListener("click",function(){
				if ( godSet === true ){
					godSet = false ;
				} else {
					godSet = true ;
				}
				socket.emit("godSet",{godSet:godSet,number:roomNumber});
			})
			document.getElementById("numberDiv").appendChild(god);
		}
		hide(document.getElementById("roomPage"));
		show(document.getElementById("gamePage"));
		document.getElementById("userArea").innerHTML = "" ;

		var ul = document.createElement("ul") ;
		ul.className = "w3-ul w3-card-4" ;
		for ( var i = 0 ; i < users.length ; i ++ ){
			var u = document.createElement("li") ;
			u.innerHTML = users[i] ;
			ul.appendChild(u) ;
		}
		document.getElementById("userArea").appendChild(ul);
	})
	socket.on("gameoverMessage" ,function (data){
		notificationUser( "遊戲結束！");
		document.getElementById("noticeArea").innerHTML = data ;
	});
	socket.on("gameover" ,function (data){
		document.getElementById("noticeArea").innerHTML = data ;
		if ( creater === true ){
			var restart = document.createElement("button") ;
			restart.className = "w3-button w3-round" ;
			restart.innerHTML = "重新開始" ;
			restart.addEventListener("click",function(){
				socket.emit("restart",{number:roomNumber}) ;
			})
			document.getElementById("restartArea").appendChild(restart) ;
		}
	});
	var setRoleList = function(data){
		document.getElementById("roleArea").innerHTML = "" ;
		var ul = document.createElement("ul") ;
		ul.className = "w3-ul w3-card-4 roleList" ;
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
			var h = document.createElement("h5") ;
			h.innerHTML = data.role[i] ;
			div.appendChild(h);
			
			if ( create === true ){
				div.className += "" ;
				var roles = document.createElement("ul") ;
				roles.className = "w3-ul" ;
				if ( getRoleKind(data.role[i]) === "good" && data.role[i] !== "梅林" ){
					for ( var j = 0 ; j < goodRoleList.length ; j ++ ){
						if ( goodRoleList[j] !==  data.role[i]) {
							var role = setRole("good",j,h) ;
							roles.appendChild(role) ;
						}
					}
				} else if ( getRoleKind(data.role[i]) === "bad" && data.role[i] !== "刺客" ){
					for ( var j = 0 ; j < badRoleList.length ; j ++ ){
						if ( badRoleList[j] !== data.role[i] ){
							var role = setRole("bad",j,h) ;
							roles.appendChild(role) ;
						}
					}
				}
				div.appendChild(roles);
			}
			
			ul.appendChild(div);
		}
		document.getElementById("roleArea").appendChild(ul);
	}
	socket.on("role",function (data){
		setRoleList(data);
	})

	var setRole = function(kind,index,li){
		var role = document.createElement("li") ;
		if ( kind === "good" ){
			role.style.backgroundColor = "#330066" ;
			role.innerHTML = goodRoleList[index] ;
			role.addEventListener("click",function(){
				socket.emit("role",{
					oldRole : li.innerHTML ,
					newRole : goodRoleList[index] ,
					number : roomNumber 
				})
				goodRoleList.splice(index,1);
			})
		} else if ( kind === "bad" ){
			role.style.backgroundColor = "#990000" ;
			role.innerHTML = badRoleList[index] ;
			role.addEventListener("click",function(){
				socket.emit("role",{
					oldRole : li.innerHTML ,
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
		var text = document.createElement("div") ;
		notificationUser(data.user + " : " + data.text);
		text.innerHTML = data.user + " : " + data.text ;
		document.getElementById("textArea").appendChild(text);
		document.getElementById("textArea").scrollTop = document.getElementById("textArea").scrollHeight;
	}); 
	document.getElementById("textInput").addEventListener("keypress",function(e){
		if(e.keyCode === 13){ 
			document.getElementById("textButton").click();
		}
	})
	document.getElementById("textButton").addEventListener("click",function(){
		if (stripHTML(document.getElementById("textInput").value) === "true") {
			alert("請輸入合法字元！") ;
		} else {
			socket.emit('message',{number:roomNumber,text:document.getElementById("textInput").value,user:userName}) ;
			document.getElementById("textInput").value = "" ;
		}
	});

	var startGame = function(data){
		if ( data.status === "success" ){
			bArray = [] ;
			mArray = [] ;
			gArray = [] ;
			document.getElementById("numberDiv").innerHTML = "房號 ： " + roomNumber ;
			hide(document.getElementById("roomPage"));
			show(document.getElementById("gamePage"));

			var span = document.createElement("span") ;
			span.innerHTML = data.c ;
			document.getElementById("cArea").innerHTML = "你的角色是：" ;
			if ( data.c=== "梅林" || data.c === "好人" || data.c=== "派西維爾"){
				span.className = "w3-tag w3-blue w3-round" ;
				gb = "g" ;
			} else {
				span.className = "w3-tag w3-red w3-round" ;
				gb = "b" ;
			}
			document.getElementById("cArea").appendChild(span);
			if (data.c === "梅林" || (getRoleKind(data.c) === "bad" && data.c !== "奧伯倫") ){
				document.getElementById("bArea").innerHTML = "壞人是："  ;
				bArray = data.b ;
				for ( var i = 0 ; i < data.b.length ; i ++ ){				
					var span = document.createElement("span") ;
					span.className = "w3-tag w3-round-large w3-red" ;
					span.innerHTML = document.getElementById("userArea").childNodes[0].childNodes[data.b[i]].innerHTML ;
					document.getElementById("bArea").appendChild(span) ;
				}
			} else if ( data.c === "派西維爾" ){
				mArray = data.m ;
				document.getElementById("bArea").innerHTML = "梅林是："  ;
				for ( var i = 0 ; i < data.m.length ; i ++ ){				
					var span = document.createElement("span") ;
					span.className = "w3-tag w3-round-large w3-blue" ;
					span.innerHTML = document.getElementById("userArea").childNodes[0].childNodes[data.m[i]].innerHTML ;
					document.getElementById("bArea").appendChild(span) ;
				}
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
		button.className = "w3-btn w3-round" ;
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
			option.innerHTML = document.getElementById("userArea").childNodes[0].childNodes[users[i]].innerHTML  ;
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
			socket.emit("god",{oldUser:userName,newUser:index,number:roomNumber});
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
			socket.emit("mission",{choose:"y",number:roomNumber,user:userName}) ;
			document.getElementById("missionArea").innerHTML = "" ;
		});
		if ( gb === "b" ){
			var n = document.createElement("button") ;
			n.innerHTML = "失敗" ;
			n.className = "w3-button w3-round" ;
			document.getElementById("missionArea").appendChild(n) ;
			n.addEventListener("click",function(){
				socket.emit("mission",{choose:"n",number:roomNumber,user:userName}) ;
				document.getElementById("missionArea").innerHTML = "" ;
			})
		} 
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
			y.className = n.className = "w3-button w3-round" ;
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

		document.getElementById("userArea").innerHTML = "" ;
		var users = data.users ;
		var ul = document.createElement("ul") ;
		ul.className = "w3-ul w3-card-4" ;
		for ( var i = 0 ; i < users.length ; i ++ ){
			var u = document.createElement("li") ;
			u.innerHTML = users[i] ;
			ul.appendChild(u) ;
		}

		document.getElementById("userArea").appendChild(ul);
	});
	socket.on("status",function (data){
		var round = data.round ;
		var amount = data.amount ;
		var cap = data.cap ;
		var vote = data.vote ;
		var success = data.success ;
		var fail = data.fail ;
		var godArray = data.godArray ;
		var d = document.createElement("span") ;
		d.className = "w3-teal w3-badge" ;
		d.innerHTML = round ;
		document.getElementById("roundArea").innerHTML = "任務：" ;
		document.getElementById("roundArea").appendChild(d);
		document.getElementById("amountArea").innerHTML = ""  ;
		var p = document.createElement("i") ;
		p.className = "fa fa-male" ;
		document.getElementById("amountArea").appendChild(p) ;
		document.getElementById("amountArea").innerHTML += " " + amount ;
		var capt = document.createElement("span");
		capt.className = "w3-tag w3-orange w3-round" ;
		capt.innerHTML = cap ;
		document.getElementById("captionArea").innerHTML = "隊長："   ;
		document.getElementById("captionArea").appendChild(capt);

		document.getElementById("nowGodArea").innerHTML = "女神：" ;
		for ( var i = 0 ; i < godArray.length ; i ++ ){
			var g = document.createElement("span") ;
			g.innerHTML = document.getElementById("userArea").childNodes[0].childNodes[godArray[i]].innerHTML ;
			g.className = "w3-tag w3-teal w3-round" ;
			document.getElementById("nowGodArea").appendChild(g);
			document.getElementById("nowGodArea").innerHTML += "→";
		}

		document.getElementById("sfvArea").innerHTML = "";
		var s = document.createElement("span") ;
		s.className = "w3-badge w3-blue" ;
		s.innerHTML = success ;
		var f = document.createElement("span") ;
		f.className = "w3-badge w3-red" ;
		f.innerHTML = fail ;
		var v = document.createElement("span") ;
		v.className = "w3-badge w3-yellow" ;
		v.innerHTML = vote ;
		document.getElementById("sfvArea").appendChild(s);
		document.getElementById("sfvArea").appendChild(f);
		document.getElementById("sfvArea").appendChild(v);
		if ( parseInt(round) === 4 && document.getElementById("userArea").childNodes[0].childNodes.length >= 7 ){
			document.getElementById("noticeArea").innerHTML = "本回合需要兩個失敗才會任務失敗！" ;
		} else {
			document.getElementById("noticeArea").innerHTML = "" ;
		}
		if ( parseInt(vote) === 5){
			document.getElementById("noticeArea").innerHTML += "<br>注意！這是最後一輪投票！" ;
		}

		
		document.getElementById("gameInfoArea").innerHTML = "";
		for ( var i = 0 , j = 0 ; i < document.getElementById("userArea").childNodes[0].childNodes.length ; i ++ ){
			var div ;
			if ( i % 3 === 0 ){
				div = document.createElement("div") ;
				div.className = "w3-quarter w3-container" ;
				j ++ ;
			}
			var div2 = document.createElement("span") ;
			div2.style.display = "inline-block" ;
			var icon = document.createElement("i") ;
			icon.className = "fa fa-male fa-5x" ;
			var name = document.createElement("div") ;
			name.className = "w3-tag w3-purple w3-round" ;
			name.style.display = "block";
			name.innerHTML = document.getElementById("userArea").childNodes[0].childNodes[i].innerHTML ;
			if ( bArray.length !== 0 ){
				if ( bArray.indexOf(i) !== -1 ){
					icon.style.color = "red" ;
				}
			} 
			if ( mArray.length !== 0 ){
				if ( mArray.indexOf(i) !== -1 ){
					icon.style.color = "purple" ;
				}
			} 
			if ( parseInt(data.capIndex) === i ){
				var di = document.createElement("div") ;
				var star = document.createElement("i") ;
				star.className = "fa fa-star fa-x" ;
				di.appendChild(star);
				div2.appendChild(di) ;
			}

			var di = document.createElement("div") ;
			var miss = document.createElement("i") ;
			miss.className = "mission-div"
			di.appendChild(miss);
			div2.appendChild(di) ;

			var di = document.createElement("div") ;
			var voteDiv = document.createElement("i") ;
			voteDiv.className = "vote-div" ;
			di.appendChild(voteDiv);
			div2.appendChild(di) ;

			div2.appendChild(name) ;
			div2.appendChild(icon) ;
			document.getElementById("gameInfoArea").appendChild(div2);
			if ( i % 3 == 2 || i === document.getElementById("userArea").childNodes[0].childNodes.length -1 ){
				//document.getElementById("gameInfoArea").appendChild(div) ;
			}
		}
		
		
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

	hide(document.getElementById("roomPage"));
	hide(document.getElementById("gamePage"));

	//document.addEventListener('visibilitychange', visibleChangeHandler, false);
	var notification = window.Notification || window.mozNotification || window.webkitNotification;
	notification.requestPermission(function(permission){});

	var originalTitle = '', messageCount = 0;
	function notificationUser(message)
	{
	    if (document['hidden']) {
	        Notify(message)
	    }
	}

	function Notify(message)
	{
	    if ('undefined' === typeof notification)
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

})();