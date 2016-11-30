$(function(){
  // random name generator (leans on seedrandom)
  function randomName(seed){
    var p0 = ['Original', 'Real', 'Unforgettable', 'Magical', 'Christmas', 'Best', 'Seasonal', 'Merry', 'Jolly', 'Secret', 'Bright', 'Cold', 'Exhibited', "Library's"];
    var p1 = ['Santa', 'Bodley', 'Rudolf', 'Snowman', 'Tree-Topper', 'Season', 'Mr. Frost', 'Humfrey', 'Chief Elf', 'Krampus', 'Grinch', "Bodley's Librarian", 'Donor', 'Researcher', 'Radcliffe', 'Pembroke', 'Scrooge', 'Dasher', 'Blitzen', 'Prancer', 'Claus', 'St. Nick', 'Wenceslas', 'Frosty', 'Skellington', 'Tiny Tim', 'Marley', 'Kringle', 'Mr. Hanky'];
    var p2 = ['Little', 'Favourite', 'Christmas', 'Friendly', 'Gift-Wrapped', 'Decorated', 'Snow-Covered', 'Wintery', 'Icy', 'First', 'Delightful', 'Fairy', 'Tinselly', 'Special', 'Wonderful', 'Freezing', 'Stuffed', 'Reader Services', 'Red-nosed', 'Best', 'Delicious', 'Roasted', 'Seasonal', 'Yuletide', 'Singing', 'Festive', 'Jolly', 'Gleeful', 'Gingerbread'];
    var p3 = ['Helper', 'Reindeer', 'Elf', 'Librarian', 'Archivist', 'Cataloguer', 'Assistant', 'Tree', 'Turkey', 'Carol', 'Sprouts', 'Mistletoe', 'Wonderland', 'Pterodactyl', 'Sleigh', 'Chimney', 'Tale', 'Fireplace', 'Snowman', 'Nutcracker', 'Toy Soldier', 'Gift-Bringer', 'Bell', 'Star', 'Bauble', 'Ghost of Christmas', 'Snowflake', 'Stocking', 'Workshop', 'Bookworm', 'Conservator', 'Reader', 'Visitor', 'Tour Guide', 'Exhibit', 'Publisher', 'Collection', 'Pudding', 'Stocking', 'Bells', 'Cracker', 'Candy Cane', 'Partridge', 'Turtle Dove', 'Wise Man'];
    var rng = new Math.seedrandom(seed);
    var type = rng();
    if(type <= 0.3){
      return (rng() < 0.5 ? 'The ' : '') + p0[Math.floor(rng()*p0.length)] + ' ' + p1[Math.floor(rng()*p1.length)];
    } else if (type <= 0.55) {
      return p1[Math.floor(rng()*p1.length)] + "'s " + p3[Math.floor(rng()*p3.length)];
    } else if (type <= 0.75) {
      return (rng() < 0.5 ? 'The ' : '') + p0[Math.floor(rng()*p0.length)] + ' ' + p3[Math.floor(rng()*p3.length)];
    } else if (type <= 0.9) {
      return p2[Math.floor(rng()*p2.length)] + ' ' + p3[Math.floor(rng()*p3.length)];
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
    var hasEverAnsweredQuestion = false;
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
          },
          streaking: 'false'
        });
      }

      // ---------- SERVER INTERACTION ---------- //
      // keep-alive
      ref.child('seen-at').set(firebase.database.ServerValue.TIMESTAMP);
      var keepAlive = setInterval(function(){
        ref.child('seen-at').set(firebase.database.ServerValue.TIMESTAMP);
      }, 1000 * 30);
      // watch for subsequent changes
      ref.on('value', function(snapshot){
        var user = snapshot.val();
        if(user === null || typeof(user['name']) === 'undefined'){
          switchTo('error');
          $('#error-explanation').html('Your session timed out. Refresh the page to play again.<br /><br />(Because your score is your <em>longest-streak</em>, you can easily get back onto the scoreboard!)');
          clearInterval(keepAlive);
          return;
        }
        $('.identity').text(user.name);
        $('.streak').text(user.streak);
        $('.best-streak').text(user.bestStreak);
        var lastCorrect = (user.lastCorrect == 'true');
        $('#showing-answer .last-correct').toggle(hasEverAnsweredQuestion && lastCorrect);
        $('#showing-answer .last-incorrect').toggle(hasEverAnsweredQuestion && !lastCorrect);
        if(typeof(user['msg']) !== 'undefined'){
          ref.child('msg').remove();
          alert(user['msg']);
        }
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
      // Showing answer mode change
      database.ref('showing-answer').on('value', function(snapshot){
        showingAnswer = (snapshot.val() == 'true');
        if(showingAnswer){
          $('.play-buttons button').removeClass('selected'); // unselect all buttons
        }
        $('body').toggleClass('showing-answer', showingAnswer);
      });

      // ---------- USER INTERACTION ---------- //
      // answer buttons
      $('.play-buttons button').on('click', function(){
        hasEverAnsweredQuestion = true;
        if($(this).hasClass('selected')){
          $(this).removeClass('selected');
          ref.child('answer').set(null);
          return;
        }
        $('.play-buttons button').removeClass('selected');
        $(this).addClass('selected');
        ref.child('answer').set($(this).data('answer-id'));
      });

      // change name
      $('.change-name').on('click', function(){
        var currentName = $('.identity').first().text();
        var newName = String(prompt('What new name would you like to have?', currentName));
        if(newName == '' || newName == 'null' || newName == currentName) return;
        if(newName.replace(/ /g, '').length < 2) {
          alert('Your new name must be at least 2 characters in length. Change rejected.');
          return;
        }
        ref.child('name').set(newName);
      });
    });
  });
});

