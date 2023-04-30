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

  server.on('connection',async(server) => {
	console.log("Client connected")
	server["room"] = ""
	server["customRoom"] = ""
	server["uid"] =  generator.uuid();
	list_players.push(server)

    server.on('message',  async(message) => {


		
		var data = JSON.parse(message);
       
		if (data.id != 3) console.log(data)
		switch (data.id) {
			case 2:
				if (list_queue.includes(server)) return;
				list_queue.push(server)
				console.log(list_queue.length)
				if (list_queue.length >= 2 ) {
					// make room
					let _roomName = list_queue[0].username + " vs " + list_queue[1].username + " Room"
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
					"opp":next_p2
					}));

					
					list_queue[1].send(JSON.stringify({"id":2,"playerTh":2,
					"OpName":list_queue[0].display_name,
					"seed":seed,
					"myp":next_p2,
					"opp":next_p1
					
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
								"winner":winner
							}));
							listGameActive.get(server.room).get("player2").playerID.send(JSON.stringify({
								"id":8,
								"winner":winner
							}));
							listGameActive.get(server.room).get("player1").playerID.room = ""
							listGameActive.get(server.room).get("player2").playerID.room = ""
							listGameActive.delete(server.room);
						} else {
							listGameActive.delete(seed)
						}
					

					  }, 210 * 1000); // Convert duration from seconds to milliseconds
					
				

				}
				break;
			case 3://game state
				// game state
				if (listGameActive.get(server.room)){

					let player1_name = listGameActive.get(server.room).get("player1").playerID.username
					let player2_name = listGameActive.get(server.room).get("player2").playerID.username

					if (server.username == player1_name){

						listGameActive.get(server.room).get("player2").playerID.send(JSON.stringify(
						{
							"id":3,
						"Data":data.Data,
						"player":1,
						"Com":data.Com,
						"pice":data.np

					}));
					}
						if (server.username == player2_name){
						

						listGameActive.get(server.room).get("player1").playerID.send(JSON.stringify(
						{
							"id":3,
						"Data":data.Data,
						"player":2,
						"Com":data.Com,
						"pice":data.np
						
					}));
					}
				}
				break;
			case 4:// winner
				let s1_name = listGameActive.get(server.room).get("player1").playerID.username
				let s2_name = listGameActive.get(server.room).get("player2").playerID.username

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
				let temp_room = parseInt(server.room)	
				var p1 = listGameActive.get(server.room).get("player1").playerID
				var p2 = listGameActive.get(server.room).get("player2").playerID
				p1.room = ""
				p2.room = ""
				delete listCustomroom[temp_room]
				
				break;
			case 6://login
				      var username_check =data.username
					  var password = data.password
					  let userCheck = await collection.findOne({ username:  username_check.toString() });
					 
					  
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
				      let username = data.username;
					  let user = await collection.findOne({ username: username });

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


					break;
			case 14: // exit while playing 
				if (server.room != "" && listGameActive.get(server.room)){
					if (listGameActive.get(server.room).get("player1").playerID.username == server.username) {
						listGameActive.get(server.room).get("player2").playerID.send(JSON.stringify({
							"id":10,
							"result":"Win"
						}))
						listGameActive.get(server.room).set("finished",true)
						await collection.updateOne({username:listGameActive.get(server.room).get("player2").playerID.username}, {"$inc":{win_match:1}})
						await collection.updateOne({username:listGameActive.get(server.room).get("player1").playerID.username}, {"$inc":{lose_match:1}})
						
					}
					else {
						listGameActive.get(server.room).get("player1").playerID.send(JSON.stringify({
							"id":10,
							"result":"Win"
						}))
						listGameActive.get(server.room).set("finished",true)
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
					}
				break;
			case 16: // messsage in custom room
			if ( listCustomroom[server.customRoom])
				for (p in listCustomroom[server.customRoom].players) { // p = username
					 list_players[p].send(JSON.stringify({
					 	"id":16,
					 	"mess":data.mess,
					 	}))
				}

				break;
			case 17: // create custom room
				let id =  generator.uuid()
				let room_name = server.display_name + " room"
				let players = []
				players.push(server.username)
				server.customRoom = id
				listCustomroom[id] = {
					"players": players,
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
			case 18: // player exit ccustom room
				
				let s = JSON.parse(JSON.stringify(server)) 
				let cusRoom = s.customRoom
				console.log(listCustomroom,cusRoom)
				if (listCustomroom[cusRoom]){
					if (server.username == listCustomroom[cusRoom]["host"]) {
						for (p in listCustomroom[cusRoom].players) { // p = username
							list_players[p].send(JSON.stringify({
								"id":18
								}))
								list_players[p].customRoom = ""
							delete listCustomroom[cusRoom]
					   }
					   
					}
					else {
						
	
						const index = listCustomroom[cusRoom].players.indexOf(server.username);
						if (index !== -1) {
							listCustomroom[cusRoom].players.splice(index, 1);
						 }
						for (p in listCustomroom[server.customRoom].players) { // p = username
							list_players[p].send(JSON.stringify({
								"id":19,
								"players": listCustomroom[cusRoom].players
								}))
								server.customRoom = ""
					   }
					}
				}

				console.log(listCustomroom)
			break;
			case 20: /// player join custom, room
				console.log("Click to join")
				let targetID = data.roomID
				
				if (listCustomroom[targetID] &&listCustomroom[targetID].players.length <= 1) {
					server.customRoom = targetID

					listCustomroom[targetID].players.push(server.username)
					for (p in listCustomroom[targetID].players) { // p = username
						
						for (i in list_players){
							console.log("Checking: ",listCustomroom[targetID].players[p], "|| ", list_players[i].username)
							if (list_players[i].username == listCustomroom[targetID].players[p] ) {
								list_players[i].send(JSON.stringify({
									"id":20,
									"roomID":targetID,
									"host": listCustomroom[targetID].host,
									"players": listCustomroom[targetID].players
									}))
							}
						}
							
				   }
				}
				console.log(listCustomroom[targetID])
			break;
			case 21: // get list custom room
				console.log(listCustomroom)
				server.send(JSON.stringify({
					"id":21,
					"rooms":listCustomroom,

					}))
				
					break;
			case 22: // set game data for custom room
				let s1 = JSON.parse(JSON.stringify(server)) 
				let cusroom = s1.customRoom
					// make room
					for (p in listCustomroom[cusroom].players) { // p = username
						for (i in list_players){
							if (list_players[i].username == listCustomroom[cusroom].players[p] ) {
								list_players[i].room = cusroom
							}
						}
						
		
				   }
				   let player1
				   let player2
				   for (j in list_players) {
					if (list_players[j].username == listCustomroom[cusroom].players[0]) player1 = list_players[j]
					if (list_players[j].username == listCustomroom[cusroom].players[1]) player2 = list_players[j]
				   }
				console.log(player1.username)
				console.log(player2.username)


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
					player1.send(JSON.stringify({"id":22,}));
					player2.send(JSON.stringify({"id":22,}));

					player1.send(JSON.stringify({"id":2,"playerTh":1,
					 "OpName":player2.display_name,
					 "seed":seed,
					 "myp":next_p1,
					 "opp":next_p2
					 }));

					 player2.send(JSON.stringify({"id":2,"playerTh":2,
					 "OpName":player1.display_name,
					 "seed":seed,
					 "myp":next_p2,
					 "opp":next_p1
					
					 }));
	

					
					console.log(player2.display_name,"  Make room")
					
					console.log(listGameActive)
					setTimeout(() => {
						let timeOutRoom = parseInt(seed)
						if (!listGameActive.get(timeOutRoom)) return
						if (listGameActive.get(timeOutRoom).get("finished").value == false) {

						
							var winner = 0
							var p1_point = parseInt(listGameActive.get(timeOutRoom).get("player1").points) 
							var p2_point = parseInt(listGameActive.get(timeOutRoom).get("player2").points) 
							if (p1_point > p2_point) {
								winner = 1
							}
							else if (p2_point > p1_point) {
								winner = 2
							}
							else if (p2_point == p1_point) {
								winner = 0
							}
							listGameActive.get(timeOutRoom).get("player1").playerID.send(JSON.stringify({
								"id":8,
								"winner":winner
							}));
							listGameActive.get(timeOutRoom).get("player2").playerID.send(JSON.stringify({
								"id":8,
								"winner":winner
							}));
							listGameActive.get(timeOutRoom).get("player1").playerID.room = ""
							listGameActive.get(timeOutRoom).get("player2").playerID.room = ""
							listGameActive.delete(timeOutRoom);
						} else {
							listGameActive.delete(seed)
						}
						delete listCustomroom[timeOutRoom]

					  }, 210 * 1000); // Convert duration from seconds to milliseconds
					
			break;
				}

		
    })
    server.on('close', async (reasonCode, description) => {
		// player exit while in custom
		let s = JSON.parse(JSON.stringify(server)) 
		let cusRoom = s.customRoom
	if (listCustomroom[cusRoom]) {
		if (server.username == listCustomroom[cusRoom]["host"]) {
			for (p in listCustomroom[cusRoom].players) { // p = username
				list_players[p].send(JSON.stringify({
					"id":18
					}))
					list_players[p].customRoom = ""
				delete listCustomroom[cusRoom]
		   }
		   
		}
		else {
			

			const index = listCustomroom[cusRoom].players.indexOf(server.username);
			if (index !== -1) {
				listCustomroom[cusRoom].players.splice(index, 1);
			 }
			for (p in listCustomroom[server.customRoom].players) { // p = username
				list_players[p].send(JSON.stringify({
					"id":19,
					"players": listCustomroom[cusRoom].players
					}))
					server.customRoom = ""
		   }
		}
	}

		//
		if (server.room != "" && listGameActive.get(server.room)){
			var room = server.room
			if (listGameActive.get(server.room).get("player1").playerID.username == server.username) {
				listGameActive.get(server.room).get("player2").playerID.send(JSON.stringify({
					"id":10,
					"result":"Win"
				}))
				listGameActive.get(server.room).set("finished",true)
				await collection.updateOne({username:listGameActive.get(server.room).get("player2").playerID.username}, {"$inc":{win_match:1}})
				await collection.updateOne({username:listGameActive.get(server.room).get("player1").playerID.username}, {"$inc":{lose_match:1}})
			
				listGameActive.get(room).get("player2").playerID.room = ""
			}
			else {
				listGameActive.get(server.room).get("player1").playerID.send(JSON.stringify({
					"id":10,
					"result":"Win"
				}))
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
		  const index2 = list_queue.indexOf(server);
		  if (index2 !== -1) {
			 // Remove the element using splice
			 list_queue.splice(index, 1); // The first argument is the index, and the second argument is the number of elements to remove
		   }
    });
})

function getRandomInt(max) {
	return Math.floor(Math.random() * max);
  }