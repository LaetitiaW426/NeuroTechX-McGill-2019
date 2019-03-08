$(document).ready(function() {
  console.log("List javascript loaded!");
  var list = document.getElementById('commandBank');

  //SETS ACTIVE TO ALL OF THEM FOR NOW!
  var active = [1,1,1,1,1,1,1,1];

  //On button click!
  $(".selection").click(function() {
    var clicked = $(this);
    var duration = $(".timer").val();

    if(clicked.is('.direction-left')){
      //Make list item with left and duration!
      $(".addItem").before($("<div class='list-group-item tinted' data-direction='left' data-duration='" + duration + "'><i class='fas fa-arrows-alt handle'></i> Left " + duration + "s</div>"));

    }
    else if(clicked.is('.direction-right')){
      $(".addItem").before($("<div class='list-group-item tinted' data-direction='right' data-duration='" + duration + "'><i class='fas fa-arrows-alt handle'></i> Right " + duration + "s</div>"));

    }
    else if(clicked.is('.direction-rest')){
      $(".addItem").before($("<div class='list-group-item tinted' data-direction='rest' data-duration='" + duration + "'><i class='fas fa-arrows-alt handle'></i> Rest " + duration + "s</div>"));

    }
    else{
      var loop = $("#loop").prop("checked") //returns true or false!
      //Must be collect!
      var queue = [];
      var count = $("#queue div").length;
      console.log(count);

      if(count != 0){ //Non empty list!

        $('#queue').children('div').each(function () {
            var itemDuration = $(this).data("duration");
            var itemDirection = $(this).data("direction")
            queue.push([itemDirection, itemDuration]);
        });

        if(loop){
          queue.push(["loop", 0]);
        }

        //Finally emits a collectQueue!
        socket.emit("collectQueue", {queue: queue, sensors: active});
      }
      else{
        console.log("Empty list nice try!");
      }

    }

  });

});
