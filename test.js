var jsdom = require('mocha-jsdom');
var assert = require('assert');
var avalon = require('./index.js');
var server = avalon.server ;
var io = require('socket.io-client');
var url = "http://localhost:8070" ;
var http = require('http');
var socketId ;
var socketId2 ;
var socketId3 ;
var socketId4 ;
var socketId5 ;
var socketId6 ;
var socketMap = [];
var socketList = [];
var socket ;
var socket2 ;
var socket3 ;
var socket4 ;
var socket5 ;
var socket6 ;
var nowCaptain ;
var nowGod ;
var number ;
var options ={
		transports: ['websocket'],
		'force new connection': true
	};
	
	
var getRoomAndUserList = function(sock,roomData,userData,done){
	sock.off('getRoomList');
	sock.on("getRoomList",function(data){
		assert.deepEqual(roomData, data.roomList );	
		sock.off('getRoomList');
	});
	sock.on("getUserList",function(data){
		assert.deepEqual(userData, data.userList );
		sock.off('getUserList');
		done();
	});
}

describe('5人開局', function() {	

	beforeEach(function(done) {
		server.listen(8070);
		done();
	});

    describe('test登入', function() {
		it('Users取得socketId不為undefined，且名字為test', function(done) {
			socket = io.connect(url, options);
			socket.once("connect",function(){
				socket.emit("setUserName",{
					name : "test"
				});
				socket.on("setUserNameResult",function(){
					socketId = "/#" + socket.id ;
					assert.notEqual(undefined, avalon.users.get(socketId) );
					assert.equal("test", avalon.users.get(socketId).get("name") );
					socketMap["test"] = socket ;
					socketList.push(socket);
					done();
				});

			});
		});
    });
    
    describe('取得大廳資料且更新', function() {
		it('檢查userList和roomList資料', function(done) {
			socket.emit("getRoomList",{});
			getRoomAndUserList(
				socket,
				[],
				[ { number: null, state: 'lobby', name: 'test', isLogin: false } ],
				done
			) ;
		});
    });
    
    describe('test2登入 ', function() {
		it('Users取得socketId2不為undefined，且名字為test2', function(done) {
			socket2 = io.connect(url, options);
			socket2.once("connect",function(){
				socket2.emit("setUserName",{
					name : "test2"
				});
				socket2.on("setUserNameResult",function(){
					socketId2 = "/#" + socket2.id ;
					assert.notEqual(undefined, avalon.users.get(socketId2) );
					assert.equal("test2", avalon.users.get(socketId2).get("name") );
					socketMap["test2"] = socket2 ;
					socketList.push(socket2);
					done();
				});
			});
		});
    });
    
    describe('test3登入 ', function() {
		it('Users取得socketId3不為undefined，且名字為test3', function(done) {
			socket3 = io.connect(url, options);
			socket3.once("connect",function(){
				socket3.emit("setUserName",{
					name : "test3"
				});
				socket3.on("setUserNameResult",function(){
					socketId3 = "/#" + socket3.id ;
					assert.notEqual(undefined, avalon.users.get(socketId3) );
					assert.equal("test3", avalon.users.get(socketId3).get("name") );
					socketMap["test3"] = socket3 ;
					socketList.push(socket3);
					done();
				});

			});
		});
    });

    describe('test4登入 ', function() {
		it('Users取得socketId4不為undefined，且名字為test4', function(done) {
			socket4 = io.connect(url, options);
			socket4.once("connect",function(){
				socket4.emit("setUserName",{
					name :  "test4"
				});
				socket4.on("setUserNameResult",function(){
					socketId4 = "/#" + socket4.id ;
					assert.notEqual(undefined, avalon.users.get(socketId4) );
					assert.equal("test4", avalon.users.get(socketId4).get("name") );
					socketMap["test4"] = socket4 ;
					socketList.push(socket4);
					done();
				});

			});
		});
    });

    describe('test5登入 ', function() {
		it('Users取得socketId5不為undefined，且名字為test5', function(done) {
			socket5 = io.connect(url, options);
			socket5.once("connect",function(){
				socket5.emit("setUserName",{
					name : "test5"
				});
				socket5.on("setUserNameResult",function(){
					socketId5 = "/#" + socket5.id ;
					assert.notEqual(undefined, avalon.users.get(socketId5) );
					assert.equal("test5", avalon.users.get(socketId5).get("name") );
					socketMap["test5"] = socket5 ;
					socketList.push(socket5);
					done();
				});

			});
		});
    });
	
    describe('取得大廳資料且更新', function() {
		it('檢查userList和roomList資料', function(done) {
			socket.emit("getRoomList",{});
			getRoomAndUserList(
				socket,
				[],
				[ { number: null, state: 'lobby', name: 'test', isLogin: false },
				     { number: null, state: 'lobby', name: 'test2', isLogin: false },
				     { number: null, state: 'lobby', name: 'test3', isLogin: false },
				     { number: null, state: 'lobby', name: 'test4', isLogin: false },
				     { number: null, state: 'lobby', name: 'test5', isLogin: false } ],
				done
			) ;
		});
    });

    describe('創造房間', function() {
		it('檢查userList和roomList資料', function(done) {
			socket.emit("create",{});
			socket.on("create",function(data){
				number = data.number ;
				assert.equal("success", data.status );
				getRoomAndUserList(
					socket2,
					[ { 
						number: number,
						start: false,
						password: true,
						creater: 'test',
						people: 1,
						isLogin: false 
					}],
					[ { number: number, state: 'room', name: 'test', isLogin: false },
					   { number: null, state: 'lobby', name: 'test2', isLogin: false },
					   { number: null, state: 'lobby', name: 'test3', isLogin: false },
					   { number: null, state: 'lobby', name: 'test4', isLogin: false },
					   { number: null, state: 'lobby', name: 'test5', isLogin: false } 
					],
					done
				) ;
			})

		});
    });
	
    describe('test2加入房間', function() {
		it('檢查userList和roomList資料', function(done) {
			socket2.emit("join",{
				number : number 
			});
			socket2.on("join",function(data){
				assert.equal("success", data.status );
			});
			getRoomAndUserList(
				socket3,
				[{ 
					number: number,
					start: false,
					password: true,
					creater: 'test',
					people: 2,
					isLogin: false 
				}],
				[ 
					{ number: number, state: 'room', name: 'test', isLogin: false },
					{ number: number, state: 'room', name: 'test2', isLogin: false },
					{ number: null, state: 'lobby', name: 'test3', isLogin: false },
					{ number: null, state: 'lobby', name: 'test4', isLogin: false },
					{ number: null, state: 'lobby', name: 'test5', isLogin: false } 
				],
				done
			) ;
		});
    });
	
    describe('test6登入 ', function() {
		it('Users取得socketId6不為undefined，且名字為test6', function(done) {
			socket6 = io.connect(url, options);
			socket6.once("connect",function(){
				socket6.emit("setUserName",{
					name : "test6"
				});
				socket6.on("setUserNameResult",function(){
					socketId6 = "/#" + socket6.id ;
					assert.notEqual(undefined, avalon.users.get(socketId6) );
					assert.equal("test6", avalon.users.get(socketId6).get("name") );
					socketMap["test6"] = socket6 ;
					socketList.push(socket6);
					socket6.emit("getRoomList",{});
				});
				getRoomAndUserList(
					socket6,
					[{ 
						number: number,
						start: false,
						password: true,
						creater: 'test',
						people: 2,
						isLogin: false 
					}],
					[ 
						{ number: number, state: 'room', name: 'test', isLogin: false },
						{ number: number, state: 'room', name: 'test2', isLogin: false },
						{ number: null, state: 'lobby', name: 'test3', isLogin: false },
						{ number: null, state: 'lobby', name: 'test4', isLogin: false },
						{ number: null, state: 'lobby', name: 'test5', isLogin: false } ,
						{ number: null, state: 'lobby', name: 'test6', isLogin: false } 
					],
					done
				) ;

			});
		});
    });
	
    describe('test3加入房間', function() {
		it('檢查userList和roomList資料', function(done) {
			socket3.emit("join",{
				number : number 
			});
			socket3.on("join",function(data){
				assert.equal("success", data.status );
			});
			getRoomAndUserList(
				socket6,
				[{ 
					number: number,
					start: false,
					password: true,
					creater: 'test',
					people: 3,
					isLogin: false 
				}],
				[ 
					{ number: number, state: 'room', name: 'test', isLogin: false },
					{ number: number, state: 'room', name: 'test2', isLogin: false },
					{ number: number, state: 'room', name: 'test3', isLogin: false },
					{ number: null, state: 'lobby', name: 'test4', isLogin: false },
					{ number: null, state: 'lobby', name: 'test5', isLogin: false } ,
					{ number: null, state: 'lobby', name: 'test6', isLogin: false } 
				],
				done
			) ;
		});
    });
	
    describe('test4加入房間', function() {
		it('檢查userList和roomList資料', function(done) {
			socket4.emit("join",{
				number : number 
			});
			socket4.on("join",function(data){
				assert.equal("success", data.status );
			});
			getRoomAndUserList(
				socket6,
				[{ 
					number: number,
					start: false,
					password: true,
					creater: 'test',
					people: 4,
					isLogin: false 
				}],
				[ 
					{ number: number, state: 'room', name: 'test', isLogin: false },
					{ number: number, state: 'room', name: 'test2', isLogin: false },
					{ number: number, state: 'room', name: 'test3', isLogin: false },
					{ number: number, state: 'room', name: 'test4', isLogin: false },
					{ number: null, state: 'lobby', name: 'test5', isLogin: false } ,
					{ number: null, state: 'lobby', name: 'test6', isLogin: false } 
				],
				done
			) ;
		});
    });
	
    describe('test5加入房間', function() {
		it('檢查userList和roomList資料', function(done) {
			socket5.emit("join",{
				number : number 
			});
			socket5.on("join",function(data){
				assert.equal("success", data.status );
			});
			getRoomAndUserList(
				socket6,
				[{ 
					number: number,
					start: false,
					password: true,
					creater: 'test',
					people: 5,
					isLogin: false 
				}],
				[ 
					{ number: number, state: 'room', name: 'test', isLogin: false },
					{ number: number, state: 'room', name: 'test2', isLogin: false },
					{ number: number, state: 'room', name: 'test3', isLogin: false },
					{ number: number, state: 'room', name: 'test4', isLogin: false },
					{ number: number, state: 'room', name: 'test5', isLogin: false } ,
					{ number: null, state: 'lobby', name: 'test6', isLogin: false } 
				],
				done
			) ;
		});
    });
	
    describe('將好人更換成派西', function() {
		it('檢查role資料', function(done) {
			socket.emit("role",{
				oldRole : "好人" ,
				newRole : "派西維爾"
			});
			socket.on("console",function(data){
				assert.deepEqual(data,{ console: '室長將 好人 替換成 派西維爾', notify: true });
				socket.off("console");
			});
			socket.on("role",function(data){
				assert.deepEqual(data,{ 
					role: [ '梅林', '派西維爾', '好人', '刺客', '壞人' ],
					  oldRole: '好人',
					  create: true 
				})
				socket.off("role");
				done();
			});
		});
    });

	describe('將壞人更換成莫甘', function() {
		it('檢查role資料', function(done) {
			socket.emit("role",{
				oldRole : "壞人" ,
				newRole : "莫甘娜"
			});
			socket.on("console",function(data){
				assert.deepEqual(data,{ console: '室長將 壞人 替換成 莫甘娜', notify: true });
				socket.off("console");
			});
			socket.on("role",function(data){
				assert.deepEqual(data,{ 
					role: [ '梅林', '派西維爾', '好人', '刺客', '莫甘娜' ],
					oldRole: '壞人',
					create: true 
				})
				socket.off("role");
				done();
			});			

		});
    });

	var setAllSocketEmit = function(key,data){
		for ( var i = 0 ; i < socketList.length ; i ++ ){
			socketList[i].emit(key,data);
		}
	}
	
	var setAllSocketEvent = function(key,fun){
		for ( var i = 0 ; i < socketList.length ; i ++ ){
			socketList[i].on(key,fun);
		}
	}
	
	var removeAllSocketEvent = function(key){
			for ( var i = 0 ; i < socketList.length ; i ++ ){
			socketList[i].off(key);
		}
	}
	
	describe('開始遊戲及隊長選人', function() {
		it('檢查資料', function(done) {
			socket.emit("start",{});
			socket.on("start",function(data){
				if ( data.role === "壞人" || data.role === "莫德雷德" || data.role === "莫甘娜" || data.role === "刺客" || data.role === "梅林"  || data.role === "奧伯倫" ){
					assert.notEqual(data.bArray,undefined);
				} else if ( data.role === "派西維爾" ){
					assert.notEqual(data.mArray,undefined);
				}
				assert.equal(data.round,1);
				assert.equal(data.vote,1);
				assert.equal(data.amount,2);
				assert.deepEqual(data.missionResultList,[]);
				removeAllSocketEvent("captain");
				done();

			});
			setAllSocketEvent("captain",function(data){
				assert.equal(data.amount,2);
			})
		});
    });
	
	describe('隊長選人且等待投票', function() {
		it('檢查資料', function(done) {
			socket.emit("start",{});
			setAllSocketEmit("captain",{
				players : [0,1]
			})
			socket.on("chooseUser",function(data){
				console.log(data);
			})
		});
    });

});
