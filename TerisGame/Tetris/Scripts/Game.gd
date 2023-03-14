extends Node2D


# Declare member variables here. Examples:
# var a = 2
# var b = "text"
var block_scene = load("res://Scenes/Block.tscn")
onready var static_body = get_node("StaticBody2D/BlockContainer")

## UI
var holder_instance:KinematicBody2D
var nextHolder_instance:KinematicBody2D
onready var CurrentHolder_Node : Control = $GameContainer/LeftPlayer/Holder
var next_block_id :Array 
var remote_block_id:Array
var last_remote_id= 0
onready var _remote_holder = $GameContainer/RightPlayer/Holder
var _remote_instance 
##
var remote_instance:KinematicBody2D
##
var block_instance:KinematicBody2D
var block_start = 301
var step=35
var numbers = []
var game_over = false
var all_blocks = []
var current_block_type
var block_count = 0
###################################
var login_result: LoginResult
var randomNumberGenerator = RandomNumberGenerator.new()
var all_block_scenes = [
	load("res://Scenes/Block.tscn"),
	load("res://Scenes/BlockI.tscn"),
	load("res://Scenes/BlockL.tscn"),
	load("res://Scenes/BlockO2.tscn"),
	load("res://Scenes/BlockT.tscn"),
	load("res://Scenes/BlockZ.tscn")
	]
var rng = RandomNumberGenerator.new()
## Net
var gameState = {
	"next_block_id":next_block_id,
	"all_block": all_blocks,
	"current_block_type":current_block_type
}
func _ready():
	NetworkManager.connect("UpdateGameState",self,"GameStateHandle")
	$TopMenu/PlayerStatsLeft/NameLB.text = NetworkManager.playerName
	$TopMenu/PlayerStatsRight/NameLB.text = NetworkManager.OpName
	random_next_block()
#	# _getTitleData()
#	var start = 337
#	var end = 661
#	#var end = 1480
#	var step = 18
#	var random_position = randi() % 11
#	if(random_position % 2 != 0):
#		random_position += 1 
#	for i in range(start, end + 1, step):
#		numbers.append(i)
#	next_block_id = randi() % all_block_scenes.size()
	for i in range(0,4):
		next_block_id.append(rng.randi() % all_block_scenes.size())

	block_instance = all_block_scenes[next_block_id[0]].instance()
	all_blocks.append([next_block_id[0],0,0,block_count ]) # 0 = block type , 1 = x,2=y, 3 id
	holder_instance = all_block_scenes[next_block_id[0]].instance()
	current_block_type = next_block_id[0]
#	random_position = randi() % 11
#	if(random_position % 2 != 0):
#		random_position += 1 
	CurrentHolder_Node.add_child(holder_instance)
	
	block_instance.position = Vector2(410, block_start)
	block_instance.is_holder = false
	block_instance.is_remote = false
	block_instance.name	 = str(block_count)
	static_body.add_child(block_instance)
	
	next_block_id.pop_front()
	block_count += 1
	random_next_block()
	update_next_holder()
		
func _process(delta):
#	print(_check_block_y(block_instance))
	if !all_blocks.empty():
		all_blocks[all_blocks.size()-1][1]  = block_instance.position.x
		all_blocks[all_blocks.size()-1][2]  = block_instance.position.y
	gameState = {
	"next_block_id":next_block_id,
	"all_block": all_blocks,
	"current_block_type":current_block_type
	}
	NetworkManager.SendGameState(gameState)
	block_handle()
	pass
