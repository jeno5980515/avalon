var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');
var bodyParser = require('body-parser')
var mysql = require('mysql2');
var path = require('path');
var connection = mysql.createConnection({
  /*
    host: //,
    user: //,
    password: //,
    database: //,
    insecureAuth: //
    */
});
//server.listen(process.env.PORTs || 8080);
server.listen(process.env.PORT || 8070);
//server.listen(8080);
app.use('/avalon',express.static(path.join(__dirname, 'public')));
//app.use(express.static(__dirname ));

var amountList = [
  [2,3,2,3,3],
  [2,3,2,3,3],
  [2,3,2,3,3],
  [2,3,2,3,3],
  [2,3,2,3,3],
  [2,3,2,3,3],
  [2,3,4,3,4],
  [2,3,3,4,4],
  [3,4,4,5,5],
  [3,4,4,5,5],
  [3,4,4,5,5]
]

var bgamount = [
  ["梅林","好人","好人","刺客","壞人"],
  ["梅林","好人","好人","刺客","壞人"],
  ["梅林","好人","好人","刺客","壞人"],
  ["梅林","好人","好人","刺客","壞人"],
  ["梅林","好人","好人","刺客","壞人"],
  ["梅林","好人","好人","刺客","壞人"],
  ["梅林","好人","好人","好人","刺客","壞人"],
  ["梅林","好人","好人","好人","刺客","壞人","壞人"],
  ["梅林","好人","好人","好人","好人","刺客","壞人","壞人"],
  ["梅林","好人","好人","好人","好人","好人","刺客","壞人","壞人"],
  ["梅林","好人","好人","好人","好人","好人","刺客","壞人","壞人","壞人"]
]

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.post("/notice", function (req, res) {
  var account = req.body.account ;
  var pass = req.body.pass ;
  if ( true ){
    var content = req.body.content ;
    updateNotice(content);
  }
});

app.post("/alert", function (req, res) {
  var account = req.body.account ;
  var pass = req.body.pass ;
  if ( true ){
    var content = req.body.content ;
    io.emit('alert', content);
  }
});

function stripHTML(input) {
  if ( input !== input.replace(/(<([^>]+)>)/ig,"") )
    return true ;
  else
    return false ;
}

var updateNotice = function(data){
  fs.writeFile("notice", data, function(err) {
    if(err) {
      console.log(err);
    } else {
      //console.log("The file was saved!");
    }
  });
}

var Users = function(){
  this.data = {} ;
};

var users = new Users();

Users.prototype.get = function(socketId){
  return this.data[socketId] ;
}

Users.prototype.recover = function(socket,data){
  var socketId = data.id ;
  var oldUser = this.get(socketId) ;
  if ( oldUser === undefined ){
    socket.emit("recover",{
      status : "fail"
    }) ;
  } else {
    var number = oldUser.get("number") ;
    var room = rooms.get(number) ;
    if ( room === undefined ){
      socket.emit("recover",{
        status : "fail"
      }) ;
    } else {
      var index = oldUser.get("index") ;
      var name = oldUser.get("name") ;
      var ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address ;
      var data = {
        socket : socket ,
        ip : ip ,
        name : name ,
        number : number ,
        state : "play" ,
        socketId : socket.id ,
        role : oldUser.get("role") ,
        nowVote : oldUser.get("nowVote") ,
        restart : oldUser.get("restart") ,
        mission : oldUser.get("mission") ,
        wait : oldUser.get("wait") ,
        god :  oldUser.get("god")
      }
      this.create( socket.id , data );
      room.setByIndex({
        player : player
      }) ;
      var newPlayer = this.get(socket.id) ;
      oldUser.checkCreater({
        successCallback : function(socketId,number,para){
          var newPlayer = para.newPlayer ;
          var room = rooms.get(number) ;
          room.set({
            creater : player
          })
        },
        para : {
          newPlayer : newPlayer
        }
      })
      room.join(socket.id);
      newPlayer.wait();
      this.delete(socketId);
    }
  }
}

Users.prototype.update = function(){
  var userList = [] ;
  for ( var key in users.data ){
    var user = users.get(key) ;
    if ( user.get("name") !== "" ){
      userList.push({
        number : user.get("number") ,
        state : user.get("state"),
        name : user.get("name") ,
        isLogin : user.get("isLogin")
      }) ;
    }
  }
  io.sockets.in("roomList").emit("getUserList",{
    userList : userList
  });
}

Users.prototype.create = function(socketId,data){
  var user = new User(data) ;
  this.data[socketId] = user;
  user.set(data);
  user.reset();
  return user ;
}

Users.prototype.delete = function(socketId){
  if ( users.get(socketId) !== undefined ){
    delete users.data[socketId] ;
  }
}


var User = function(data){
  this.name = data.name || "" ;
  this.number = data.number || null ;
  this.uid = data.uid || "" ;
  this.socket = data.socket || "" ;
  this.state = data.state || "lobby" ;
  this.isLogin = data.isLogin || false ;
  this.index = data.index || 0 ;
}

User.prototype.get = function(key){
  return this[key] ;
}

User.prototype.create = function(data){
  var password = data.password ;
  var number = rooms.create({
    creater : this ,
    isLogin : data.isLogin ,
    password : password
  });
  var room = rooms.get(number) ;
  this.emit('create', {
    number : number ,
    status : "success"
  });
  room.join(this.get("socketId"));
}

User.prototype.message = function(data){
  var number = this.get("number") ;
  var text = data.text ;
  if ( stripHTML(text) === true) {
    this.emit('messageFail',{
      status : 1
    });
  } else {
    io.sockets.in(number).emit('message', {
      player : this.get("name") ,
      text : data.text ,
      index : this.get("index") + 1
    });
  }
}

User.prototype.join = function(data){
  var number = data.number ;
  var room = rooms.get(number) ;
  var password = data.password || "" ;
  if ( isRoomBlockEnter(number) ){
    this.emit("join",{
      status : "fail"
    });
  } else if ( room.get("isLogin") === true && this.get("isLogin") === false ){
    this.emit("join",{
      status : "fail"
    });
  } else if ( isPasswordCorrect(number,password) ){
    room.join(this.get("socketId"));
  } else {
    this.emit("join",{
      status : "fail"
    });
  }
}

