const WebSocketServer = require("ws").Server;
const server = new WebSocketServer({ port: process.env.PORT || 8080 });

const {MongoClient, ServerApiVersion} = require('mongodb');
const { stringify } = require("querystring");
const UUID = require('uuid-int')
const __id = 0;

const generator = UUID(__id);

const uuid = generator.uuid();
console.log(uuid)
var list_players = []
var list_queue = []
var listGameActive = new Map()
var listPlayerActive = []
var listCustomroom = {}// 
const uri = "mongodb+srv://hqdwendal:dung2004@tetris.h2ofns3.mongodb.net/test?retryWrites=true&w=majority"
const client = new MongoClient(uri);




  const db = client.db("Player");
  const collection = db.collection("players");
  setInterval(() => {
	server.clients.forEach((client) => {
	  client.send(JSON.stringify({
		id:9999
	  }));
	});
  }, 1000);
  server.on('connection',async(server) => {
	console.log("Client connected")
	server["room"] = ""
	server["customRoom"] = ""
	server["uid"] =  generator.uuid();
	list_players.push(server)

    server.on('message',  async(message) => {


		
		var data = JSON.parse(message);
		console.log(server.username + " Log:")
		if (data.id != 3) console.log(data)
		switch (data.id) {
			case 2:
				if (list_queue.includes(server)) return;
				list_queue.push(server)
				console.log(list_queue.length)
				if (list_queue.length >= 2 ) {
					// make room
					var _roomName = list_queue[0].username + " vs " + list_queue[1].username + " Room"
					var seed = generator.uuid();
					var next_p1 = [getRandomInt(6),getRandomInt(5),getRandomInt(6),getRandomInt(5)]
					var next_p2 = [getRandomInt(5),getRandomInt(6),getRandomInt(5),getRandomInt(6)]
					list_queue[0].room = seed
					list_queue[1].room = seed
					var gameStateMap = new Map()
					gameStateMap.set("seed",{
						"value":seed
					})

					gameStateMap.set("finished",{
						"value":false})

					gameStateMap.set("player1",{
						"playerID":list_queue[0],
						"points":0,
						"lines":0,
						"ko":0,
						"username":list_queue[0].username
						
						
					})
					gameStateMap.set("player2",{
						"playerID":list_queue[1],
						"points":0,
						"lines":0,
						"ko":0,
						"username":list_queue[1].username

					})
					
					list_queue[0].send(JSON.stringify({"id":2,"playerTh":1,
					"OpName":list_queue[1].display_name,
					"seed":seed,
					"myp":next_p1,
					"opp":next_p2,
					"custom":"N"
					}));

					
					list_queue[1].send(JSON.stringify({"id":2,"playerTh":2,
					"OpName":list_queue[0].display_name,
					"seed":seed,
					"myp":next_p2,
					"opp":next_p1,
					"custom":"N"
					
					}));
					list_queue.splice(0,list_queue.length);

					listGameActive.set(seed,gameStateMap)
					console.log("Make room")
					
					console.log(listGameActive)
					setTimeout(() => {
						if (!listGameActive.get(seed)) return
						if (listGameActive.get(seed).get("finished").value == false) {

						
							var winner = 0
							var p1_point = parseInt(listGameActive.get(server.room).get("player1").points) 
							var p2_point = parseInt(listGameActive.get(server.room).get("player2").points) 
							if (p1_point > p2_point) {
								winner = 1
							}
							else if (p2_point > p1_point) {
								winner = 2
							}
							else if (p2_point == p1_point) {
								winner = 0
							}
							listGameActive.get(server.room).get("player1").playerID.send(JSON.stringify({
								"id":8,
								"winner":winner,
								"winnerName":""
							}));
							listGameActive.get(server.room).get("player2").playerID.send(JSON.stringify({
								"id":8,
								"winner":winner,
								"winnerName":""
							}));
							var temp_room = parseInt(server.room)	
							var p1 = listGameActive.get(server.room).get("player1").playerID
							var p2 = listGameActive.get(server.room).get("player2").playerID
							p1.room = ""
							p2.room = ""
							listGameActive.get(temp_room).get("player1").playerID.room = ""
							listGameActive.get(temp_room).get("player2").playerID.room = ""
							listGameActive.delete(temp_room);
						} else {
							listGameActive.delete(seed)
						}
					

					  }, 210 * 1000); // Convert duration from seconds to milliseconds
					
				

				}
				break;
			case 3://game state
				// game state
				if (listGameActive.get(server.room)){

					var player1_name = listGameActive.get(server.room).get("player1").playerID.username
					var player2_name = listGameActive.get(server.room).get("player2").playerID.username
					console.log(player1_name == player2_name)
					if (server.username == player1_name){

						listGameActive.get(server.room).get("player2").playerID.send(JSON.stringify(
						{
							"id":3,
						"Data":data.Data,
						"player":server.username,
						"Com":data.Com,
						"pice":data.np

					}));
					}
					else if (server.username == player2_name){
						
						listGameActive.get(server.room).get("player1").playerID.send(JSON.stringify(
						{
							"id":3,
						"Data":data.Data,
						"player":server.username,
						"Com":data.Com,
						"pice":data.np
						
					}));
					}
					if (listCustomroom[server.customRoom])
						SendForSpectators(server.customRoom,{
							"id":25,
						"Data":data.Data,
						"player":server.username,
						"Com":data.Com,
						"pice":data.np

					})
				}
				break;
			case 4:// winner
				var s1_name = listGameActive.get(server.room).get("player1").playerID.username
				var s2_name = listGameActive.get(server.room).get("player2").playerID.username

				if (server.username == s1_name){
					await collection.updateOne({username:listGameActive.get(server.room).get("player2").playerID.username}, {"$inc":{win_match:1}})
					await collection.updateOne({username:listGameActive.get(server.room).get("player1").playerID.username}, {"$inc":{lose_match:1}})

				}// player 1 win
				if (server.username == s2_name){
						await collection.updateOne({username:listGameActive.get(server.room).get("player1").playerID.username}, {"$inc":{win_match:1}})
						await collection.updateOne({username:listGameActive.get(server.room).get("player2").playerID.username}, {"$inc":{lose_match:1}})

				}
				listGameActive.get(server.room).get("player1").playerID.send(JSON.stringify({
					"id":4,
					"res":"End",
					"loser":server.username
				}));
				listGameActive.get(server.room).get("player2").playerID.send(JSON.stringify({
					"id":4,
					"res":"End",
					"loser":server.username
				}));
				listGameActive.get(server.room).set("finished",{
					"value":true
				})
				console.log(listGameActive.get(server.room))
				var temp_room = parseInt(server.room)	
				var p1 = listGameActive.get(server.room).get("player1").playerID
				var p2 = listGameActive.get(server.room).get("player2").playerID
				p1.room = ""
				p2.room = ""
				delete listCustomroom[temp_room]
				
				break;
			case 6://login
				      var username_check =data.username
					  var password = data.password
					  var userCheck = await collection.findOne({ username:  username_check.toString() });
					 
					  
					  if (userCheck && userCheck.password == password) {
						if (listPlayerActive.includes(userCheck.username)) {
							server.send(JSON.stringify({
								"id":6,
							   "res":"Failed",
								"result":"This account is being played"
							}));
							return
						}
						 server.send(JSON.stringify({
							 "id":6,
							 "res":"Success",
							 "username":userCheck.username,
							 "display_name":userCheck.display_name,
							 "result":"Login Success"
						 }));
						 listPlayerActive.push(userCheck.username)
						 server["username"] = userCheck.username
						 server["display_name"] = userCheck.display_name
					  } else if (!userCheck || userCheck.password != password) {

						server.send(JSON.stringify({
							 "id":6,
							"res":"Failed",
							 "result":"Username not exists"
						 }));
					  }
				break;
			case 7:// register
				      var username = data.username;
					  var user = await collection.findOne({ username: username });

					  if (user) {
						server.send(JSON.stringify({
							"id":7,
							"username":data.username,
							"display_name":data.display_name,
							"password":data.password,
							"result":"Sign Up Failed, Username exists"
						}));
					  } else {
						const newPlayer = {"username":data.username,
						"display_name":data.display_name,
						"password":data.password,
						"money":0,
						"win_match":0,
						"lose_match":0,
						"rank":0,
						"avatar_id":0,
						"draw_match":0
						};
						const insertResult = await collection.insertOne(newPlayer);
						server.send(JSON.stringify({
							"id":7,

							"result":"Sign Up Success"
						}));
					  }


					break;
			case 9:// linne and pointn
			if (listGameActive.get(server.room)) {
						if (listGameActive.get(server.room).get("player1").playerID.username == server.username) {
								var last_point = listGameActive.get(server.room).get("player1").points
								var last_line = listGameActive.get(server.room).get("player1").lines
								listGameActive.get(server.room).get("player1").points = last_point + data.points
								listGameActive.get(server.room).get("player1").lines = last_line + data.lines
								server.send(JSON.stringify({
									"id":9,
									"my_points":listGameActive.get(server.room).get("player1").points,
									"my_lines":listGameActive.get(server.room).get("player1").lines,
									"op_points": listGameActive.get(server.room).get("player2").points,
									"op_lines": listGameActive.get(server.room).get("player2").lines,
								}));
								listGameActive.get(server.room).get("player2").playerID.send(JSON.stringify({
									"id":9,
									"my_points":listGameActive.get(server.room).get("player2").points,
									"my_lines":listGameActive.get(server.room).get("player2").lines,
									"op_points": listGameActive.get(server.room).get("player1").points,
									"op_lines": listGameActive.get(server.room).get("player1").lines,
								}));
								console.log( server.username,":",listGameActive.get(server.room).get("player1").points,":",listGameActive.get(server.room).get("player2").points)
						}
						else if (listGameActive.get(server.room).get("player2").playerID.username == server.username) {
							var last_point = listGameActive.get(server.room).get("player2").points
							var last_line = listGameActive.get(server.room).get("player2").lines
							listGameActive.get(server.room).get("player2").points = last_point + data.points
							listGameActive.get(server.room).get("player2").lines = last_line + data.lines

							server.send(JSON.stringify({
								"id":9,
								"my_points":listGameActive.get(server.room).get("player2").points,
								"my_lines":listGameActive.get(server.room).get("player2").lines,
								"op_points": listGameActive.get(server.room).get("player1").points,
								"op_lines": listGameActive.get(server.room).get("player1").lines,
							}));
							listGameActive.get(server.room).get("player1").playerID.send(JSON.stringify({
								"id":9,
								"my_points":listGameActive.get(server.room).get("player1").points,
								"my_lines":listGameActive.get(server.room).get("player1").lines,
								"op_points": listGameActive.get(server.room).get("player2").points,
								"op_lines": listGameActive.get(server.room).get("player2").lines,
							}));
							console.log( server.username,":",listGameActive.get(server.room).get("player2").points,":",listGameActive.get(server.room).get("player1").points)
						}
						if (listCustomroom[server.customRoom])
						SendForSpectators(server.customRoom,{
							"id":27,
							"p1_points":listGameActive.get(server.room).get("player1").points,
							"p1_lines":listGameActive.get(server.room).get("player1").lines,
							"p2_points": listGameActive.get(server.room).get("player2").points,
							"p2_lines": listGameActive.get(server.room).get("player2").lines,

					})
					}

					break;
			case 14: // exit while playing 
				if (server.room != "" && listGameActive.get(server.room)){
					if (listGameActive.get(server.room).get("player1").playerID.username == server.username) {
						listGameActive.get(server.room).get("player2").playerID.send(JSON.stringify({
							"id":10,
							"result":"Win",
							"customResult":listGameActive.get(server.room).get("player2").playerID.display_name
						}))
						listGameActive.get(server.room).set("finished",true)
						if (listCustomroom[server.customRoom])
						SendForSpectators(server.customRoom,{
							"id":10,
							"result":"Win",
							"customResult":listGameActive.get(server.room).get("player2").playerID.display_name
						})
						await collection.updateOne({username:listGameActive.get(server.room).get("player2").playerID.username}, {"$inc":{win_match:1}})
						await collection.updateOne({username:listGameActive.get(server.room).get("player1").playerID.username}, {"$inc":{lose_match:1}})
						
					}
					else {
						listGameActive.get(server.room).get("player1").playerID.send(JSON.stringify({
							"id":10,
							"result":"Win",
							"customResult":listGameActive.get(server.room).get("player2").playerID.display_name
						}))
						listGameActive.get(server.room).set("finished",true)
						if (listCustomroom[server.customRoom])
						SendForSpectators(server.customRoom,{
							"id":10,
							"result":"Win",
							"customResult":listGameActive.get(server.room).get("player1").playerID.display_name
						})
						await collection.updateOne({username:listGameActive.get(server.room).get("player1").playerID.username}, {"$inc":{win_match:1}})
						await collection.updateOne({username:listGameActive.get(server.room).get("player2").playerID.username}, {"$inc":{lose_match:1}})
					}

					var room = server.room
					listGameActive.get(room).get("player1").playerID.room = ""
					listGameActive.get(room).get("player2").playerID.room = ""

					delete listCustomroom[server.customRoom]
					listGameActive.get(room).get("player1").playerID.customRoom = ""
					listGameActive.get(room).get("player2").playerID.customRoom = ""
				}
				break;
			case 15: // message in game
					if (server.room != ""){
						listGameActive.get(server.room).get("player1").playerID.send(JSON.stringify({
						"id":15,
						"mess":data.mess,
						}))
						listGameActive.get(server.room).get("player2").playerID.send(JSON.stringify({
							"id":15,
							"mess":data.mess,
						}))
						if ( listCustomroom[server.customRoom])
						SendForSpectators(server.customRoom,{
							"id":15,
							"mess":data.mess,
							})
					}
				break;
			case 16: // messsage in custom room
			if ( listCustomroom[server.customRoom])
			SendAllInCustomRoom(server.customRoom,{
				"id":16,
				"mess":data.mess,
				})
			

				break;
			case 17: // create custom room
				var id =  generator.uuid()
				var room_name = server.display_name + " room"
				var players = ["",""]
				server.customRoom = id
				players[0] = server.username
				listCustomroom[id] = {
					"players": players,
					"spectators":[],
					"id":id,
					"name":room_name,
					"private":data.private,
					"maxPlayer":data.playerss,
					"timeLimit":data.timeLimit,
					"host":server.username
				}
				server.send(JSON.stringify({
					"id":17,	
					"roomID":id,
					"roomName":room_name,
					"players":players,
					"customRoomTime":data.timeLimit
				}))
			break;
			// case 18: // player exit ccustom room
				
			// 	var s = JSON.parse(JSON.stringify(server)) 
			// 	var cusRoom = s.customRoom
			// 	console.log(listCustomroom,cusRoom)
			// 	if (listCustomroom[cusRoom]){
			// 		if (server.username == listCustomroom[cusRoom]["host"]) {
			// 			for (p in listCustomroom[cusRoom].players) { // p = username
			// 				list_players[p].send(JSON.stringify({
			// 					"id":18
			// 					}))
			// 					list_players[p].customRoom = ""
			// 				delete listCustomroom[cusRoom]
			// 		   }
					   
			// 		}
			// 		else {
						
	
			// 			const index = listCustomroom[cusRoom].players.indexOf(server.username);
			// 			if (index !== -1) {
			// 				listCustomroom[cusRoom].players.splice(index, 1);
			// 			 }
			// 			for (p in listCustomroom[server.customRoom].players) { // p = username
			// 				list_players[p].send(JSON.stringify({
			// 					"id":19,
			// 					"players": listCustomroom[cusRoom].players
			// 					}))
			// 					server.customRoom = ""
			// 		   }
			// 		}
			// 	}

			// 	console.log(listCustomroom)
			// break;
			case 18: ///Leave Custom Room
				console.log("Leave Room")
				var targetID = server.customRoom
				
				if (listCustomroom[targetID] ) {
					SendAllInCustomRoom(targetID,{
						"id":18,
						"spectators": listCustomroom[targetID].spectators,
						"players": listCustomroom[targetID].players,
						"leave_player":server.username
						})
					const index = listCustomroom[targetID].spectators.indexOf(server.username);
					if (index > -1) { // only splice array when item is found
						listCustomroom[targetID].spectators.splice(index, 1); // 2nd parameter means remove one item only
					}
					for (i in listCustomroom[targetID].players) {
						if (listCustomroom[targetID].players[i] == server.username) {
							listCustomroom[targetID].players[i] = ""
						}
					}
					if (server.username ==listCustomroom[targetID].host ) delete listCustomroom[targetID]
					console.log("sent leave room")
				}
				server.customRoom = ""
				
			break;
			case 20: // player join
				console.log("Click to join")
				var targetID = data.roomID
				
				if (listCustomroom[targetID] ) {
					server.customRoom = targetID

					listCustomroom[targetID].spectators.push(server.username)
					SendAllInCustomRoom(targetID,{
						"id":20,
						"roomID":targetID,
						"host": listCustomroom[targetID].host,
						"spectators": listCustomroom[targetID].spectators,
						"players": listCustomroom[targetID].players,
						"join_player":server.username
						})

				}
				break;
			case 21: // get list custom room
				console.log(listCustomroom)
				server.send(JSON.stringify({
					"id":21,
					"rooms":listCustomroom,

					}))
				
					break;
			case 22: // set game data for custom room
				var s1 = JSON.parse(JSON.stringify(server)) 
				var cusroom = s1.customRoom
					// make room
					for (p in listCustomroom[cusroom].players) { // p = username
						for (i in list_players){
							if (list_players[i].username == listCustomroom[cusroom].players[p] ) {
								list_players[i].room = cusroom
							}
						}
						
		
				   }
				   var player1
				   var player2
				   for (j in list_players) {
					if (list_players[j].username == listCustomroom[cusroom].players[0]) player1 = list_players[j]
					if (list_players[j].username == listCustomroom[cusroom].players[1]) player2 = list_players[j]
				   }



					var seed = cusroom
					var next_p1 = [getRandomInt(6),getRandomInt(5),getRandomInt(6),getRandomInt(5)]
					var next_p2 = [getRandomInt(5),getRandomInt(6),getRandomInt(5),getRandomInt(6)]

					var gameStateMap = new Map()
					gameStateMap.set("seed",{
						"value":cusroom
					})

					gameStateMap.set("finished",{
						"value":false})

					gameStateMap.set("player1",{
						"playerID":player1,
						"points":0,
						"lines":0,
						"ko":0,
						"username":player1.username
					});
					gameStateMap.set("player2",{
						"playerID":player2,
						"points":0,
						"lines":0,
						"ko":0,
						"username":player2.username
					}); 
					listGameActive.set(seed,gameStateMap)
					// player1.send(JSON.stringify({"id":22,}));
					// player2.send(JSON.stringify({"id":22,}));
					// SendForSpectators(seed,{"id":22,})
					player1.send(JSON.stringify({"id":2,"playerTh":1,
					 "OpName":player2.display_name,
					 "seed":seed,
					 "myp":next_p1,
					 "opp":next_p2,
					 "custom":"Y"
					 }));

					 player2.send(JSON.stringify({"id":2,"playerTh":2,
					 "OpName":player1.display_name,
					 "seed":seed,
					 "myp":next_p2,
					 "opp":next_p1,
					 "custom":"Y"
					
					 }));
	

					SendForSpectators(seed,{
					"id":26,
				
					"p1_display":player1.display_name,
					"p2_display":player2.display_name,
					"p1_username":player1.username,
					"p2_username":player2.username,
					"seed":seed,
					"p1_pice":next_p1,
					"p2_pice":next_p2
				   
					})
					
					setTimeout(() => {
						var timeOutRoom = parseInt(seed)
						if (!listGameActive.get(timeOutRoom)) return
						if (listGameActive.get(timeOutRoom).get("finished").value == false) {

						
							var winner = 0
							var winner_name = ""
							var p1_point = parseInt(listGameActive.get(timeOutRoom).get("player1").points) 
							var p2_point = parseInt(listGameActive.get(timeOutRoom).get("player2").points) 
							if (p1_point > p2_point) {
								winner = 1 
								winner_name = listGameActive.get(timeOutRoom).get("player1").playerID.display_name 
							}
							else if (p2_point > p1_point) {
								winner = 2
								winner_name = listGameActive.get(timeOutRoom).get("player2").playerID.display_name 
							}
							else if (p2_point == p1_point) {
								winner = 0
								winner_name = "Draw"
							}
							listGameActive.get(timeOutRoom).get("player1").playerID.send(JSON.stringify({
								"id":8,
								"winner":winner
							}));
							listGameActive.get(timeOutRoom).get("player2").playerID.send(JSON.stringify({
								"id":8,
								"winner":winner,
								"winnerName":winner_name
							}));
							SendForSpectators(timeOutRoom,{
								"id":8,
								"winner":winner,
								"winnerName":winner_name
							})
							listGameActive.get(timeOutRoom).get("player1").playerID.room = ""
							listGameActive.get(timeOutRoom).get("player2").playerID.room = ""
							listGameActive.delete(timeOutRoom);
						} else {
							listGameActive.delete(seed)
						}
						delete listCustomroom[timeOutRoom]

					  }, 210 * 1000); // Convert duration from seconds to milliseconds
					
			break;
			case 23: /// KO
					var ko_s1 = listGameActive.get(server.room).get("player1").playerID
					var ko_s2 = listGameActive.get(server.room).get("player2").playerID
					var ko_s1_info = listGameActive.get(server.room).get("player1")
					var ko_s2_info = listGameActive.get(server.room).get("player2")
					if (server.username == ko_s1_info.username) ko_s1_info.ko += 1
					else  ko_s2_info.ko += 1
					console.log(ko_s1_info.ko + "||" + ko_s2_info.ko)
					if (ko_s1_info.ko == 3) {

							ko_s1.send(JSON.stringify({
								"id":4,
								"res":"End",
								"loser":ko_s1.username
							}));
							ko_s2.send(JSON.stringify({
								"id":4,
								"res":"End",
								"loser":ko_s1.username
							}));
							if (listCustomroom[server.customRoom])
							SendForSpectators(server.customRoom,{
								"id":4,
								"res":"End",
								"loser":ko_s1.username
							})
							return
					  }
					  else if (ko_s2_info.ko == 3){
							ko_s1.send(JSON.stringify({
								"id":4,
								"res":"End",
								"loser":ko_s2.username
							}));
							ko_s2.send(JSON.stringify({
								"id":4,
								"res":"End",
								"loser":ko_s2.username
							}));
							if (listCustomroom[server.customRoom])
							SendForSpectators(server.customRoom,{
								"id":4,
								"res":"End",
								"loser":ko_s2.username
							})
							return
					  }
					  ko_s1.send(JSON.stringify({
						"id":23,
						"player":server.username
					  }))
					  ko_s2.send(JSON.stringify({
						"id":23,
						"player":server.username
					  }))
					  if (listCustomroom[server.customRoom])
					  SendForSpectators(server.customRoom,{
						"id":23,
						"player":server.username
					  })
			break;
			case 24: // chhange slot
					  var slot = data.slot;
					  var roomID = data.roomID
					  var room = listCustomroom[roomID]
					  console.log(room.players + ":"+ room.spectators)
					  switch (slot){
						case "A":
							if (room.players[0] != "" || room.players[0] == server.username) {

								console.log("Full Slot A or Already in this Slot")
								return;
							}
							if (room.players[1] == server.username ) room.players[1] = ""
							if (room.spectators.includes(server.username))  room.spectators = RemoveFromArray(room.spectators,server.username)
							room.players[0] = server.username
							SendAllInCustomRoom(roomID,{
								"id":24,
								"user":server.username,
								"from":"S",
								"to":"A",
								"players":room.players,
								"spectators":room.spectators
								})
						break;
						case "B":
							if (room.players[1] != "" || room.players[1] == server.username){
								console.log("Full Slot B or Already in this Slot")
								return;
							}
							room.players[1] = server.username
							if (room.players[0] == server.username ) room.players[0] = ""
							if (room.spectators.includes(server.username))  room.spectators = RemoveFromArray(room.spectators,server.username)
							SendAllInCustomRoom(roomID,{
								"id":24,
								"user":server.username,
								"from":"S",
								"to":"B",
								"players":room.players,
								"spectators":room.spectators
								})
							 
						break;
						case "S":
							if (!room.spectators.includes(server.username)) {

								if (room.players[0] == server.username) room.players[0] = ""
								if (room.players[1] == server.username)  room.players[1] = ""
								room.spectators.push(server.username)
								SendAllInCustomRoom(roomID,{
								"id":24,
								"user":server.username,
								"from":"U",
								"to":"S",
								"players":room.players,
								"spectators":room.spectators
								})

							}
							else {
								console.log("Already in Spectators")
							}

						break;
					  }
			break;

		}

		
    })

    server.on('close', async (reasonCode, description) => {
		// player exit while in custom
		var s = JSON.parse(JSON.stringify(server)) 
		var cusRoom = s.customRoom
		
	if (listCustomroom[cusRoom]) {


		if (server.username == listCustomroom[cusRoom]["host"]) { // IF IS HOST

			
			SendAllInCustomRoom(cusRoom,{
				"id":19
				})
			SetVariableCustomRoom(cusRoom,"customRoom","")
			delete listCustomroom[cusRoom] 
			
		
					
				
				

		   }
		   
	
		else { // IF NOT HOST
			SendAllInCustomRoom(cusRoom,{
				"id":18,
				"spectators":listCustomroom[cusRoom].spectators,
				"players": listCustomroom[cusRoom].players,
				"leave_player":server.username
				})
			
			for (i in listCustomroom[server.customRoom].players) {
				if (listCustomroom[server.customRoom].players[i] == server.username) listCustomroom[server.customRoom].players[i] = ""
				if (listCustomroom[server.customRoom].spectators.includes(server.username))  server.customRoom.spectators = RemoveFromArray(server.customRoom.spectators,server.username)
			}

				server.customRoom =""

		
			}
		}
		// exit while playing
		if (server.room != "" && listGameActive.get(server.room)){
			var room = server.room
			if (listCustomroom[cusRoom]) { // if are inn custom room and is spectator
				if (listCustomroom[cusRoom].spectators.includes(server.username)) {
					const index = listCustomroom[cusRoom].spectators.indexOf(server.username);
					if (index !== -1) {
						listCustomroom[cusRoom].spectators.splice(index, 1); // The first argument is the index, and the second argument is the number of elements to remove
					 }
				}
			}

			if (listGameActive.get(server.room).get("player1").playerID.username == server.username) {
				listGameActive.get(server.room).get("player2").playerID.send(JSON.stringify({
					"id":10,
					"result":"Win",
					"customResult":listGameActive.get(server.room).get("player2").playerID.display_name
				}))
				listGameActive.get(server.room).set("finished",true)
				await collection.updateOne({username:listGameActive.get(server.room).get("player2").playerID.username}, {"$inc":{win_match:1}})
				await collection.updateOne({username:listGameActive.get(server.room).get("player1").playerID.username}, {"$inc":{lose_match:1}})
				if(listCustomroom[room]) SendForSpectators(room,{
					"id":10,
					"result":"Win",
					"customResult":listGameActive.get(server.room).get("player2").playerID.display_name
				})
				listGameActive.get(room).get("player2").playerID.room = ""
			}
			else {
				listGameActive.get(server.room).get("player1").playerID.send(JSON.stringify({
					"id":10,
					"result":"Win",
					"customResult":listGameActive.get(server.room).get("player1").playerID.display_name
				}))
				if(listCustomroom[room]) SendForSpectators(room,{
					"id":10,
					"result":"Win",
					"customResult":listGameActive.get(server.room).get("player1").playerID.display_name
				})
				listGameActive.get(server.room).set("finished",true)
				await collection.updateOne({username:listGameActive.get(server.room).get("player1").playerID.username}, {"$inc":{win_match:1}})
				await collection.updateOne({username:listGameActive.get(server.room).get("player2").playerID.username}, {"$inc":{lose_match:1}})
				listGameActive.get(room).get("player1").playerID.room = ""
			}
		}
		
		 const index = listPlayerActive.indexOf(server.username);
		 if (index !== -1) {
			// Remove the element using splice
			listPlayerActive.splice(index, 1); // The first argument is the index, and the second argument is the number of elements to remove
		  }
		  const index3 = list_players.indexOf(server.username);
		  if (index !== -1) {
			 // Remove the element using splice
			 list_players.splice(index, 1); // The first argument is the index, and the second argument is the number of elements to remove
		   }
		  const index2 = list_queue.indexOf(server);
		  if (index2 !== -1) {
			 // Remove the element using splice
			 list_queue.splice(index, 1); // The first argument is the index, and the second argument is the number of elements to remove
		   }
    });
})
function RemoveFromArray(arr,value){
	if (arr) {
		const index = arr.indexOf(value);
		if (index !== -1) {
		   // Remove the element using splice
		   arr.splice(index, 1); // The first argument is the index, and the second argument is the number of elements to remove
		 }
		return arr;
	}

}
function SetVariableCustomRoom(roomID,key,value){
	for (i in listCustomroom[roomID].spectators) {
		var t = listCustomroom[roomID].spectators[i]
		for (i in list_players){
			if (list_players[i].username == t) {
				var p = list_players[i]
				
				if ( p){
					p[key] = value
				}
			}
		}

	}
	for (i in listCustomroom[roomID].players) {
		var t = listCustomroom[roomID].players[i]
		for (i in list_players){
			if (list_players[i].username == t) {
				var p = list_players[i]
				
				if ( p){
					p[key] = value
				}
			}
		}

	}
}
function SendAllInCustomRoom(roomID,data) {
	for (i in listCustomroom[roomID].spectators) {
		var t = listCustomroom[roomID].spectators[i]
		for (i in list_players){
			if (list_players[i].username == t) {
				var p = list_players[i]
				
				if ( p){
					p.send(JSON.stringify(data))
				}
			}
		}

	}
	for (i in listCustomroom[roomID].players) {
		var t = listCustomroom[roomID].players[i]
		for (i in list_players){
			if (list_players[i].username == t) {
				var p = list_players[i]
				
				if ( p){
					p.send(JSON.stringify(data))
				}
			}
		}

	}
  }

  function SendForSpectators(roomID,data) {
	for (i in listCustomroom[roomID].spectators) {
		var t = listCustomroom[roomID].spectators[i]
		for (i in list_players){
			if (list_players[i].username == t) {
				var p = list_players[i]
				
				if ( p){
					p.send(JSON.stringify(data))
				}
			}
		}

	}

  }
function getRandomInt(max) {
	return Math.floor(Math.random() * max);
  }