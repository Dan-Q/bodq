$(function(){
  firebase.auth().signInAnonymously().catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    switchTo('error');
    $('#error-explanation').text('Error #' + errorCode + ': ' + errorMessage);
  }).then(function(user) {
    // User is signed in.
    var isAnonymous = user.isAnonymous;
    var uid = user.uid;
    alert(uid);
  });
});