User.prototype.emit = function(key,data){
  if ( this.get("socket") !== undefined ){
    this.get("socket").emit(key,data) ;
  }
}

User.prototype.wait = function(){
  var number = this.get("number") ;
  if ( this.get("wait") === "c" ){
    this.captain();
  } else if ( this.get("wait") === "v"){
    this.chooseUser();
  } else if ( this.get("wait") === "m"){
    this.mission() ;
  } else if ( this.get("wait") === "a"){
    this.ass();
  } else if ( this.get("wait") === "g" ){
    this.god();
  }
}

User.prototype.set = function(data){
  for ( var key in data ){
    this[key] = data[key] ;
  }
}

User.prototype.mission = function(){
  this.emit("mission","mission") ;
}

User.prototype.god = function(){
  var number = this.get("number") ;
  var room = rooms.get(number) ;
  this.emit("god",{
    players : room.getGodPlayerList()
  }) ;
}

User.prototype.getRoomSetting = function(){
  var number = this.get("number") ;
  this.emit("setRoomSetting",{
    number : number
  })
}

User.prototype.kick = function(data){
  var index = data.index ;
  this.checkCreater({
    successCallback : function(socketId,number,para){
      var index = para.index ;
      var player = users.get(socketId) ;
      var room = rooms.get(number) ;
      if ( player !== undefined && room !== undefined && room.getByIndex("players",index) !== null ){
        var kickUser = room.getByIndex("players",index) ;
        player.emit('kick',{}) ;
        io.sockets.in(number).emit('console',{
          console : "室長 "+  player.get("name") + " 踢出 " + kickUser.get("name")
        });
        kickUser.leave();
      }
    },
    para : {
      index : index
    }
  })
}

User.prototype.changeRole = function(data){
  this.checkCreater({
    successCallback : function(socketId,number,para){
      if ( para.oldRole !== undefined ){
        var oldRole = para.oldRole ;
        var newRole = para.newRole ;
        var room = rooms.get(number) ;
        var index = room.getIndex("role",oldRole) ;
        if ( index !== -1 ){
          room.setByIndex(index,{
            role : newRole
          })
          io.sockets.in(number).emit('console', {
            console : "室長將 " + oldRole + " 替換成 " + newRole ,
            notify : true
          }) ;
        }
      }
      room.showRole(para.oldRole);
    } ,
    para : {
      role : data.role ,
      oldRole : data.oldRole ,
      newRole : data.newRole
    }
  })
}

User.prototype.restartRequest = function(){
  var number = this.get("number") ;
  var room = rooms.get(number) ;
  var name = this.get("name") ;
  if ( room.get("isRestart") === false && room.get("isStart") === true ){
    room.set({
      isRestart : true
    });
    io.sockets.in(number).emit("restartRequest",{
      status : "success" ,
      player : name
    });
  } else {
    socket.emit("restartRequest",{
      status : "fail"
    });
  }
}

User.prototype.restartVote = function(data){
  var number = this.get("number") ;
  var room = rooms.get(number) ;
  var result = data.result ;
  if ( room.get("isRestart") === true && room.get("isStart") === true ){
    if ( result === true ){
      this.set({
        restart : "success"
      })
    } else {
      this.set({
        restart : "fail"
      })
    }
    room.checkRestart();
  }
}

User.prototype.ass = function(){
  var good = [] ;
  var number = this.get("number") ;
  var room = rooms.get(number) ;
  var length = room.getLength("players") ;
  var players = room.get("players") ;
  room.showBadPlayerRole();
  var assData = room.getAssData();
  var assPlayer = assData.assPlayer ;
  var assList = assData.list ;
  assPlayer.emit("ass",{
    good : assList
  }) ;
  assPlayer.set({
    wait : "a"
  })
  room.status();
}


User.prototype.reset = function(){
  this.vote = "n" ;
  this.restart = "n" ;
  this.mission = "n" ;
  this.wait = "n" ;
  this.god = "n" ;
}

User.prototype.get = function(key){
  return this[key] ;
}



User.prototype.leaveRoom = function(){
  var name = this.get("name") ;
  var number = this.get("number") ;
  var index = this.get("index") ;
  var room = rooms.get(number) ;
  room.remove({
    key : "players" ,
    index : index
  })
  this.get("socket").leave(number);
  var info = room.getInfo();
  info.name = name ;
  io.sockets.in(number).emit("leave", info );
  io.sockets.in(number).emit('console',{
    console : name + " 離開房間。" ,
    notify : true
  }) ;
  this.checkChangeCreater();
  this.set({
    state : "lobby" ,
    number : null
  })
  room.reset();
  this.get("socket").join("roomList");
  rooms.update();
  this.emit("enterRoomList",{});
}

User.prototype.leaveLobby = function(){
  users.delete(this.get("socketId"));
}

User.prototype.leaveDisconnect = function(){
  var number = users.get(socketId,"number") ;
  var room = rooms.get(number) ;
  var index = this.get("index") ;
  var socketId = this.get("socketId") ;
  room.remove({
    key : "players" ,
    index : index
  })
  this.checkChangeCreater();
  users.delete(socketId);
}

User.prototype.leavePlay = function(){
  this.set({
    state : "disconnect"
  })
  var number = this.get("number") ;
  var room = rooms.get(number) ;
  var index = this.get("index") ;
  var name = this.get("name") ;
  if ( index !== -1 ){
    io.sockets.in(number).emit('console',{
      console : name + " 斷線，請等候回復。" ,
      notify : true
    }) ;
  }
  room.checkDelete();
}


User.prototype.leave = function(){
  var state = this.state ;
  if ( state === "room" ){
    this.leaveRoom();
  } else if ( state === "lobby" ){
    this.leaveLobby();
  } else if ( state === "play" ){
    this.leavePlay();
  } else if ( state === "disconnect" ){
    this.leaveDisconnect();
  }
}


var	Rooms = function(){
  this.data = {} ;
}

var rooms = new Rooms();

Rooms.prototype.create = function(data){
  var room = new Room(data);
  var number = room.number ;
  this.data[number] = room;
  room.reset();
  return number ;
}

