"""
NTX 2019 Self-driving wheelchair : Nav.py

@Purpose: create a simple interactive interface to output data 
  for testing the self-driving mechanic.
@Author: Chris Axon
@Date: 3/16/19

@requirements: python arcade > "pip install arcade"

CONTROLS:
  Q - rotate counter-clockwise
  W - go forward
  E - rotate clockwise

  1-9 - load scene (1.txt, 2.txt, etc.) 
  0 - load empty scene
"""
import arcade
import math
# import numpy as np
import os
# from typing import List, Tuple
from arcade import color as color

#initial setup
SCREEN_WIDTH =  800
SCREEN_HEIGHT = 600
SCREEN_TITLE = "Wheelchair nav simulator"
SENSOR_DISTANCE = 100

CHAIR_FORWARD_SPEED = 5.0
CHAIR_ROTATIONAL_SPEED = math.radians(5)# convert degs to rads
# FPS = 60
#updates per second (currently unused)
# UPS = 20


class NavGame(arcade.Window):
  def __init__(self):
    # call super initializer
    super().__init__(SCREEN_WIDTH, SCREEN_HEIGHT, SCREEN_TITLE)
    
    # declare local variables
    self.walls = []
    
    arcade.set_background_color(color.WHITE)

  def on_draw(self):
    arcade.start_render()
    # print(1)
    # Draw each sprite object
    for w in self.walls:
      w.draw()
    self.chair.draw()
    arcade.draw_text(f"CHANCE LEFT: {self.chair.pleft:.2f}", start_y=580, start_x=10, color=color.BLACK)
    arcade.draw_text(f"CHANCE RIGHT: {self.chair.pright:.2f}", start_y=560, start_x=10, color=color.BLACK)
    arcade.draw_text(f"CHANCE FORWARD: {self.chair.pforward:.2f}", start_y=540, start_x=10, color=color.BLACK)
    arcade.draw_text(f"CHANCE STOP: {self.chair.pstop:.2f}", start_y=520, start_x=10, color=color.BLACK)

  def update(self, delta_time):
    # print(2)
    self.chair.update()
    self.chair.sensor_distances = self.chair.scan(self.walls)

  def setup(self):
    # SET UP INITIAL VARIABLES
    print("setting up")
    self.chair = Chair(50,100, -1.5)
    self.walls.append( Wall(100,100,100,300))
    self.walls.append( Wall(150,100,150, 300))
    self.walls.append( Wall(50, 350, 200, 350))

  def on_mouse_press(self, x, y, button, modifiers):
    print(f"Mouse clicked at {x}, {y}")
    # self.sprites.append( Chair(x,y))

  def on_key_press(self, symbol, modifiers):
    if (symbol == arcade.key.W):
      self.chair.set_motion("forward")
    elif (symbol == arcade.key.Q):
      self.chair.set_motion("turn left")
    elif (symbol == arcade.key.E):
      self.chair.set_motion("turn right")
    elif (symbol == arcade.key.KEY_1):
      self.load_file("maps/1.txt")
    elif (symbol == arcade.key.KEY_2):
      self.load_file("maps/2.txt")
    elif (symbol > arcade.key.KEY_3 and 
          symbol < arcade.key.KEY_9):
      print(f"Unsupported file: keycode {symbol}")
    elif (symbol == arcade.key.KEY_0):
      self.walls.clear()


  def on_key_release(self, symbol, modifiers):
    self.chair.set_motion("")

  def test_collisions(self):
    pass

  def load_file(self, filename):
    #fancy path to make sure it works regardless of python dir
    dir_path = os.path.dirname(os.path.realpath(__file__))
    file_path = os.path.join(dir_path, filename)

    # clear existing walls list
    self.walls.clear()

    #load file into memory
    print(f"Loading \"{file_path}\"...")
    with open (file_path) as file:
      content = file.readlines()
    #remove newlines 
    content = [x.strip() for x in content]
    for line in content:
      if len(line) == 0 or line[0] == "#":
        continue #skip empty lines or lines with comments
      elif line[0]=="C":
        # set chair position
        args = [float(i) for i in line[2:].split(',')]
        if (len(args) != 3):
          raise Exception("C: must have 3 args exactly")
        self.chair.set_position(args[0], args[1], args[2])
      elif line[0]=="W":
        # add a wall
        args = [float(i) for i in line[2:].split(',')]
        if (len(args) != 4):
          raise Exception("W: must have 4 args exactly")
        self.walls.append(Wall(args[0],args[1],args[2],args[3]))
      else:
        raise Exception(f"Invalid line {line}")  


