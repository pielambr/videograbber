/* eslint-disable */
$(document).ready(function() {
  $('form').submit(submitUrl);
  var socket = io();
  socket.on('processing', function(data) {
    $('#file-processing').show();
  });
  socket.on('processed', function(data) {
    $('#file-processing').hide();
    getFileList();
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
    var tbody = $('#file-list').find('tbody').first();
    tbody.empty();
    if(data.files.length > 0) {
      data.files.forEach(function(file) {
        var tdname = $('<td>').text(file.url)
                              .attr('colspan', 2)
                              .append($('<i>')
                              .addClass('material-icons').text('cloud'));
        var tdsize = $('<td>').text(file.size)
                              .append($('<i>')
                              .addClass('material-icons').text('info'));
        var tdurl = $('<td>').text('Download')
                             .append($('<a>').attr('href', file.download)
                             .prop('download', '').attr('target', '_blank')
                             .append($('<i>').addClass('material-icons')
                             .text('file_download')));
        tbody.append($('<tr>').append(tdname), $('<tr>').append(tdurl, tdsize));
      });
    } else {
      tbody.append($('<tr>').append($('<td>').text('No files found for this session')
           .append($('<i>').addClass('material-icons').text('info'))));
    }
  });
}