Rooms.prototype.delete = function(number){
  if ( rooms.get(number) !== undefined ){
    delete rooms.data[number] ;
  }
}

var Room = function(data){
  var maxNum = 2000;
  var minNum = 6000;
  var number = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
  while ( rooms.get(number) !== undefined ){
    number = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
  }
  this.password = data.password ;
  this.creater = data.creater ;
  this.players = [] ;
  this.isLogin = data.isLogin || false ;
  this.number = number ;
}


Rooms.prototype.get = function(number){
  return this.data[number];
}

Rooms.prototype.update = function(){
  var roomList = [] ;
  for ( var key in rooms.data ){
    var room = rooms.data[key] ;
    var p = true ;
    if ( room.get("password") === "" )
      p = false ;
    var createrName = null ;
    if ( room.get("creater") !== undefined && room.get("creater") !== null ){
      createrName = room.get("creater").get("name") ;
    }
    roomList.push({
      number : key ,
      start : room.get("isStart"),
      password : p ,
      creater : createrName ,
      people : room.getLength("players") ,
      isLogin : room.get("isLogin")
    }) ;
  }
  io.sockets.in("roomList").emit("getRoomList",{
    roomList : roomList
  });
  users.update();
}

Room.prototype.get = function(key){
  return this[key] ;
}

Room.prototype.getAssPlayer = function(){
  for ( var i = 0 ; i < this.get("players").length ; i ++ ){
    if ( this.get("players")[i].get("role") === "刺客" ){
      return this.get("players")[i] ;
    }
  }
  return null ;
}

Room.prototype.ass = function(data){
  var index = data.index ;
  var number = this.get("number");
  var assPlayer = this.getByIndex("player",index);
  var msg = "刺客選擇刺殺 "+ assPlayer.get("name") ;
  io.sockets.in(number).emit('console',{
    console  : "刺客選擇刺殺 "+ msg
  }) ;
  if ( assPlayer.get("role") === "梅林" ){
    var m1 = "刺中梅林！壞人獲勝！" ;
    msg += "<br>" + m1 ;
    io.sockets.in(number).emit('console',{
      console : m1
    }) ;
  } else {
    var m2 = "刺殺失敗！好人獲勝！" ;
    msg += "<br>" + m2 ;
    io.sockets.in(number).emit('console',{
      console : m2
    }) ;
  }
  this.showAllPlayerRole();
  this.gameover({
    msg : msg
  });
}

Room.prototype.god = function(data){
  var oldPlayer = this.get("nowGod") ;
  var number = this.get("number");
  var newIndex = parseInt(data.newUser) ;
  var newPlayer = this.getByIndex("players",newIndex) ;
  newPlayer.set({
    god : "y"
  })
  oldPlayer.set({
    wait : "n"
  })
  var kind = getRoleKind(newPlayer.get("role"));
  oldPlayer.emit("godResult",{
    kind : kind ,
    index : newIndex
  }) ;
  this.set({
    nowGod : newPlayer
  });
  io.sockets.in(number).emit('console',{
    console : oldPlayer.get("name") + " 查看了 " + newPlayer.get("name") + " 的陣營。"
  });
  this.changeCaptain();
}

Room.prototype.mission = function(player,data){
  var index = player.get("index") ;
  var choose = data.choose ;
  var number = this.get("number");
  var kind = getRoleKind(player.get("role")) ;
  if ( kind === "good" && choose === "n" )
    return ;
  if ( choose === "n" ){
    player.set({
      mission : "fail" ,
      wait : "n"
    })
  } else {
    player.set({
      mission : "success" ,
      wait : "n"
    })
  }
  io.sockets.in(number).emit('console',{
    console : player.get("name") +" 已經出完任務了。"
  }) ;
  var missionData = this.getMissionData();
  if ( missionData.status === "y" ){
    var successAmount = missionData.successAmount ;
    var failAmount = missionData.failAmount ;
    io.sockets.in(number).emit('console',{
      console : "成功："+ successAmount +"，失敗："+ failAmount
    }) ;
    if ( this.get("round") === 4 && this.getLength("players") >= 7 ){
      if ( failAmount < 2 ){
        this.missionSuccess();
      } else {
        this.missionFail();
      }
    } else {
      if ( failAmount === 0 ){
        this.missionSuccess();
      } else {
        this.missionFail();
      }
    }
    this.checkMissionResult();
  }
}

Room.prototype.vote = function(player,data){
  var index = player.get("index") ;
  var number = this.get("number");
  var choose = data.choose ;
  io.sockets.in(number).emit('console',{
    console : player.get("name") + " 已經投好票了。"
  }) ;
  player.set({
    wait : "n" ,
    vote : choose
  })
  io.sockets.in(number).emit('voted',{
    index : index
  });
  var voteData = this.getVoteData();
  if ( voteData.status === "y" ){
    var voteList = voteData.list ;
    var successAmount = voteData.successAmount ;
    var failAmount = voteData.failAmount ;
    for ( var i = 0 ; i < voteList.length ; i ++ ){
      var msg = " 贊成。" ;
      if ( voteList[i].vote === "fail" ){
        msg = " 反對。" ;
      }
      io.sockets.in(number).emit('console',{
        console : voteList[i].name + " " + msg
      }) ;
    }
    io.sockets.in(number).emit('console',{
      console : "贊成："+ successAmount +"，反對："+ failAmount
    }) ;
    io.sockets.in(number).emit('voteResult',{
      votes : voteList
    }) ;
    if ( successAmount > failAmount ){
      io.sockets.in(number).emit('console',{
        console : "贊成過半！隊員正在出任務中。"
      }) ;
      for ( var i = 0 ; i < this.get("players").length ; i ++ ){
        var player = this.get("players")[i] ;
        if ( player.get("mission") === "y" ){
          player.set({
            wait : "m"
          })
        }
      }
    } else {
      io.sockets.in(number).emit('console',{
        console : "贊成未過半！"
      }) ;
      this.newVote();
      if ( this.get("nowVote") > 5 ){
        var msg = "投票超過五次！壞人獲勝！" ;
        io.sockets.in(number).emit('console',{
          console : msg
        }) ;
        this.showAllPlayerRole();
        rooms.gameover(number,{
          msg : msg
        });
      } else {
        if ( this.get("nowVote") === 5 ) {
          io.sockets.in(number).emit('console',{
            console : "注意！這是最後一次投票！"
          }) ;
        }
        this.changeCaptain();
      }
    }
  }
  this.status();
}

