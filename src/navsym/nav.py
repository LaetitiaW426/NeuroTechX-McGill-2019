"""
NTX 2019 Self-driving wheelchair : Nav.py

@Purpose: create a simple interactive interface to output data 
  for testing the self-driving mechanic.
@Author: Chris Axon
@Date: 3/16/19

@requirements: python arcade > "pip install arcade"
"""

import arcade
import math
import numpy as np
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
    self.sprites = []
    self.walls = []
    
    arcade.set_background_color(color.WHITE)

  def on_draw(self):
    arcade.start_render()
    # print(1)
    # Draw each sprite object
    for w in self.walls:
      w.draw()
    self.chair.draw()
    arcade.draw_text("CHANCE LEFT: 0", start_y=580, start_x=10, color=color.BLACK)
    arcade.draw_text("CHANCE RIGHT: 0", start_y=560, start_x=10, color=color.BLACK)
    arcade.draw_text("CHANCE FORWARD: 0", start_y=540, start_x=10, color=color.BLACK)
    arcade.draw_text("CHANCE STOP: 0", start_y=520, start_x=10, color=color.BLACK)


  def update(self, delta_time):
    # print(2)
    self.chair.update()
    self.chair.scan(self.walls)

  def setup(self):
    # SET UP INITIAL VARIABLES
    print("setting up")
    self.chair = Chair(100,100)
    self.walls.append( Wall(0,0,100,100))


  def on_mouse_press(self, x, y, button, modifiers):
    print(f"Mouse clicked at {x}, {y}")
    # self.sprites.append( Chair(x,y))

  def on_key_press(self, symbol, modifiers):
    if (symbol == arcade.key.W):
      self.chair.set_motion("forward")
    if (symbol == arcade.key.Q):
      self.chair.set_motion("turn left")
    if (symbol == arcade.key.E):
      self.chair.set_motion("turn right")

  def on_key_release(self, symbol, modifiers):
    self.chair.set_motion("")

  def testCollisions():
    pass

class Chair():
  def __init__(self, x=0, y=0, theta=0):
    self.x = float(x)
    self.y = float(y)
    self.theta=theta

    # store sensor as a tuple in local coordinaets
    self.sensors = []
    self.sensor_distances = []

    self.sensors.append((0,0,0))
    self.sensors.append((0,0,math.radians(30)))
    self.sensors.append((0,0,math.radians(-30)))

    self.next_motion = ""

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
      arcade.draw_text(text=f"SENSOR {i}: ({s[0]:.2f}, {s[1]:.2f}, {s[2]:.2f}); DISTNACE: {100: .2f}", 
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
    pass
    # iterate through all sensors
    # for i in range(len(self.sensors)):
      # x1,y1,theta1 = self.adjust_sensor(i)
      # ai = 
      #test for intersection between each wall and each sensor:
      # for w in walls:
        


      # print(x1,y1,theta1)
      

  
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
  def __init__(self, x0, y0, x1, y1):
    self.x0 = x0
    self.y0 = y0
    self.x1 = x1
    self.y1 = y1

  def draw(self):
    arcade.draw_line(self.x0, self.y0, self.x1, self.y1,
      color=color.BLUE, line_width=3.0)
  



def main():
  # main method
  game = NavGame()
  game.setup()
  arcade.run()

if __name__=="__main__":
  main()

