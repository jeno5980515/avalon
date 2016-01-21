(function(){
	var socket = io.connect('http://localhost:5000');
	var gb = null 
	var roomNumber = null ;
	var role = null ;
	var userName = null ;
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

	document.getElementById("loginButton").addEventListener("click",function(){
		if ( document.getElementById("nameInput").value === "" ){
			alert("請輸入暱稱！") ;
		} else {
			hide(document.getElementById("loginPage"));
			show(document.getElementById("roomPage"));
			userName = document.getElementById("nameInput").value ;
		}
	});


	document.getElementById("createButton").addEventListener("click",function(){
		createRoom();
	});

	window.onbeforeunload = function() {
		socket.emit("leave",{user:userName,number:roomNumber});
	};

	document.getElementById("joinButton").addEventListener("click",function(){
		roomNumber = document.getElementById("roomInput").value ;
		socket.emit("join",{user:userName,number:roomNumber}) ;
	});

	socket.on("join",function (data){
		if ( data.status === "fail" ){
			alert("加入失敗！");
		} else {
			var users = data.users ;
			document.getElementById("numberDiv").innerHTML = "房號 ： " + roomNumber ;
			hide(document.getElementById("roomPage"));
			show(document.getElementById("gamePage"));
			document.getElementById("userArea").innerHTML = "" ;
			var user = data.user ;
			var d = document.createElement("div") ;
			d.innerHTML = user +" 加入房間" ;
			document.getElementById("consoleArea").appendChild(d) ;
			for ( var i = 0 ; i < users.length ; i ++ ){
				var u = document.createElement("div") ;
				u.innerHTML = users[i] ;
				document.getElementById("userArea").appendChild(u) ;
			}
		}
	});

	socket.on("leave", function (data){
		var users = data.users ;
		var user = data.user ;
		var d = document.createElement("div") ;
		d.innerHTML = user +" 離開房間" ;
		document.getElementById("consoleArea").appendChild(d) ;

		document.getElementById("userArea").innerHTML = "" ;
		for ( var i = 0 ; i < users.length ; i ++ ){
			var u = document.createElement("div") ;
			u.innerHTML = users[i] ;
			document.getElementById("userArea").appendChild(u) ;
		}
	});

	var createRoom = function(){
		var userName = document.getElementById("nameInput").value ;
		socket.emit('create', { user : userName });
		socket.on('create', function (data) {
			if ( data.status === "success" ){
				roomNumber = data.number ;
				document.getElementById("numberDiv").innerHTML = "房號 ： " + roomNumber ;
				hide(document.getElementById("roomPage"));
				show(document.getElementById("gamePage"));

				socket.emit("role",{ role : "梅林" , number : roomNumber } );
				socket.emit("role",{ role : "刺客" , number : roomNumber });
			} 
			show(document.getElementById("startButton"));
		}); 
	}

	socket.on("role",function (data){
		document.getElementById("roleArea").innerHTML = "" ;
		for ( var i = 0 ; i < data.role.length ; i ++ ){
			var div = document.createElement("div") ;
			div.innerHTML = data.role[i] ;
			document.getElementById("roleArea").appendChild(div);
		}
	})

	socket.on('message', function (data) {
		var text = document.createElement("div") ;
		text.innerHTML = data.user + " : " + data.text ;
		document.getElementById("textArea").appendChild(text);
		document.getElementById("textInput").value = "" ;
		document.getElementById("textArea").scrollTop = document.getElementById("textArea").scrollHeight;
	}); 

	document.getElementById("textButton").addEventListener("click",function(){
		socket.emit('message',{number:roomNumber,text:document.getElementById("textInput").value,user:userName}) ;
	});

	document.getElementById("startButton").addEventListener("click",function(){
		socket.emit("start",{user:userName,number:roomNumber});
	});

	socket.on("start", function (data){
		if ( data.status === "success" ){
			document.getElementById("cArea").innerHTML = "你的角色是：" + data.c ;
			if ( data.c=== "梅林" || data.c === "好人" ){
				gb = "g" ;
			} else {
				gb = "b" ;
			}
			if (data.c === "梅林" || data.c === "刺客" || data.c === "壞人"){
				document.getElementById("bArea").innerHTML = "壞人是："  ;
				for ( var i = 0 ; i < data.b.length ; i ++ ){
					document.getElementById("bArea").innerHTML += document.getElementById("userArea").childNodes[data.b[i]].innerHTML + " " ;
				}
			}
			addConsole("遊戲開始了！");
			hide(document.getElementById("startButton")) ;
			document.getElementById("captionArea")
		}
	})
	socket.on("caption",function (data){
		var users = data.users ;
		var amount = data.amount ;
		document.getElementById("chooseUserArea").innerHTML = "" ;
		var select = document.createElement("select")  ;
		select.multiple = true ;
		select.size = users.length ;
		for ( var i = 0 ; i < users.length ; i ++ ){
			var option = document.createElement("option") ;
			option.innerHTML = users[i] ;
			select.appendChild(option) ; 
		} 
		document.getElementById("chooseUserArea").appendChild(select) ;
		var button = document.createElement("button") ;
		button.innerHTML = "送出" ;
		document.getElementById("chooseUserArea").appendChild(button);

		button.addEventListener("click",function(){
			var a = 0 ;
			var u = [] ;
			for (var i = 0 ; i < select.options.length ; i++ ) {
				opt = select.options[i];
				if (opt.selected) {
					a ++ ;
					u.push(i) ;
				}
			}
			if ( u.length !== amount ) {
				alert("人數不符！") ;
			} else {
				socket.emit("caption",{users:u,number:roomNumber}) ;
			}
		})
	});
	socket.on("console",function (data){
		addConsole(data.console);
	});
	socket.on("mission",function (data){
		document.getElementById("missionArea").innerHTML = "" ;
		var y = document.createElement("button") ;
		y.innerHTML = "成功" ;
		document.getElementById("missionArea").appendChild(y) ;
		y.addEventListener("click",function(){
			socket.emit("mission",{choose:"y",number:roomNumber,user:userName}) ;
			document.getElementById("missionArea").innerHTML = "" ;
		});
		if ( gb === "b" ){
			var n = document.createElement("button") ;
			n.innerHTML = "失敗" ;
			document.getElementById("missionArea").appendChild(n) ;
			n.addEventListener("click",function(){
				socket.emit("mission",{choose:"n",number:roomNumber,user:userName}) ;
				document.getElementById("missionArea").innerHTML = "" ;
			})
		} 
	});
	socket.on("chooseUser",function (data){
		var users = data.users ;
		document.getElementById("chooseUserArea").innerHTML = "出任務的人：" ;
		for ( var i = 0 ; i < users.length ; i ++ ){
			document.getElementById("chooseUserArea").innerHTML += document.getElementById("userArea").childNodes[users[i]].innerHTML + " " ;  
		}
		var y = document.createElement("button") ;
		y.innerHTML = "贊成" ; 
		var n = document.createElement("button") ;
		n.innerHTML = "反對" ;
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
	});
	socket.on("voteResult",function (data){
		console.log(data);
	});
	socket.on("rearrange",function (data){
		document.getElementById("userArea").innerHTML = "" ;
		var users = data.users ;
		for ( var i = 0 ; i < users.length ; i ++ ){
			var u = document.createElement("div") ;
			u.innerHTML = users[i] ;
			document.getElementById("userArea").appendChild(u) ;
		}
	});
	socket.on("status",function (data){
		var round = data.round ;
		var amount = data.amount ;
		var cap = data.cap ;
		var vote = data.vote ;
		var success = data.success ;
		var fail = data.fail ;
		document.getElementById("roundArea").innerHTML = "現在第 " + round + " 個任務" ;
		document.getElementById("amountArea").innerHTML = "需要人數： " + amount  ;
		document.getElementById("captionArea").innerHTML = "隊長：" + document.getElementById("userArea").childNodes[data.cap].innerHTML  ;
		document.getElementById("voteArea").innerHTML = "投票次數：" + vote  ;
		document.getElementById("successArea").innerHTML = "成功次數：" + success  ;
		document.getElementById("failArea").innerHTML = "失敗次數：" + fail  ;
	});
	socket.on("ass",function (data){
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
	hide(document.getElementById("startButton"));

})();