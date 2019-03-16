import socketio
import time
import struct
import numpy as np
import matplotlib.animation as animation
import matplotlib.pyplot as plt
<<<<<<< HEAD
=======
import time
>>>>>>> 438e6f56b6bf49d3cff1849e1324f88d4b025728

sio = socketio.Client()

fig = plt.figure()
plt.yscale('log')
<<<<<<< HEAD
arr = []
specgram = []

@sio.on('fft')
def fft(data):
    fig.clear()
    _time = data['time']
    data = data['eeg']['data'][0] # 0th chanel
    mean = np.mean(data[6:13])
    arr.append(mean)
    if len(arr) > 50:
        arr.pop(0)

    plt.subplot(311)
    plt.ylim(0.1,15)
    plt.bar(0,mean)

    plt.subplot(312)
    plt.ylim(0.1,15)
    plt.plot(arr)

    PSD = np.log10(np.abs(data[:60]) + 1)
    specgram.append(PSD)
    if len(specgram) > 50:
        plt.subplot(313)
        plt.pcolor([i for i in range(len(specgram))],[i for i in range(len(specgram[0]))], np.array(specgram).T)
        specgram.pop(0)
    plt.show()


sio.connect('http://localhost:3000')
sio.wait()
=======
specgram = []
initial_time = time.clock()
temp_data = []


@sio.on('fft')
def fft(data):
    global initial_time
    global temp_data
    time = data['time']
    data = data['eeg']['data'][0][0] # 0th chanel
    # PSD = np.log10(np.abs(data[:60]) + 1)
    temp_data.append(data)
    print('bye')

    if time.clock() - initial_time > 0.5:
        initial_time = time.clock()
        background()

def background():
    print('hi')
    fig.clear()
    plt.plot(temp_data)
    # plt.pcolor([i for i in range(len(specgram))],[i for i in range(len(specgram[0]))], np.array(specgram).T)
    plt.savefig('crazydata-{}.png'.format(initial_time))

sio.connect('http://localhost:3000')
# sio.start_background_task(background)
sio.wait()


# fig = plt.figure()
# plt.yscale('log')
# arr = []
# specgram = []
#
# def animate(args, client_socket, arr, specgram):
#     data = client_socket.recvfrom(1024)
#     fig.clear()
#     data = np.fromstring(data, dtype=np.float, sep=',' )
#     mean = np.mean(data[6:13])
#     arr.append(mean)
#     if len(arr) > 50:
#         arr.pop(0)
#
#     PSD = np.log10(np.abs(data[:60]) + 1)
#     specgram.append(PSD)
#     if len(specgram) > 50:
#         plt.pcolor([i for i in range(len(specgram))],[i for i in range(len(specgram[0]))], np.array(specgram).T)
#         specgram.pop(0)
#
# anim = animation.FuncAnimation(fig, animate, fargs=[client_socket, arr, specgram],interval=200)
# plt.show()
#
#
#
#
#     if len(arr) > 50:
#         arr.pop(0)
#
#     PSD = np.log10(np.abs(data[:60]) + 1)
#     specgram.append(PSD)
#     if len(specgram) > 50:
#         # plt.subplot(313)
#         plt.pcolor([i for i in range(len(specgram))],[i for i in range(len(specgram[0]))], np.array(specgram).T)
#         specgram.pop(0)
#     plt.show()
>>>>>>> 438e6f56b6bf49d3cff1849e1324f88d4b025728
