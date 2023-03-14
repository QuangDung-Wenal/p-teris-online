extends Node

signal UpdateGameState(gameState)
signal ChangeScene()

const WS_ADDRESS = "ws://localhost:3000";

var ws_client:WebSocketClient
var playerName = ""
var playerTh= 0
var OpName = ""
func ConnectServer(_name:String = ""):
	ws_client = WebSocketClient.new()
	ws_client.connect("connection_closed", self, "_on_connection_closed")
	ws_client.connect("connection_error", self, "_on_connection_error")
	ws_client.connect("connection_established", self, "_on_connection_established")
	ws_client.connect("data_received", self, "_on_data_received")
	ws_client.connect("server_close_request", self, "_on_server_close_request")
	var err = ws_client.connect_to_url("ws://127.0.0.1:3000")
	print(err)
func _process(delta):
	if ws_client != null : ws_client.poll()
func _on_connection_closed(code):
	print("Connection closed with code:", code)

func _on_connection_error(error):
	print("Connection error:", error)

func _on_connection_established(protocol):
	print("Connection established with protocol:", protocol)

func _on_data_received():
	var payload = JSON.parse(ws_client.get_peer(1).get_packet().get_string_from_utf8()).result
	
	print(payload)
	match int(payload.id):
		1:
			playerName = payload.playerName
			print("Got player name: ",playerName)
		2: # init
			playerTh = payload.playerTh
			OpName = payload.OpName
			emit_signal("ChangeScene")
			print(playerTh)
		3: # update game state
			emit_signal("UpdateGameState",payload.gameState)
func SendGameState(gameState):
	send({
		"id":3,
		"player":playerTh,
		"gameState":gameState
	})
	
func Matchmaking():
	
	send({
		"id":2,
	})
	print("Match Making queueing")
	pass
func send(d:Dictionary):
	ws_client.get_peer(1).put_packet(JSON.print(d).to_utf8())
func _on_server_close_request():
	print("Server requested to close connection")

