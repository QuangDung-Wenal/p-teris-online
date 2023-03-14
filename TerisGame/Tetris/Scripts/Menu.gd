extends Node


# Declare member variables here. Examples:
# var a = 2
# var b = "text"


# Called when the node enters the scene tree for the first time.
func _ready():
	NetworkManager.connect("ChangeScene",self,"CS")
	pass # Replace with function body.
func CS():
	print("Change")
	get_tree().change_scene("res://Scenes/Game.tscn")

# Called every frame. 'delta' is the elapsed time since the previous frame.
#func _process(delta):
#	pass


func _on_Play_pressed():
	
	NetworkManager.Matchmaking()
	pass # Replace with function body.
