'''
Strageties for reacting to the environment : Strageties.py

This python module contains functions which determine how the wheelchair
reacts to the environment in single frames

@Author: Chris Axon
@Structure:
  Functions taking in sensor tuples and returning a preicitons object

Recall sensor tuple:
  S1, S2, S3 ... where Si is (xlocal, ylocal, rotationlocal)
Recall distance list:
  d1, d2, d3 ... where di is distance from sensor to nearest wall

'''

import math

CHAIR_SIZE = 20 #width of chair, assuming square chair
EXTRA_WIDTH= 5 #extra buffer width to avoid close calls

def set_params(chair_size):
  global CHAIR_SIZE
  CHAIR_SIZE = chair_size
  

def AVOID_FORWARD_WALL(sensors, distance_list):
  print('running')
  # starting point for min distance at infinity
  min_distance = float('inf')
  # if the lists are mismatched (dont know why?) reutrn all zeros
  if (len(sensors) != len(distance_list)):
    print("UNALIGNED SENSORS SHOULD NOT HAPPEN")
    return Predictions.zero()
  # for each sensor, distance pair
  for (sensor, distance) in zip(sensors, distance_list):
    if distance < 0 : 
      continue
    x0,y0,theta = sensor
    # calculate the x,y localtions of collision
    x1 = distance * math.cos(theta) + x0
    y1 = distance * math.sin(theta) + y0
    # the y location must be beyond the front of the chair AND x location must be within chair bounds
    if x1 < CHAIR_SIZE/2 or (y1 < (CHAIR_SIZE/2+EXTRA_WIDTH) and y1 > -(CHAIR_SIZE/2+EXTRA_WIDTH)):
      continue
    else:
      distance_from_chair = distance - (CHAIR_SIZE / 2 - y0)/math.cos(theta)
      if distance_from_chair < min_distance:
        min_distance = distance_from_chair
  if min_distance > 100:
    # beyond 100 distance away -> just ignore it
    print("MIN TOO BIG",min_distance)
    return Predictions.zero()
  else:
    # 100% prediciton for stop at d = 1/2 chair length
    print("PREDICITON VALUE", min(1.0, (CHAIR_SIZE/2)**2 /min_distance**2 ))
    return Predictions.stop(max(1.0, (CHAIR_SIZE/2)**2 /min_distance**2 ))

class Predictions():
  '''
  wrapper class to contain predicitions : left, right, forward, stop
  '''
  def __init__(self, pright, pleft, pforward, pstop):
    self.pleft = pleft
    self.pright = pright
    self.pforward = pforward
    self.pstop = pstop

  @staticmethod
  def zero():
    return Predictions(0,0,0,0)

  @staticmethod
  def stop(pstop):
    return Predictions(0,0,0,float(pstop))