Room.prototype.captain = function(player,data){
  var number = this.get("number");
  var msg = "隊員：" ;
  for ( var i = 0 ; i < this.get("players").length ; i ++ ){
    var mission = "n" ;
    if ( data.players.indexOf(i) !== -1 ){
      mission = "y" ;
      msg += this.get("players")[i].get("name") + " " ;
    }
    this.get("players")[i].set({
      mission : mission ,
      wait : "v"
    })
  }
  io.sockets.in(number).emit('console',{
    console : "隊長選擇好隊員了 請投票。"
  }) ;
  io.sockets.in(number).emit('console',{
    console : msg
  }) ;
  this.chooseUser();
}

Room.prototype.getVoteData = function(){
  var status = "n" ;
  var successAmount = 0 ;
  var failAmount = 0 ;
  var list = [] ;
  for ( var i = 0 ; i < this.get("players").length ; i ++ ){
    var player = this.get("players")[i] ;
    list.push({
      name : player.get("name") ,
      index : i ,
      vote : player.get("vote")
    })
    if ( player.get("vote") === "success" ){
      successAmount ++ ;
    } else if ( player.get("vote") === "fail" ){
      failAmount ++ ;
    }
  }
  if ( list.length === failAmount + successAmount ) {
    status = "y" ;
  }
  return {
    status : status ,
    list : list ,
    failAmount : failAmount ,
    successAmount : successAmount
  }
}

Room.prototype.checkRestart = function(){
  var successAmount = 0 , failAmount = 0 ;
  var number = this.get("number") ;
  for ( var i = 0 ; i < this.get("players").length ; i ++ ){
    if ( this.get("players")[i].get("restart") === "success" ){
      successAmount ++ ;
    } else if ( this.get("players")[i].get("restart") === "fail" ) {
      failAmount ++ ;
    }
  }
  if ( failAmount >=  Math.ceil(this.get("players").length / 2) ){
    this.set({
      isRestart : false
    })
    io.sockets.in(number).emit('restartResult',{
      status : "fail"
    }) ;
  } else if ( successAmount >=  Math.ceil(this.get("players").length / 2) ){
    this.set({
      isRestart : false
    })
    io.sockets.in(number).emit('console',{
      console : "投票過半，回到房間。" ,
      notify : true
    }) ;
    this.gameover({
      msg : "投票過半，回到房間。"
    })
    this.emitWithCreate("restartResult",{
      status : "success"
    })
  }
}

Room.prototype.checkMissionResult = function(){
  var successAmount = 0 , failAmount = 0 ;
  var number = this.get("number") ;
  for ( var i = 0 ; i < this.get("missionResultList").length ; i ++ ){
    if ( this.get("missionResultList")[i] === true ){
      successAmount ++ ;
    } else {
      failAmount ++ ;
    }
  }
  var assPlayer = this.getAssPlayer();
  if ( successAmount >= 3 ){
    io.sockets.in(number).emit('console',{
      console : "好人獲勝。"
    }) ;
    io.sockets.in(number).emit('console',{
      console : "壞人現身，刺客選擇刺殺對象。"
    }) ;
    this.showBadPlayerRole();
    assPlayer.ass(socketId);
  } else if ( rooms.get(number,"failAmount") >= 3 ){
    var msg = "三次任務失敗，壞人獲勝。" ;
    io.sockets.in(number).emit('console',{
      console : msg
    }) ;
    room.showAllPlayerRole();
    room.gameover({
      msg : msg
    });
    room.status();
  } else {
    room.newRound();
    if ( room.get("god") === true && room.getLength("players") >= 7 && room.get("round") >= 3 && room.get("round") <= 5 ){
      var nowGod = room.get("nowGod") ;
      nowGod.set({
        wait : "g"
      })
      io.sockets.in(number).emit('console',{
        console : nowGod.get("name") +" 正在使用湖中女神。"
      });
      nowGod.god();
    } else {
      room.changeCaptain();
    }
  }
}

Room.prototype.resetVote = function(){
  for ( var i = 0 ; i < this.get("players").length ; i ++ ){
    var player = this.get("players")[i] ;
    player.set({
      vote : "n"
    })
  }
}

Room.prototype.newRound = function(){
  this.resetVote();
  this.set({
    round : this.get("round") + 1
  })
}

Room.prototype.newVote = function(){
  this.resetVote();
  this.set({
    nowVote : this.get("nowVote") + 1
  })
}


Room.prototype.missionFail = function(){
  var number = this.get("number") ;
  io.sockets.in(number).emit('console',{
    console : "任務失敗。"
  }) ;
  this.add({
    key : "missionResultList" ,
    index : "last"  ,
    item : false
  })
}


Room.prototype.missionSuccess = function(){
  var number = this.get("number") ;
  io.sockets.in(number).emit('console',{
    console : "任務成功。"
  }) ;
  this.add({
    key : "missionResultList" ,
    index : "last"  ,
    item : true
  })
}

Room.prototype.getMissionData = function(){
  var status = "n" ;
  var successAmount = 0 ;
  var failAmount = 0 ;
  for ( var i = 0 ; i < this.get("players").length ; i ++ ){
    var player = this.get("players")[i] ;
    if ( player.get("mission") === "success" ){
      successAmount ++ ;
    } else if ( player.get("mission") === "fail" ){
      failAmount ++ ;
    }
  }
  if ( this.getByIndex("amount",this.get("round")-1 ) === failAmount + successAmount ) {
    status = "y" ;
  }
  return {
    status : status ,
    successAmount : successAmount ,
    failAmount : failAmount
  }
}

