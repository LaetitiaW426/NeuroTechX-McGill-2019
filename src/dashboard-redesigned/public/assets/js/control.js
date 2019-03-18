$(document).ready(function() {

  //Used for showcasing other dashboard or training dashboard
  $('#tabs li').on('click', function() {
    var tab = $(this).data('tab');

    $('#tabs li').removeClass('is-active');
    $(this).addClass('is-active');

    $('#tab-content div').removeClass('is-active');
    $('div[data-content="' + tab + '"]').addClass('is-active');
    console.log(tab);

  });
  $('#startProduction').on('click', function(){
    socket.emit("production", {on: true});
  });





  // Enable tabbing between different views (e.g. training, neurofeedback, production)
  $('.tab-list .tab').on('click', function() {
    var tab = $(this).data('tab');

    $('.tab-list .tab').removeClass('is-active');
    $(this).addClass('is-active');

    $('#tab-content div').removeClass('is-active');
    $('div[data-content="' + tab + '"]').addClass('is-active');
  });
})
