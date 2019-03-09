// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
// const { app, BrowserWindow } = require('electron');
const dgram = require('dgram');
const events = require('events');
const fs = require('fs');


const createCSVWriter = require('csv-writer').createObjectCsvWriter;
var csvTimeWriter, csvFFTWriters;

//Will determine if collecting and sending to file currently.
//Other values will only be updated if collecting is true!
var collecting = false;
var duration = 0;
var direction = "none";
var active = [];
var loop = false;

var collectQueue = [];

var titlebar = require('titlebar');

var t = titlebar();
t.appendTo(document.body);

t.on('close', function(e) {
	console.log('close');
});

// t.element exposes the root dom element
t.element.appendChild(document.createElement('div'));

// Clean up after usage
t.destroy();




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

/* initialize fftSamples to a list of headers for each channel */
const fftSamplesHeaders = [];
for (i=0; i<8; i++) {
  fftSamplesHeaders.push([fftHeaderToWrite]);
}
var fftSamples = fftSamplesHeaders;

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
                   date.getMinutes() + '-' + date.getSeconds();

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
         fftSamplesToPush[i]['f' + (j+1)] = channelData[i][j];
      }
    }
    for (i=0; i<8; i++) {
      fftSamples[i].push(fftSamplesToPush[i]);
    }
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
function endTest(saved, changeTest){
  if(saved){
    if(changeTest){
      settings['testNumber'] += 1;
      let settingsString = JSON.stringify(settings);
      fs.writeFile('data_settings.json', settingsString, 'utf8', function(err){
        if (err) throw err;
        console.log('Updated Test Number!');
        testNumber = settings['testNumber'];
      });
    }



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
  fftSamples = fftSamplesHeaders;
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


  let toWrite = {'time': time, 'data': data['data']};
  if (data['type'] == 'fft') {
    if (collecting) {
      appendSample(toWrite, type="fft"); // write to file
    }

    // console.log({'time': time, 'eeg': data}); // send socket to client
  }
  else {
    if (collecting) {
      appendSample(toWrite, type="time");
    }
		client.events.emit('timeseries', {'time': time, 'eeg': data})
		// client.events.emit('timeseries', {'time': time, 'eeg': data})

      // console.log({'time': time, 'eeg': data}); // send socket to client
  }
});
//GRAPHING!
function getTimeValue() {
	var dateBuffer = new Date();
	var Time = dateBuffer.getTime();
	return Time;
}

var charts = [], lines = [];
var colors = ["#6dbe3d","#c3a323","#EB9486","#787F9A","#97A7B3","#9F7E69","#d97127", "#259188"]

for(i = 0; i < 8; i++) {
	charts.push(new SmoothieChart({millisPerPixel: 15, grid:{fillStyle:'transparent'},
																 labels:{fillStyle:'transparent'},
																 maxValue: 400,
																 minValue: -400}));
	charts[i].streamTo(document.getElementById('smoothie-chart-' + (i+1)), 1000);
	lines.push(new TimeSeries());
}
//
// let timeElapsed = new Date().getTime()

let counter = 1;



client.events.on('timeseries', function(timeseries) {
		for(i = 0; i < 8; i++){
			lines[i].append(timeseries['time'], timeseries['eeg']['data'][i]);
		}
	// console.log(channelOne.data);


	// if (counter == 10) {
		// let newData = (new Date().getTime(), timeseries['eeg']['data'][0]);
		// console.log(timeseries['eeg']['data'][0])
		// console.log(counter)
			// counter = 0;
	// } else {
			// ends with 0
			// counter++;
	// }
	// console.log(timeseries['eeg']['data'][0]);

	// console.log(channelOne.data + " and time: " + getTimeValue());
	// sensorChart1.push(newData);
});

setInterval(function(){
for(i = 0; i < 8; i++){
	charts[i].addTimeSeries(lines[i], {lineWidth:3,
																		 strokeStyle:colors[i]});
	timeElapsed = new Date().getTime();
	lines[i] = new TimeSeries();
}
}, 1000);





// let win;
// function createWindow () {
//   // Create the browser window.
//   win = new BrowserWindow({ width: 1000, height: 600 });
//
//   // and load the index.html of the app.
//   win.loadFile('public/index.html');
//   win.webContents.openDevTools()
// }
//
// app.on('ready', createWindow);