Room.prototype.changeCaptain = function(){
  var oldCaptain = this.get("nowCaptain") ;
  var index = oldCaptain.get("index") ;
  var number = this.get("number") ;
  index ++ ;
  if ( index >= this.get("players").length ){
    index = 0 ;
  }
  var newCaptain = this.get("players")[index] ;
  this.set({
    nowCaptain : this.get("players")[index]
  })
  io.sockets.in(number).emit('console',{
    console : "隊長替換成 " + newCaptain.get("name")
  }) ;
  this.status();
  io.sockets.in(number).emit('console',{
    console : "隊長正在選擇隊員。"
  });
  newCaptain.set({
    wait : "c"
  })
  oldCaptain.set({
    wait : "n"
  })
  newCaptain.captain();
}

Room.prototype.getAssData = function(){
  var list = [] ;
  var assPlayer = null ;
  for ( var i = 0 ; i < this.get("players").length ; i ++ ){
    var player = this.get("players")[i] ;
    if ( getAssKind(player.get("role")) === "good" ){
      list.push({
        index : i ,
        player : player.get("name")
      });
    } else if ( getAssKind(player.get("role")) === "bad" ){
      if ( getAssKind(player.get("role")) === "ass" ){
        assPlayer = player ;
      }
    }
  }
  return {
    assPlayer : assPlayer ,
    list : list
  }
}

Room.prototype.showAllPlayerRole = function(){
  this.showGoodPlayerRole();
  this.showBadPlayerRole();
}

Room.prototype.showGoodPlayerRole = function(){
  var number = this.get("number") ;
  for ( var i = 0 ; i < this.get("players").length ; i ++ ){
    var player = this.get("players")[i] ;
    if ( getAssKind(player.get("role")) === "good" ){
      io.sockets.in(number).emit('console',{
        console : player.get("name") +" 身份："+ player.get("role")
      }) ;
    }
  }
}

Room.prototype.showBadPlayerRole = function(){
  var number = this.get("number") ;
  for ( var i = 0 ; i < this.get("players").length ; i ++ ){
    var player = this.get("players")[i] ;
    if ( getAssKind(player.get("role")) !== "good" ){
      io.sockets.in(number).emit('console',{
        console : player.get("name") +" 身份："+ player.get("role")
      }) ;
    }
  }
}

Room.prototype.checkDelete = function(){
  if ( this.getLength("players") === 0 ){
    rooms.delete(number);
    rooms.update();
  }
}

Room.prototype.getGodPlayerList = function(){
  var list = [] ;
  for ( var i = 0 ; i < this.get("players").length ; i ++ ){
    var player = this.get("players")[i] ;
    if ( player.get("god") === "n" ){
      list.push({
        name : player.get("name") ,
        index : player.get("index")
      }) ;
    }
  }
  return list ;
}

Room.prototype.getPlayerList = function(){
  var list = [] ;
  var players = this.get("players") ;
  if ( players === undefined ) return list ;
  for ( var i = 0 ; i < players.length ; i ++ ){
    list.push({
      isLogin : players[i].get("isLogin") ,
      name : players[i].get("name")
    })
  }
  return list ;
}

Room.prototype.getIndex = function(key,item){
  var index = -1 ;
  if ( this.get(key) !== undefined ){
    index = this.get(key).indexOf(item) ;
  }
  return index ;
}

Rooms.prototype.getLength = function(number,key){
  var l = 0 ;
  if ( rooms.get(number) !== undefined ){
    if ( rooms.get(number,key) !== undefined ){
      l = rooms.get(number,key).length ;
    }
  }
  return l ;
}

Room.prototype.emitWithCreate = function(key,data){
  for ( var i = 0 ; i < this.get("players").length ; i ++ ){
    if ( this.get("players")[i] === this.get("creater") ){
      data.create = true ;
      this.get("players")[i].emit(key,data) ;
    } else {
      data.create = false ;
      this.get("players")[i].emit(key,data) ;
    }
  }
}

Room.prototype.add = function(data){
  this.check({
    key : data.key ,
    successCallback : function(number,para){
      var room = rooms.get(number) ;
      var index = para.index ;
      var key = para.key ;
      var item = para.item ;
      if ( index === "last" ){
        var length = room.getLength(key) ;
        index = length ;
      }
      room.get(key).splice(index, 0, item);
    },
    para : {
      index : data.index ,
      key : data.key ,
      item : data.item
    }
  })
}

Room.prototype.check = function(data){
  var socketId = data.socketId ;
  var key = data.key ;
  var successCallback = data.successCallback ;
  var failCallback = data.failCallback ;
  var para = data.para ;
  var number = this.get("number") ;
  if ( this.get(key) !== undefined ){
    successCallback(number,para);
  } else if ( failCallback !== undefined ) {
    failCallback(number,para);
  }
}


Room.prototype.remove = function(data){
  this.check({
    key : data.key ,
    successCallback : function(number,para){
      var index = para.index ;
      var key = para.key ;
      var room = rooms.get(number) ;
      if ( room.get(key) !== undefined ){
        room.get(key).splice(index, 1);
      }
    },
    para : {
      index : data.index ,
      key : data.key
    }
  })
}

Room.prototype.getVoteDoneArray = function(){
  var list = [] ;
  var length = this.getLength("players") ;
  var users = this.get("players") ;
  for ( var i = 0 ; i < length ; i ++ ){
    if ( users[i].vote === "n" ){
      list.push("n") ;
    } else {
      list.push("y") ;
    }
  }
  return list ;
}

Room.prototype.status = function(){
  var number = this.get("number") ;
  io.sockets.in(number).emit('status', this.getInfo() );
}

Room.prototype.clear = function(){
  for ( var i = 0 ; i < this.get("players").length ; i ++ ){
    var player = this.get("players")[i] ;
    if ( player !== undefined && player.get("state") === "disconnect" ){
      player.leave();
    }
  }
}

Room.prototype.getLength = function(key){
  var l = 0 ;
  if ( this.get(key) !== undefined ){
    l = this.get(key).length ;
  }
  return l ;
}

Room.prototype.gameover = function(data){
  this.reset();
  var number = this.get("number") ;
  var msg = data.msg ;
  io.sockets.in(number).emit('gameoverMessage',msg);
  if ( this.get("creater") !== undefined ){
    var creater = this.get("creater").get("socket") ;
    creater.emit("gameover",msg) ;
  }
}

