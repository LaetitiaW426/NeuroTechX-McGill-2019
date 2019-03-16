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
from arcade import color as color

#initial setup
SCREEN_WIDTH =  800
SCREEN_HEIGHT = 600
SCREEN_TITLE = "Wheelchair nav simulator"
FPS = 60
#updaes per second
UPS = 20

class NavGame(arcade.Window):
  def __init__(self):
    # call super initializer
    super().__init__(SCREEN_WIDTH, SCREEN_HEIGHT, SCREEN_TITLE)
    
    # declare local variables
    self.shapes = []


    arcade.set_background_color(color.AVOCADO)

  def on_draw(self):
    arcade.start_render()
    arcade.draw_circle_filled(0,0, 10, color.BLACK)
    # print(1)
    # Draw each sprite object

  def update(self, delta_time):
    # print(2)
    pass

  def setup(self):
    # SET UP INITIAL VARIABLES
    print("setting up")

  def on_mouse_press(self, x, y, button, modifiers):
    print(f"Mouse clicked at {x}, {y}")
    self.shapes.append( Shape())

\
def main():
  # main method
  game = NavGame()
  game.setup()
  arcade.run()

if __name__=="__main__":
  main()
