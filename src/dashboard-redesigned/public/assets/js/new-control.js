const DEFAULT_TIME_VALUE = 10;

// Wait for document to be ready before doing anything
$(document).ready(function() {
	// Store the time left running the expirement
	// TODO: Move globals into state object
	window.timeLeft = 0;

	// Active graphs (Used for sending information to server)
  	// TODO: Move globals into state object
	let active = [1, 1, 1, 1, 1, 1, 1, 1];

	// Are we collecting data right now?
	// TODO: Move globals into state object
	let collecting = false;

	// enabled bootstrap popovers
  	$('.header .btn-round').popover({
  		template: '<div class="popover sensor-popover" role="tooltip"><div class="arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>',
  		placement: "right",
	    html: true,
	    content: $("#sensor-list").html(),
	    sanitize: false
	}).on('shown.bs.popover', function () {
		// Bind event handlers to every sesnor when sensor
		// popover is created
		$('.sensor-popover input[type="checkbox"]').each(function() {
			let input = $(this).attr("name");
			let index = parseInt(input[input.length - 1], 10) - 1;

			if (active[index]) {
				$(this).prop("checked", true)
			} else {
				$(this).prop("checked", false)
			}

			$(this).change(function() {
				// Whenever a checkbox is clicked hide/show appropriate sensor
				$('#media-sensor' + (index + 1)).toggleClass("hide");

				// Update array of active sensors to include whether this particlar
				// one is active
				if(active[index] === 1) {
			      active[index] = 0;
			    } else {
			      active[index] = 1;
			    }
			});
		});
	});


	// Enable tabbing between different views (e.g. training, neurofeedback, production)
	$('.tab-list .tab').on('click', function() {
		var tab = $(this).data('tab');

		$('.tab-list .tab').removeClass('is-active');
		$(this).addClass('is-active');

		$('#tab-content div').removeClass('is-active');
		$('div[data-content="' + tab + '"]').addClass('is-active');
	});

	// Make sure time inputs (i.e. the slider and the textbox) are
	// bound to the same value
	let timeValue = $('.time-input-range').val();
	$('.time-input-range').on('input', function(){
	  if (!collecting) {
	    timeValue = $(".time-input-range").val();
	    $(".time-input-text").val(timeValue);
	  } else{
	    // If collecting data right now, don't let user change value
	    timeValue = $(".time-input-text").val();
	    $(".time-input-range").val(timeValue);
	  }
	});
  	$(".time-input-text").on('input', function(){
	  if (!collecting) {
	    timeValue = $(".time-input-text").val();
	    $(".time-input-range").val(timeValue);
	  } else{
	    // If collecting data right now, don't let user change value
	    timeValue = $(".time-input-range").val();
	    $(".time-input-text").val(timeValue);
	  }
	});


/* IMPORTANT BLOCK FOR DATA COLLECTION! */
  // If one of the collection buttons are clicked does the following:
  function handleStartButtonClick() {
    if(!collecting) {
      // Find out what duration to run the data collection for
      let duration = $(".time-input-range").val();

      //If the duration is not 0 then does the following:
      if (duration != 0) {
          collecting = true;
          socket.emit("collect", {command: $(".mode-selector").val(), duration: duration, sensors: active});

        // Replace start button with stop button
        stopBtn = $('<a class="btn-round btn-primary btn-stop"><i class="fas fa-ban"></i></a>');
        stopBtn.click(handleStopButtonClick);
        $('.control-group .btn-start').remove();
        $('.control-group').append(stopBtn);

        // Allows the countdown to work ***VERY crude currently, need to fix! ***
        window.timeLeft = duration;

        window.collectionTimer = setInterval(function(){
          window.timeLeft -= 1;
          $('.time-input-text').val(timeLeft);
          $(".time-input-range").val(timeLeft);

          if(window.timeLeft <= 0){
            handleStopButtonClick();
          }
        }, 1000);

      }
    }
}
$(".btn-start").click(handleStartButtonClick);

function handleStopButtonClick() {
    clearInterval(window.collectionTimer);
    window.timeLeft = 0;
    
    // Replace stop button with start button
    startBtn = $('<a class="btn-round btn-primary btn-start"><i class="fas fa-play"></i></a>');
    startBtn.click(handleStartButtonClick);
    $('.control-group .btn-stop').remove();
    $('.control-group').append(startBtn);

    collecting = false;
    $(".time-input-text").val(DEFAULT_TIME_VALUE);
    $(".time-input-range").val(DEFAULT_TIME_VALUE);
}

  //GRAPHING!
  function getTimeValue() {
    var dateBuffer = new Date();
    var Time = dateBuffer.getTime();
    return Time;
  }

  var charts = [], lines = [];
  var colors = ["#6dbe3d","#c3a323","#EB9486","#787F9A","#97A7B3","#9F7E69","#d97127", "#259188"]

  for(i = 0; i < 8; i++) {
    charts.push(new SmoothieChart({grid:{fillStyle:'transparent'},
                                   labels:{fillStyle:'transparent'},
                                   maxValue: 400,
                                   minValue: -400}));
    charts[i].streamTo(document.getElementById('smoothie-chart-' + (i+1)), 1000);
    lines.push(new TimeSeries());
  }
  //
  // let timeElapsed = new Date().getTime()

let counter = 1;



socket.on('timeseries', function(timeseries) {
    if(counter % 20 == 0){
      counter = 1;
    }
    else {
      for(i = 0; i < 8; i++){
        lines[i].append(timeseries['time'], timeseries['eeg']['data'][i]);
      }
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
    charts[i].addTimeSeries(lines[i], {lineWidth:2,
                                       strokeStyle:colors[i]});
    timeElapsed = new Date().getTime();
    lines[i] = new TimeSeries();
  }
}, 1000);



  // setInterval(function() {
  //   line.append(new Date().getTime(), Math.random())
  // }, 100);
  //
  // for(i = 0; i < 8; i++) {
  //   charts.push(new SmoothieChart({grid:{fillStyle:'transparent'},
  //                                  labels:{fillStyle:'transparent'},
  //                                  maxValue: 400,
  //                                  minValue: -400}));
  //   charts[i].streamTo(document.getElementById('smoothie-chart-' + (i+1)), 500);
  //   lines.push(new TimeSeries());
  // }
  //
  // let timeElapsed = new Date().getTime();
  // socket.on('timeseries', function(timeseries) {
  //   for(i = 0; i < 8; i++){
  //     lines[i].append(new Date().getTime(), timeseries['eeg']['data'][i]);
  //   }
  //
  //   if (new Date().getTime() -  timeElapsed > 1000){
  //     for(i = 0; i < 8; i++){
  //       charts[i].addTimeSeries(lines[i], {lineWidth:2,
  //                                          strokeStyle:colors[i]});
  //       timeElapsed = new Date().getTime();
  //       lines[i] = new TimeSeries();
  //     }
  //   }
  // });
  //
  // $('#stop').click(function(){
  //   socket.emit("stop", {});
  //   timeLeft = 0;
  //
  // });

  const layout = {
  title: "Spectrogram",
  xaxis: {
    // dtick: "log_10(2)",
    ticks: "Time [s]",
    // type: "log"
  },
  yaxis: {"ticks": "Frequency [kHz]"}
  }

  var z = [];
  var timeElapsed = new Date().getTime();
  var zTemp = [];
  Plotly.plot('spectrogram', {data: [{z: [], type: 'heatmap', transpose: true}],
                              layout: layout});


  var ctx = document.getElementById('fft-chart-1').getContext('2d');
  var fftLabels = [];
  for(i = 1; i <= 125; i++){
    fftLabels.push(i + " Hz");
  }

  let fftDatasets = [];
  for(i = 0; i < 8; i++){
    fftDatasets.push({
      label: 'Channel ' + (i+1),
      data: [],
      borderColor: colors[i],
      backgroundColor: "rgba(255, 99, 132, 0)"
    });
  }


  var chart = new Chart(ctx, {
      // The type of chart we want to create
      type: 'line',

      // The data for our dataset
      data: {
          datasets: fftDatasets,
          labels: fftLabels
      },

      // Configuration options go here
      options: {
        animation: false,
        events: []
      }
  });

  timeElapsedFft = new Date().getTime();
  timeElapsedSpec = new Date().getTime();

  // socket.on('fft', function(fft) {
  //     //data['data'][i] is the row of all y values from 1hz to 125hz
  //     if(fft['eeg']['data'][0].length == 125 && (new Date().getTime() -  timeElapsedFft > 3000)){
  //         let counter = 0;
  //         chart.data.datasets.forEach((dataset) => {
  //             dataset.data = fft['eeg']['data'][counter];
  //             counter++;
  //         });
  //         chart.update();
  //         timeElapsedFft = new Date().getTime();
  //
  //         currentTime = new Date().getTime();
  //
  //         // console.log(fft['time'] - initialTime);
  //         for (i=0; i<125; i++)
  //         {
  //           zTemp.push(fft['eeg']['data'][0][i]); //0th channel
  //         }
  //         z.push([zTemp]);
  //         zTemp = [];
  //
  //         timeElapsedSpec = currentTime;
  //         Plotly.extendTraces('spectrogram', {
  //           z: z
  //         }, [0])
  //         z = [];
  //     }
  // });
});