Room.prototype.getMissionPlayerList = function(){
  var list = [] ;
  for ( var i = 0 ; i < this.get("players").length ; i ++ ){
    var player = this.get("players")[i] ;
    if ( player.get("mission") === "y" ){
      list.push({
        name : player.get("name") ,
        index : player.get("index")
      })
    }
  }
  return list ;
}

Room.prototype.chooseUser = function(){
  var number = this.get("number") ;
  io.sockets.in(number).emit('chooseUser',{
    players : this.getMissionPlayerList()
  }) ;
}

Room.prototype.getByIndex = function(key,index){
  if ( this.get(key) !== undefined ){
    if ( this.get(key)[index] !== undefined )
      return this.get(key)[index] ;
  }
  return null ;
}

Room.prototype.set = function(data){
  for ( var key in data ){
    this[key] = data[key] ;
  }
}

Room.prototype.reset = function(){
  this.clear();
  this.checkFull();
  var number = this.get("number") ;
  this.set({
    nowCaptain : this.get("creater") ,
    round : 1 ,
    missionResultList : [],
    nowVote : 1 ,
    amount : [] ,
    limit : 10 ,
    wait : [] ,
    isRestart : false ,
    isStart : false ,
    god : false ,
    nowGod : this.get("creater") ,
    role : bgamount[this.getLength("players")].slice(),
    bArray : [] ,
    bArray2 : [] ,
    mArray : []
  });
  io.sockets.in(number).emit("console",{
    console : "回到房間"
  });
  var info = this.getInfo();
  this.emitWithCreate("restart",info);
  for ( var i = 0 ; i < this.get("players") ; i ++ ){
    this.get("players")[i].set({
      state : "room"
    })
  }
  this.showRole();
}

var shuffle = function(a){
  var j, x, i;
  for (i = a.length; i; i--) {
    j = Math.floor(Math.random() * i);
    x = a[i - 1];
    a[i - 1] = a[j];
    a[j] = x;
  }
};

Room.prototype.rearrange = function(){
  var maxNum = this.getLength("players") - 1 ;
  var minNum = 0;
  var newRoles = this.get("role").slice() ;
  var number = this.get("number") ;
  shuffle(newRoles);
  shuffle(this.get("players"));
  for ( var i = 0 ; i < this.get("players").length ; i ++ ){
    this.get("players")[i].set({
      role : newRoles[i] ,
      index : i
    })
  }
  this.set({
    amount : amountList[this.get("players").length]
  })
}


Room.prototype.setBMArray = function(){
  var length = this.getLength("players") ;
  for ( var i = 0 ; i < length ; i ++ ){
    var player = this.get("players")[i] ;
    if ( player.get("role") === "刺客" || player.get("role") === "壞人"  ||  player.get("role") === "莫甘娜" ){
      this.add({
        key : "bArray" ,
        index : "last"  ,
        item : i
      })
      this.add({
        key : "bArray2" ,
        index : "last"  ,
        item : i
      })
      if ( player.get("role") === "莫甘娜" ){
        this.add({
          key : "mArray" ,
          index : "last"  ,
          item : i
        })
      }
    } else if ( player.get("role") === "奧伯倫" ){
      this.add({
        key : "bArray" ,
        index : "last"  ,
        item : i
      })
    } else if ( player.get("role") === "莫德雷德") {
      this.add({
        key : "bArray2" ,
        index : "last"  ,
        item : i
      })
    } else if ( player.get("role") === "梅林" ){
      this.add({
        key : "mArray" ,
        index : "last"  ,
        item : i
      })
    }
  }
}

Room.prototype.checkFull = function(){
  if ( this.getLength("players") >= 10 ){
    this.set({
      isFull : true
    })
  } else {
    this.set({
      isFull : false
    })
  }
}

Room.prototype.showRole = function(oldRole){
  var data = {
    role : this.get("role") ,
    oldRole : oldRole
  }
  this.emitWithCreate("role",data);
}


User.prototype.chooseUser = function(){
  var number = this.get("number") ;
  this.emit('chooseUser',{
    players : this.getMissionPlayerList()
  });
}

Room.prototype.start = function(){
  var number = this.get("number") ;
  this.set({
    isStart : true
  });
  for ( var i = 0 ; i < this.get("players").length ; i ++ ){
    this.get("players")[i].reset();
  }
  this.get("players")[this.get("players").length-1].set({
    god : "y"
  })
  this.rearrange();
  this.setBMArray();
  var nowGod = this.get("players")[this.get("players").length-1] ;
  var nowCaptain = this.get("players")[0] ;
  this.set({
    nowGod : nowGod ,
    nowCaptain : nowCaptain
  })
  for ( var i = 0 ; i < this.get("players").length ; i ++ ){
    this.get("players")[i].getRoleData();
  }
  io.sockets.in(number).emit('console',{
    console : "隊長是 " + nowCaptain.get("name")
  }) ;
  this.status();
  io.sockets.in(number).emit('console',{
    console : "隊長正在選擇隊員。"
  });
  nowCaptain.captain();
  for ( var i = 0 ; i < this.get("players").length ; i ++ ){
    var player = this.get("players")[i] ;
    player.set({
      state : "play"
    })
  }
  rooms.update();
}

Room.prototype.getInfo = function(){
  var data = {
    status : "success" ,
    number : this.get("number") ,
    round : this.get("round") ,
    nowVote : this.get("nowVote") ,
    amount : this.getByIndex("amount",this.get("round")-1) ,
    nowCaptain : {
      name : this.get("nowCaptain").get("name") ,
      index : this.get("nowCaptain").get("index")
    },
    nowGod : {
      name : this.get("nowGod").get("name") ,
      index : this.get("nowGod").get("index")
    },
    missionResultList : this.get("missionResultList") ,
    userAmount : this.getLength("players"),
    isStart : this.get("isStart") ,
    voteDoneArray : this.getVoteDoneArray() ,
    players : this.getPlayerList() ,
  }
  return data ;
}

