extends KinematicBody2D


export (int) var speed = 4
export (int) var tileSize = 24

var elapsed_time = 0
var result 
var result_down 
var disabled
var is_holder:bool = true
var is_remote:bool = true
func _ready():
	disabled =false
	disabled =false
	disabled =false
		
	pass
	
func _physics_process(delta):
	if (disabled):
		return
	if is_holder: return
	if is_remote: return
	elapsed_time += delta
	if elapsed_time >= 1:
		# Perform desired action
		result_down = move_and_collide(Vector2(0, tileSize))
		elapsed_time = 0
	if Input.is_action_just_released("ui_left"):
		result = move_and_collide(Vector2(-tileSize, 0))
		
	if Input.is_action_just_released("ui_right"):
		result = move_and_collide(Vector2(tileSize, 0))
	if Input.is_action_pressed("ui_down"):
		result_down = move_and_collide(Vector2(0, tileSize))
	if Input.is_action_just_released("ui_up"):
		rotation_degrees += 90

func _collide():
	return result_down

 
func _disable ():
	disabled = true