class Chair():
  def __init__(self, x=0, y=0, theta=0):
    self.x = float(x)
    self.y = float(y)
    self.theta=float(theta)

    self.pleft = float(0)
    self.pright = float(0)
    self.pforward = float(0)
    self.pstop = float(0)

    # store sensor as a tuple in local coordinaets
    self.sensors = []
    self.sensor_distances = []

    self.sensors.append((0,0,math.radians(30)))
    self.sensors.append((0,0,0))
    self.sensors.append((0,0,math.radians(-30)))

    self.next_motion = ""

  def set_position(self, x, y, theta):
    self.x = float(x)
    self.y = float(y)
    self.theta = float(theta)

  def update(self):
    if self.next_motion == "forward":
      self.x += CHAIR_FORWARD_SPEED*math.cos(self.theta)
      self.y += CHAIR_FORWARD_SPEED*math.sin(self.theta)
    elif self.next_motion == "turn left":
      self.theta = (self.theta + CHAIR_ROTATIONAL_SPEED) % (2*math.pi)
    elif self.next_motion == "turn right":
      self.theta = (self.theta - CHAIR_ROTATIONAL_SPEED) % (2*math.pi)
    elif self.next_motion == "":
      pass
    else:
      print(f"invalid instruction: {self.next_motion}")

    # self.next_motion =""
    
  # def scan_sensors(self):
  def set_motion(self, motion):
    self.next_motion = motion
    
  def draw(self):
    # arcade.draw_rectangle_outline(self.x, self.y, 20, color.BLUE)
    arcade.draw_rectangle_filled(self.x, self.y, 20, 20, 
      color=color.BLUE, tilt_angle=math.degrees(self.theta))

    for i, s in enumerate(self.sensors):
      if i >= len(self.sensor_distances):
        break
      arcade.draw_text(str(i) + ": " + str(int(self.sensor_distances[i])), 
          start_y=580 - 20*i,
          start_x=200,
          color = color.RED
      )
    
    # draw extended line for each sensor
    for i in range(len(self.sensors)):
      x1,y1,theta1 = self.adjust_sensor(i)
      # print(x1,y1,theta1)
      arcade.draw_line(
        x1,y1,
        x1+SENSOR_DISTANCE*math.cos(theta1),
        y1+SENSOR_DISTANCE*math.sin(theta1),
        color=color.PINK,
        line_width=1
      )


  def scan(self, walls):
    """
    Iterate through all sensors and update nearest-value
    Sets up a 2x2 matrix system Ax = b and solves using inverse
    :param walls: a list of walls to test for collision
    :return distance_list: a list of closest distances for each sensor or -1 if no collision.
    :type: list
    """
    distance_list = []

    for i in range(len(self.sensors)):
      # compute world-coords of sensor x, y, theta
      sx,sy,stheta = self.adjust_sensor(i) 
      # nearest = float('Inf')
      a = math.cos(stheta)
      b = math.sin(stheta)
      t_sensor = float('inf') # t sensor >= 0 -> distance from sensor
      # t_wall = 0  # 0 <= twall <= 1 -> interpolated distance along wall

      #test for intersection between each wall and each sensor:
      for wall in walls:
        w = wall.x0 - sx
        z = wall.y0 - sy
        c = -wall.dx
        d = -wall.dy
        if a*d - b*c == 0:
          #matrix is singular and homogenous -> contact is zero
          if (w,z) == (0,0):
            if (
              sx > min(wall.x0, wall.x1) and
              sx < max(wall.x0, wall.x1) and
              sy > min(wall.y0, wall.y1) and
              sy < max(wall.y0, wall.y1) 
              # if sensor lies within wall boundaries then set t_sensor to 0
            ):
              break
            else:
              # sensor, wall are on same line but do not intersect
              continue
            print("singular homo.")
          else:
            print("singular nonhomo")
            #matrix is non-homogeneous, never collides AKA sensor, wall have same slopes
            continue
        # matrix is not singular, solve for t1, t2
        detinv = 1/(a*d - b*c)
        t_sensor_temp = detinv*(w*d - c*z)
        t_wall_temp = detinv*(-w*b + z*a)

        if (
            t_sensor_temp >= 0
            and t_sensor_temp < t_sensor
            and t_wall_temp >= 0
            and t_wall_temp <= 1
        ):
          # if t_w and t_s values are valid (and closer to the snesor) then assign them
          # t_wall = t_wall_temp
          t_sensor = t_sensor_temp
      if (t_sensor == float('Inf')):
        t_sensor = -1
      distance_list.append(t_sensor)
    
    return distance_list
  
  def add_sensor(self, xrel, yrel, theta):
    self.sensors.append((xrel,yrel,theta))
  
  def adjust_sensor(self, index):
    ''' 
    Return x, y, and theta of sensor at index in world coordinates
    '''
    return (
        self.sensors[index][0]+self.x, 
        self.sensors[index][1]+self.y, 
        self.sensors[index][2]+self.theta
        )
  
class Wall():
  '''
  Represents a wall (x0, y0, x1, y1)
  '''
  def __init__(self, x0, y0, x1, y1):
    self.x0 = x0
    self.y0 = y0
    self.x1 = x1
    self.y1 = y1
    # cartesian length
    self.length = math.sqrt((x1-x0)*(x1-x0) + (y1-y0)*(y1-y0))
    if self.length < 0.001:
      raise Exception('Wall should not have zero length')
    self.dx = (x1-x0) #/self.length
    self.dy = (y1-y0) # /self.length

  def draw(self):
    arcade.draw_line(self.x0, self.y0, self.x1, self.y1,
      color=color.BLUE, line_width=3.0)

def main():
  '''
  setup and run game
  '''
  # main method
  game = NavGame()
  game.setup()
  arcade.run()

# standard code to ensure it runs correctly in a module
if __name__=="__main__":
  main()