/* eslint-disable */
$(document).ready(function() {
  $('form').submit(submitUrl);
  var socket = io();
  socket.on('processing', function(data) {
    $('#file-processing').show();
  });
  socket.on('processed', function(data) {
    $('#file-processing').hide();
  });
  getFileList();
});

function submitUrl(ev) {
  ev.preventDefault();
  $.post('files/', $('form').serialize(), function() {
    Materialize.toast("We are processing your request!", 3000);
  });
}

function getFileList() {
  $.get('files/', function(data) {
    console.log(data);
  });
}
