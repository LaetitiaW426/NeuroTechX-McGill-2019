const dgram = require('dgram');
const events = require('events');
const express = require('express');
const app = express();
const server = app.listen(3000);
const io = require('socket.io').listen(server);
const fs = require('fs');


const createCSVWriter = require('csv-writer').createObjectCsvWriter;
var csvTimeWriter;
var csvFFTWriters;

//Will determine if collecting and sending to file currently.
//Other values will only be updated if collecting is true!
var collecting = false;
var duration = 0;
var direction = "none";
var active = [];

const timeHeader = [{id: 'time', title: 'TIME'},
                    {id: 'channel1', title: 'CHANNEL 1'},
                    {id: 'channel2', title: 'CHANNEL 2'},
                    {id: 'channel3', title: 'CHANNEL 3'},
                    {id: 'channel4', title: 'CHANNEL 4'},
                    {id: 'channel5', title: 'CHANNEL 5'},
                    {id: 'channel6', title: 'CHANNEL 6'},
                    {id: 'channel7', title: 'CHANNEL 7'},
                    {id: 'channel8', title: 'CHANNEL 8'}]

const timeHeaderToWrite = {time: 'Time',
                  channel1: 'Channel 1',
                  channel2: 'Channel 2',
                  channel3: 'Channel 3',
                  channel4: 'Channel 4',
                  channel5: 'Channel 5',
                  channel6: 'Channel 6',
                  channel7: 'Channel 7',
                  channel8: 'Channel 8'
                };
var timeSamples = [timeHeaderToWrite];

const fftHeader = [{id: 'time', title: 'TIME'}];
for (i=0; i<125; i++) {
  fftHeader.push({id: 'f' + (i+1), title: (i+1) + 'Hz'})
}

const fftHeaderToWrite = {time: 'Time'};
for (i=0; i<125; i++) {
  fftHeaderToWrite['f' + (i+1)] = (i+1) + 'Hz';
}

var fftSamples = [fftHeaderToWrite];

/* These are manual settings that we can use to keep track of testNumber as an example */
var settings = JSON.parse(fs.readFileSync(__dirname + '/data_settings.json', 'utf8'));
console.log("Currently running on these settings: \n" + settings);
let testNumber = settings['testNumber'];

/* Gets the current time */
function getTimeValue() {
  var dateBuffer = new Date();
  var Time = dateBuffer.getTime();
  return Time;
}

/* Sets the csvwriters to the correct paths! */

function setupCsvWriters(){
    let date = new Date();
    var day = date.getFullYear() + '-' + date.getMonth() + '-' +
                   date.getDate() + '-' + date.getHours() + '-' +
                   date.getMinutes() + '-' + date.getSeconds()

    csvTimeWriter = createCSVWriter({
          path: __dirname + '/data/time-test-' + testNumber + '-' + direction + '-'
                          + day + '.csv',
          header: timeHeader,
          append: true
    });

    csvFFTWriters = [];
    for (i=0; i<8; i++) {
      csvFFTWriters.push(createCSVWriter({
        path: __dirname + '/data/fft-' + (i+1) + '-test-' + testNumber + '-'
                        + direction + '-' + day + '.csv',
        header: fftHeader,
        append: true
      }));
    }
}

function appendSample(data, type){
  /*
  Write samples to CSV file when data is collecting
  */

  channelData = [];
  for (i = 0; i < 8; i++) {
    if (active[i] == 1) {
        channelData[i] = data['data'][i];
    }
    else {
      channelData[i] = null;
    }
  }

  if (type =='fft') {
    let fftSamplesToPush = [];
    for (i=0; i<8; i++) {
      fftSamplesToPush.push({time: data['time']});
      for (j=0; j<125; j++) {
        fftSamplesToPush[i]['f' + (i+1)] = channelData[i][j];
      }
    }
    fftSamples.push(fftSamplesToPush);
  }

  else if (type == 'time') {
    let timeSampleToPush = {time: data['time'],
                    channel1: channelData[0],
                    channel2: channelData[1],
                    channel3: channelData[2],
                    channel4: channelData[3],
                    channel5: channelData[4],
                    channel6: channelData[5],
                    channel7: channelData[6],
                    channel8: channelData[7]
                  }
    timeSamples.push(timeSampleToPush);
  }
}

/* Updates test number on data_settings file */
function endTest(saved){
  if(saved){
    settings['testNumber'] += 1;
    let settingsString = JSON.stringify(settings);

    fs.writeFile('data_settings.json', settingsString, 'utf8', function(err){
      if (err) throw err;
      console.log('Updated Test Number!');
      testNumber = settings['testNumber'];
    });

    // fft writers
    for (i = 0; i < 8; i++) {
      csvFFTWriters[i].writeRecords(fftSamples[i]).then(() => {
        console.log('Added some fft samples');
      });
    }

    // time writer
    csvTimeWriter.writeRecords(timeSamples).then(() => {
      console.log('Added some time samples');
    });
  }
  timeSamples = [timeHeaderToWrite];
  fftSamples = [fftHeaderToWrite];
}

/* Creates a UDP client to listen to the OpenBCI GUI */
function UDPClient(port, host) {
  this.port = port;
  this.host = host;
  this.data = [];
  this.events = new events.EventEmitter();
  this.connection = dgram.createSocket('udp4');
  this.connection.on('listening', this.onListening.bind(this));
  this.connection.on('message', this.onMessage.bind(this));
  this.connection.bind(this.port, this.host);
};

/* Prints listening */
UDPClient.prototype.onListening = function() {
  console.log('Listening for data...');
};

/* On message from OpenBCI UDP, emits an event called sample for further classification */
UDPClient.prototype.onMessage = function(msg) {
  this.events.emit('sample', JSON.parse(msg.toString()));
};

/* Creates UDP Client */
var client = new UDPClient(12345, "127.0.0.1");

client.events.on('sample', function(data) {
  /*
  When sample is received, appends to CSV and pings client.
  Data Format: {
                  'time': time,
                  'eeg': {'data': [0.5,3,-5,40,5,32,8,1]}
                      data[index] is the eeg value at sensor-index
                }
  */
  let time = getTimeValue();


  if (collecting) {
    let toWrite = {'time': time, 'data': data['data']};
    if (data['type'] == 'fft') {
      appendSample(toWrite, type="fft"); // write to file
    }
    else {
      appendSample(toWrite, type="time");
    }
  }
  io.sockets.emit('fft', {'time': time, 'eeg': data}); // send socket to client
  io.sockets.emit('timeseries', {'time': time, 'eeg': data}); // send socket to client

});


//Socket IO:
io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('collect', function(collectsocket){
    /* From the client when a button is clicked a collect message will be sent! */
    /* Will include, duration, direction and visible channels as an array */
    duration = collectsocket['duration'];
    direction = collectsocket['command'];
    active = collectsocket['sensors'];
    setupCsvWriters();
    let timeLeft = duration;
    collecting = true;

    let collectionTimer = setInterval(function(){
        timeLeft--;
        if(timeLeft <= 0){
          collecting = false;
          clearInterval(collectionTimer);
          endTest(true);
        }
    }, 1000);

    socket.on('stop', function(){
      collecting = false;
      clearInterval(collectionTimer);
      endTest(false);
    });

    console.log(collectsocket);
  });
});


//Sets static directory as public
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.send('index');
});


console.log('Listening on Port 3000!')
