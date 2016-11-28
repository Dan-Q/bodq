$(function(){
  // random name generator (leans on seedrandom)
  function randomName(seed){
    var p0 = ['Original', 'Real', 'Unforgettable', 'Magical', 'Christmas', 'Best', 'Seasonal', 'Merry', 'Jolly', 'Secret', 'Bright', 'Cold'];
    var p1 = ['Santa', 'Bodley', 'Rudolf', 'Snowman', 'Tree-Topper', 'Season', 'Mr. Frost', 'Duke Humfrey', 'Chief Elf', 'Krampus', 'Grinch', "Bodley's Librarian", 'Donor'];
    var p2 = ['Little', 'Favourite', 'Christmas', 'Friendly', 'Gift-Wrapped', 'Decorated', 'Snow-Covered', 'Wintery', 'Icy', 'First', 'Delightful', 'Fairy', 'Tinselly', 'Special', 'Wonderful', 'Freezing', 'Stuffed', 'Reader Services'];
    var p3 = ['Helper', 'Reindeer', 'Elf', 'Librarian', 'Archivist', 'Cataloguer', 'Assistant', 'Tree', 'Mince Pie', 'Turkey', 'Carol', 'Sprouts', 'Mistletoe', 'Wonderland', 'Pterodactyl', 'Sleigh', 'Chimney', 'Tale', 'Fireplace', 'Snowman', 'Nutcracker', 'Toy Soldier', 'Gift-Bringer', 'Bell', 'Star', 'Bauble', 'Ghost of Christmas Past', 'Snowflake', 'Stocking', 'Workshop', 'Bookworm', 'Conservator', 'Reader'];
    var rng = new Math.seedrandom(seed);
    var type = rng();
    if(type <= 0.2){
      return (rng() < 0.5 ? 'The ' : '') + p0[Math.floor(rng()*p0.length)] + ' ' + p1[Math.floor(rng()*p1.length)];
    } else if (type <= 0.4) {
      return p1[Math.floor(rng()*p1.length)] + "'s " + p3[Math.floor(rng()*p3.length)];
    } else if (type <= 0.6) {
      return (rng() < 0.75 ? 'The ' : '') + p0[Math.floor(rng()*p0.length)] + ' ' + p3[Math.floor(rng()*p3.length)];
    } else {
      return p1[Math.floor(rng()*p1.length)] + "'s " + p2[Math.floor(rng()*p2.length)] + ' ' + p3[Math.floor(rng()*p3.length)];
    }
  }

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
          name: randomName(uid),
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
      // keep-alive
      setInterval(function(){
        ref.child('seen-at').set(firebase.database.ServerValue.TIMESTAMP);
      }, 1000 * 10);
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

      // ---------- USER INTERACTION ---------- //
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