Room.prototype.join = function(socketId){
  var player = users.get(socketId) ;
  var name = player.get("name") ;
  var number = this.get("number") ;
  player.get("socket").leave("roomList");
  player.get("socket").join(number);
  if ( player.get("state") === "play" ){
    player.getRoomSetting();
    player.emit("save",{
      id : socketId
    });
    var info = this.getInfo();
    info.player = name ;
    player.emit("recover", info ) ;
    player.role();
    this.status();
  } else {
    this.add({
      key : "players" ,
      index : "last"  ,
      item : player
    })
    player.set({
      name : name ,
      number : number ,
      state : "room" ,
      index : this.getLength("players") - 1
    });
    player.getRoomSetting();
    var info = this.getInfo();
    io.sockets.in(number).emit("join", info );
    this.reset();
  }
  io.sockets.in(number).emit('console',{
    console: name + " 加入房間" ,
    notify : true
  }) ;
  rooms.update();
}

Room.prototype.setByIndex = function(index,para){
  for ( var key in para ){
    if ( this.get(key) !== undefined ){
      if ( this.get(key)[index] !== undefined ){
        this.get(key)[index] = para[key] ;
      }
    }
  }
}

var isRoomBlockEnter = function(number){
  var room = rooms.get(number) ;
  if ( room === undefined || room.get("isStart") || room.get("isFull") )
    return true ;
  else
    return false ;
}

var isPasswordCorrect = function(number,password){
  var room = rooms.get(number) ;
  if ( room.get("password") === undefined || room.get("password") === "" || room.get("password") === password ){
    return true ;
  } else {
    return false ;
  }
}

var getRoleKind = function(src){
  if ( src === "好人" || src === "梅林" || src === "派西維爾" ){
    return "good" ;
  } else if ( src === "莫甘娜" || src === "莫德雷德" || src === "奧伯倫" || src === "壞人" || src === "刺客" ){
    return "bad" ;
  }
};

var getAssKind = function(src){
  if ( src === "好人" || src === "梅林" || src === "派西維爾" || src === "奧伯倫" ){
    return "good" ;
  } else if ( src === "莫甘娜" || src === "莫德雷德" ||  src === "壞人"  ){
    return "bad" ;
  } else if ( src === "刺客"){
    return "ass" ;
  }
}


var setUserName = function(socket,data){
  var name = data.name ;
  var player = createUser(socket);
  player.set({
    name : data.name
  });
  player.emit("setUserNameResult",{});
}

var getRoomList = function(socket){
  socket.join("roomList");
  rooms.update();
}

var clearRoom = function(){
  for ( var key in rooms.data ){
    if ( rooms.getLength(key,"user") === 0 ){
      rooms.delete(key);
    }
  }
}

var getUserList = function(){
  var roomList = [] ;
  for ( var key in users.data ){
    roomList.push({user:users.get(key,"name"),state:users.get(key,"state")}) ;
  }
  console.log(roomList);
  console.log("---")
  //io.sockets.in("roomList").emit("getRoomList",{roomList:roomList});
}

User.prototype.captain = function(){
  var number = this.get("number") ;
  var room = rooms.get(number);
  this.set({
    wait : "c"
  })
  this.emit("captain",{
    amount : room.getByIndex("amount",room.get("round")-1),
    players : room.getPlayerList()
  }) ;
}

User.prototype.disconnect = function(){
  var socketId = this.get("socketId") ;
  if ( users.get(socketId) !== undefined ){
    this.leave();
    if ( this.get("state") === "lobby" ){
      users.delete(socketId);
    }
  }
}

User.prototype.start = function(){
  this.checkCreater({
    successCallback : function(socketId,number){
      var room = rooms.get(number) ;
      if ( room.getLength("players") < 5 ){
        io.sockets.in(number).emit('console',{
          console : "人數需要五個人以上。"
        }) ;
      } else {
        room.start();
      }
    }, failCallback : function(socketId,number){
      var player = users.get(socketId) ;
      player.get(socketId).emit("start",{
        status : "fail"
      }) ;
    }
  })
}

User.prototype.godSet = function(){
  this.checkCreater({
    successCallback : function(socketId,number){
      var player = users.get(socketId) ;
      var room = rooms.get(number);
      if ( room.getLength("players") < 7 ){
        player.emit("godSet",{
          status : "fail"
        })
      } else {
        if ( room.get("god") === false  ){
          room.set({
            god : true
          });
          io.sockets.in(number).emit('console',{
            console : "室長開啟湖中女神。" ,
            notify : true
          }) ;
          player.emit("godSet",{
            status : "success" ,
            godSet : true
          })
        } else if ( room.get("god") === true ){
          room.set({
            god : false
          });
          io.sockets.in(number).emit('console',{
            console : "室長關閉湖中女神。" ,
            notify : true
          }) ;
          player.emit("godSet",{
            status : "success" ,
            godSet : false
          })
        }
      }
    }
  })
}

User.prototype.restart = function(){
  this.checkCreater({
    successCallback : function(socketId,number){
      var room = rooms.get(number) ;
      room.reset();
    }
  })
}

User.prototype.getRoleData = function(){
  var number = this.get("number") ;
  var index = this.get("index") ;
  var room = rooms.get(number) ;
  var bArray = mArray = undefined ;
  if ( this.get("role") === "梅林" ){
    bArray = room.get("bArray") ;
  } else if ( this.get("role") === "刺客" || this.get("role") === "壞人" || this.get("role") === "莫甘娜" || this.get("role") === "莫德雷德") {
    bArray = room.get("bArray2") ;
  } else if ( this.get("role") === "派西維爾") {
    mArray = room.get("mArray") ;
  }
  var info = room.getInfo();
  info.role = this.get("role") ;
  info.status = "success" ;
  info.index = this.get("index") ;
  info.bArray = bArray ;
  info.mArray = mArray ;
  this.emit("start", info ) ;
}


User.prototype.check = function(data){
  var socketId = this.get("socketId") ;
  var key = data.key ;
  var successCallback = data.successCallback ;
  var failCallback = data.failCallback ;
  var para = data.para ;

  if ( this.get(key) !== undefined ){
    successCallback(socketId,para);
  } else if ( failCallback !== undefined ) {
    failCallback(socketId,para);
  }
}