func GameStateHandle(_gameState):
	for i in _gameState["all_block"].size():
		if!$StaticBody2D2/RemoteContainer.has_node(str(_gameState["all_block"][i][3])) :
			remote_instance = all_block_scenes[_gameState["all_block"][i][0]].instance()
			remote_instance.name = str(_gameState["all_block"][i][3])
			$StaticBody2D2/RemoteContainer.add_child(remote_instance)
		var _block:KinematicBody2D = $StaticBody2D2/RemoteContainer.get_node(str(_gameState["all_block"][i][3]))
		if (_block == null): continue
		_block.position = Vector2(_gameState["all_block"][i][1],_gameState["all_block"][i][2])
	if _gameState["next_block_id"] != remote_block_id:
		
		remote_block_id = _gameState["next_block_id"]
		# current holder
		if _remote_holder.get_child_count() > 0 && _remote_holder.get_child(0).name != str(_gameState.current_block_type)  : 
			_remote_holder.get_child(0).queue_free()
			_remote_instance =  all_block_scenes[_gameState.current_block_type].instance()
			_remote_instance.name = str(_gameState.current_block_type)
			_remote_holder.add_child(_remote_instance)
			
		if _remote_holder.get_child_count() <= 0:
			_remote_instance =  all_block_scenes[_gameState.current_block_type].instance()
			_remote_instance.name = str(_gameState.current_block_type)
			_remote_holder.add_child(_remote_instance)
			
		update_remote_next_holder()
	pass
func update_next_holder():
	for i in next_block_id.size():
		var holder_node = get_node("GameContainer/LeftPlayer/NextHolder"+str(i))
		for c in holder_node.get_children():
			c.queue_free()
	for i in next_block_id.size():
		var holder_node = get_node("GameContainer/LeftPlayer/NextHolder"+str(i))
		holder_node.add_child(all_block_scenes[next_block_id[i]].instance())
	
func update_remote_next_holder():
	for i in remote_block_id.size():
		var holder_node = get_node("GameContainer/RightPlayer/NextHolder"+str(i))
		for c in holder_node.get_children():
			c.queue_free()
	for i in remote_block_id.size():
		var holder_node = get_node("GameContainer/RightPlayer/NextHolder"+str(i))
		holder_node.add_child(all_block_scenes[remote_block_id[i]].instance())
	
	pass
func block_handle():
	if (block_instance and  block_instance._collide() and _check_block_y(block_instance) ):
		block_instance._disable()
		print('lool')
		game_over = true
		
	if (block_instance and block_instance._collide() and  !game_over):
		
#		var random_position = randi() % 6
		block_instance._disable()
#		if(random_position % 2 != 0):
#			random_position += 1 
		
		block_instance = all_block_scenes[next_block_id[0]].instance()
		current_block_type = next_block_id[0]
		all_blocks.append([next_block_id[0],0,0,block_count ]) # 0 = block type , 1 = x,2=y, 3 id
		holder_instance = all_block_scenes[next_block_id[0]].instance()
		block_instance.name = str(block_count)
		block_instance.is_holder = false
		block_instance.is_remote = false
		random_next_block()
		nextHolder_instance = all_block_scenes[next_block_id[0]].instance()
		block_instance.position = Vector2(410, block_start)
		
		if CurrentHolder_Node.get_child_count() > 0: CurrentHolder_Node.get_child(0).queue_free()
		CurrentHolder_Node.add_child(holder_instance)
		
		static_body.add_child(block_instance)
		next_block_id.pop_front()
		random_next_block()
		block_count += 1
		update_next_holder()
func _check_block_y(block_instance):
	return block_instance.position.y >= block_start-10 and  block_instance.position.y <= block_start +30

func random_next_block():
	rng.randomize()
	if next_block_id.size() < 4:
		next_block_id.append(rng.randi() % all_block_scenes.size())
		
func _getTitleData():
	var request_data = GetTitleDataRequest.new()
	#request_data.Keys.append("BarKey")	# Would only get the key "BarKey"
	PlayFabManager.client.get_title_data(request_data, funcref(self, "_on_get_title_data"))
	
func _on_get_title_data(response):
	$TopMenu/PlayerStatsLeft/Label.text = login_result.InfoResultPayload.AccountInfo.TitleInfo.DisplayName

func _on_PlayFab_api_error(error: ApiErrorWrapper):
	print_debug(error.errorMessage)
