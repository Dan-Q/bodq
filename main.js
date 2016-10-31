$(function(){
  firebase.auth().signInAnonymously().catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    switchTo('error');
    $('#error-explanation').text(errorCode + ': ' + errorMessage);
  }).then(function(user) {
    if(!user) return;
    // User is signed in.
    var isAnonymous = user.isAnonymous;
    var uid = user.uid;
    var ref = database.ref('/users/' + uid);
    ref.once('value').then(function(snapshot){
      var user = snapshot.val();
      if(!user){
        // create new user record
        ref.set({
          name: 'Anon-' + uid,
          streak: 0,
          bestStreak: 0,
          lifelines: {
            pass: 0,
            fiftyFifty: 0,
            shield: 0
          }
        });
      }

      // ---------- SERVER INTERACTION ---------- //
      // watch for subsequent changes
      ref.on('value', function(snapshot){
        var user = snapshot.val();
        $('.identity').text(user.name);
      });
      // watch for game state change
      database.ref('state').on('value', function(snapshot){
        var state = snapshot.val();
        switch(state){
          case 'pause':
            switchTo('pause');
            break;
          case 'play':
            switchTo('play');
            break;
        }
      });

      // ---------- SERVER INTERACTION ---------- //
      // answer buttons
      $('.play-buttons button').on('click', function(){
        if($(this).hasClass('selected')){
          $(this).removeClass('selected');
          ref.child('answer').set(null);
          return;
        }
        $('.play-buttons button').removeClass('selected');
        $(this).addClass('selected');
        ref.child('answer').set($(this).data('answer-id'));
      });
    });
  });
});