User.prototype.checkCreater = function(data){
  var number = this.get("number") ;
  var room = rooms.get(number) ;
  var successCallback = data.successCallback ;
  var failCallback = data.failCallback ;
  var para = data.para ;
  var socketId = this.get("socketId") ;
  if ( this === room.get("creater") ){
    successCallback(socketId,number,para);
  } else if ( failCallback !== undefined ) {
    failCallback(socketId,number,para);
  }
}

User.prototype.checkChangeCreater = function(){
  var number = this.get("number") ;
  var socketId = this.get("socketId") ;
  this.checkCreater({
    successCallback : function(socketId,number){
      var room = rooms.get(number) ;
      if ( room.getLength("players") !== 0 ){
        var creater = room.getByIndex("players",0) ;
        room.set({
          creater : creater
        });
        io.sockets.in(number).emit('console',{
          console: "室長替換成 "+ creater.get("name") ,
          notify : true
        }) ;
        creater.get("socket").emit('changeCreater',{});
        room.showRole();
        var info = room.getInfo();
        room.emitWithCreate("restart",info);
      } else {
        rooms.delete(number);
      }
    }
  })

}

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

var checkIp = function(ip){
  return null;
  for ( var key in users.data ){
    if ( users.get(key,"ip") === ip ){
      return key ;
    }
  }
  return null ;
}

var createUser = function(socket){
  var handshake = socket.handshake  ;
  var ip = "test" ;
  if ( handshake !== undefined ){
    ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address ;
  }
  var socketId = checkIp(ip) ;
  if ( socketId !== null ){
    socket.emit("ip",{}) ;
    socket.on("logout",function(){
      if ( users.get(socketId) !== undefined ){
        users.get(socketId,"socket").disconnect();
      }
      socket.emit("logout",{});
    })
    return ;
  }
  var socketId = socket.id || "test" ;
  var player = users.create(socketId,{
    socket : socket ,
    ip : ip ,
    socketId : socketId
  });
  socket.join("roomList") ;
  return player
}

io.sockets.on('connection', function (socket) {
  socket.on("login",function (data){
    var id = data.id ;
    checkUserExist(connection,id,function (rows){
      socket.emit("login",{
        status : "exist" ,
        name : rows[0].name
      })
      createUser(socket);
      users.set(socket.id,{
        isLogin : true ,
        name : rows[0].name
      })
    },function(){
      socket.emit("login",{
        status : "new"
      })
    });
  })
  socket.on("new",function (data){
    var id = data.id ;
    var name = data.name ;
    if ( name === "" ||  name.length > 6 || stripHTML(name) === true ){
      socket.emit("new",{
        status : "invalid"
      });
    } else {
      checkUserExist(connection,id,function(){
        socket.emit("new",{
          status : "exist"
        });
      },function(){
        var queryString = 'SELECT * FROM `avalon_user` WHERE `name` = "' + name + '"' ;
        connection.query(queryString, function(err, rows, fields) {
          if (err) throw err;
          if ( rows.length > 0 ){
            socket.emit("new",{
              status : "fail"
            });
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
            });
            socket.emit("new",{
              status : "success" ,
              name : name
            });
            createUser(socket);
            users.set(socket.id,{
              isLogin : true ,
              name : name
            })
          }
        });
      });
    };
  })
  socket.on("getRoomList",function (data){
    getRoomList(socket);
  });
  socket.on("setUserName",function (data){
    setUserName(socket,data);
  });
  socket.on('create', function (data) {
    var player = users.get(socket.id) ;
    player.create(data);
  });
  socket.on('message',function (data){
    var player = users.get(socket.id) ;
    player.message(data);
  });

  socket.on("join",function (data){
    var player = users.get(socket.id) ;
    player.join(data);
  });
  socket.on('disconnect', function() {
    console.log(socket.id);
    try {
      var player = users.get(socket.id) ;
      player.disconnect();
    }
    catch(err) {
      console.log(err);
    }
  });
  socket.on('leave', function (data) {
    users.leave(socket.id);
  });
  socket.on("role",function (data){
    var player = users.get(socket.id) ;
    player.changeRole(data);
  });
  socket.on("restartVote",function (data){
    var player = users.get(socket.id) ;
    player.restartVote(data);
  })
  socket.on("restartRequest",function (data){
    var player = users.get(socket.id) ;
    player.restartRequest();
  })
  socket.on("godSet",function (){
    var player = users.get(socket.id) ;
    var number = player.get("number") ;
    player.godSet();
  })
  socket.on("restart", function (data){
    var player = users.get(socket.id) ;
    player.restart();
  });
  socket.on("start", function (data){
    var player = users.get(socket.id) ;
    var number = player.get("number") ;
    var room = rooms.get(number);
    room.start(player);
  });
  socket.on("captain",function (data){
    var player = users.get(socket.id);
    var number = player.get("number") ;
    var room = rooms.get(number);
    if ( room !== undefined && room.get("nowCaptain") === player ){
      room.captain(player,data);
    }
  });
  socket.on("vote",function (data){
    var player = users.get(socket.id) ;
    var number = player.get("number") ;
    var room = rooms.get(number) ;
    room.vote(player,data);
  });
  socket.on("mission",function (data){
    var player = users.get(socket.id) ;
    var number = player.get("number") ;
    var room = rooms.get(number) ;
    room.mission(player,data);
  });
  socket.on("god",function (data){
    var oldPlayer = rooms.get(socket.id) ;
    var number = oldPlayer.get(number) ;
    var room = rooms.get(number) ;
    room.god(data);
  });
  socket.on("ass",function (data){
    var player = users.get(socket.id) ;
    var number = player.get("number") ;
    var room = rooms.get(number) ;
    room.ass(data);
  });
  socket.on("recover",function (data){
    users.recover(socket,data);
  });
  socket.on("kick",function (data){
    var player = users.get(socket.id) ;
    player.kick(data);
  });
  socket.on("notice",function (data){
    const filename = "notice";
    const encode = "utf8";

    fs.readFile(filename, encode, function(err, file) {
      socket.emit("notice",{
        notice : file
      });
    });
  });

});



module.exports.users = users ;
module.exports.rooms = rooms ;
module.exports.server = server ;
