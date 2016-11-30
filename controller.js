$(function(){
  // firebase data changes
  $('[data-firebase]').on('change click keyup', function(){
    database.ref($(this).data('firebase')).set($(this).val());
  }).each(function(){
    var field = this;
    database.ref($(this).data('firebase')).on('value', function(snapshot){
      $(field).val(snapshot.val());
    });
  });

  // sendable commands
  $('[data-command]').on('click keyup', function(){
    database.ref('command').set($(this).data('command'));
  });

  // switch to main controller view
  switchTo('controller');

  // keep user list up to date
  database.ref('users').on('child_added', function(user){
    var text = (typeof(user.val()['name']) === 'undefined' ? user.key : user.val()['name']);
    $('#user').append('<option value="' + user.key + '">' + text + '</option>')
  });
  database.ref('users').on('child_changed', function(user){
    var text = (typeof(user.val()['name']) === 'undefined' ? user.key : user.val()['name']);
    $('#user [value=' + user.key + ']').text(text);
  });
  database.ref('users').on('child_removed', function(user){
    $('#user [value=' + user.key + ']').remove();
  });

  // purge button
  $('#purge').on('click', function(){
    var cutOff = (new Date).getTime() - (1000 * 60 * 60);
    var toDelete = [];
    database.ref('users').once('value', function(snapshot){
      snapshot.forEach(function(user){
        var seenAt = user.val()['seen-at'];
        var name = user.val()['name'];
        if((typeof(name) === 'undefined') || (typeof(seenAt) === 'undefined') || Number(seenAt) < cutOff){
          toDelete.push(user.key);
        }
      });
      for(var i = 0; i < toDelete.length; i++){
        database.ref('users/' + toDelete[i]).remove();
      }
    });
  });

  // user-affecting buttons
  $('#send-message').on('click', function(){
    var msg = String(prompt('Message:'));
    var recip = $('#user').val();
    if(msg == '' || msg == 'null') return;
    if(recip == 'all'){
      database.ref('users').once('value', function(snapshot){
        snapshot.forEach(function(user){
          database.ref('users/' + user.key + '/msg').set(msg);
        });
      });
    } else {
      database.ref('users/' + recip + '/msg').set(msg);
    }
  });
  $('#change-name').on('click', function(){
    var recip = $('#user').val();
    if(recip == 'all') {
      alert("Can't change name of ALL users.");
      return;
    }
    var name = String(prompt('New name:'));
    database.ref('users/' + recip + '/name').set(name);
  });
  $('#kill').on('click', function(){
    var recip = $('#user').val();
    if(recip == 'all') {
      alert("Can't kill ALL users.");
      return;
    }
    if(!confirm('Really kill?')) return;
    database.ref('users/' + recip).remove();
  });
});
