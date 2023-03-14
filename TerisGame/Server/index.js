var ws = require("ws")
var server = new ws.Server({port:3000})

var list_players = []
var list_queue = []

const gameStateMap = new Map();
server.on('connection',server => {
	console.log("Client connected")
	server["name"] = "Player" + getRandomInt(99999999)
	list_players.push(server)
	server.send(JSON.stringify({"id":1,
	"playerName":server["name"]
	}));
    server.on('message',message => {
        var data = JSON.parse(message);
        console.log(data)

		switch (data.id) {
			case 2:
				if (list_queue.includes(server)) return;
				list_queue.push(server)
				console.log(list_queue.length)
				if (list_queue.length >= 2 ) {
					// make room
					gameStateMap.set("player1",{
						"playerID":list_queue[0],
						
					}
					);
					list_queue[0].send(JSON.stringify({"id":2,"playerTh":1,"OpName":list_queue[1].name}));
					gameStateMap.set("player2",{
						"playerID":list_queue[1],

					}
					);
					list_queue[1].send(JSON.stringify({"id":2,"playerTh":2,"OpName":list_queue[0].name}));
					list_queue.splice(0,list_queue.length);
					console.log("Make room")
					console.log(gameStateMap)
				}
				break;
			case 3:
				// game state
				if (data.player == 1){
					let  id = gameStateMap.get("player2").playerID

					id.send(JSON.stringify(
					{
						"id":3,
					"gameState":data.gameState,

				}));
				}
					if (data.player == 2){
					let  id = gameStateMap.get("player1").playerID

					id.send(JSON.stringify(
					{
						"id":3,
					"gameState":data.gameState,
					
				}));
				}
				break;
			}
		
    })
    server.on('close', (reasonCode, description) => {
        
		
    });
})

function getRandomInt(max) {
	return Math.floor(Math.random() * max);
  }