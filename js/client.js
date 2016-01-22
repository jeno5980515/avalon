(function(){
	var socket = io.connect('http://my-avalon.herokuapp.com/');
	//var socket = io.connect('localhost:5000');
	var gb = null 
	var roomNumber = null ;
	var role = null ;
	var userName = null ;
	var create = false ;
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
			hide(document.getElementById("loginPage"));
			show(document.getElementById("roomPage"));
			userName = '<img height="20px" src="'+document.getElementById("imageInput").value+'"></img>' ;
		}
	});

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
			if ( create === true ){
				var button = document.createElement("button") ;
				button.innerHTML = "開始" ;
				button.className = "w3-btn w3-round w3-indigo" ;
				button.id = "startButton" ;
				button.addEventListener("click",function(){
					socket.emit("start",{user:userName,number:roomNumber});
				})
				document.getElementById("numberDiv").appendChild(button);
			}
			hide(document.getElementById("roomPage"));
			show(document.getElementById("gamePage"));
			document.getElementById("userArea").innerHTML = "" ;
			var user = data.user ;
			var d = document.createElement("div") ;
			d.innerHTML = user +" 加入房間" ;
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
		socket.emit('create', { user : userName });
		socket.on('create', function (data) {
			if ( data.status === "success" ){
				create = true ;
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

	socket.on("role",function (data){
		document.getElementById("roleArea").innerHTML = "" ;
		var ul = document.createElement("ul") ;
		ul.className = "w3-ul w3-card-4" ;
		for ( var i = 0 ; i < data.role.length ; i ++ ){
			var div = document.createElement("li") ;
			if ( data.role[i] === "好人" || data.role[i] === "梅林") {
				div.className = "w3-blue" ;
			} else {
				div.className = "w3-red" ;
			}
			div.innerHTML = data.role[i] ;
			ul.appendChild(div);
		}
		document.getElementById("roleArea").appendChild(ul);
	})

	socket.on('message', function (data) {
		var text = document.createElement("div") ;
		text.innerHTML = data.user + " : " + data.text ;
		document.getElementById("textArea").appendChild(text);
		document.getElementById("textArea").scrollTop = document.getElementById("textArea").scrollHeight;
	}); 

	document.getElementById("textButton").addEventListener("click",function(){
		socket.emit('message',{number:roomNumber,text:document.getElementById("textInput").value,user:userName}) ;
		document.getElementById("textInput").value = "" ;
	});


	socket.on("start", function (data){
		if ( data.status === "success" ){
			var span = document.createElement("span") ;
			span.innerHTML = data.c ;
			document.getElementById("cArea").innerHTML = "你的角色是：" ;
			if ( data.c=== "梅林" || data.c === "好人" ){
				span.className = "w3-tag w3-blue w3-round" ;
				gb = "g" ;
			} else {
				span.className = "w3-tag w3-red w3-round" ;
				gb = "b" ;
			}
			document.getElementById("cArea").appendChild(span);
			if (data.c === "梅林" || data.c === "刺客" || data.c === "壞人"){
				document.getElementById("bArea").innerHTML = "壞人是："  ;
				for ( var i = 0 ; i < data.b.length ; i ++ ){				
					var span = document.createElement("span") ;
					span.className = "w3-tag w3-round-large w3-red" ;
					span.innerHTML = document.getElementById("userArea").childNodes[0].childNodes[data.b[i]].innerHTML ;
					document.getElementById("bArea").appendChild(span) ;
				}
			}
			addConsole("遊戲開始了！");
			hide(document.getElementById("startButton"));
		}
	})
	socket.on("caption",function (data){
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
		addConsole(data.console);
	});
	socket.on("mission",function (data){
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
		var users = data.users ;
		document.getElementById("chooseUserArea").innerHTML = "" ;
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
	});
	socket.on("voteResult",function (data){
		console.log(data);
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
		capt.innerHTML = document.getElementById("userArea").childNodes[0].childNodes[cap].innerHTML ;
		document.getElementById("captionArea").innerHTML = "隊長："   ;
		document.getElementById("captionArea").appendChild(capt);


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

})();