var QUESTION_DURATION;
var ANSWER_DURATION;
var SCORES_LIMIT;

var state, showingAnswer, qTime, currentQuestion;
var questions = [];
var qDone = [0];

// high-speed string hash based upon http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
String.prototype.hashCode = function() {
  var hash = 0, i, chr, len;
  if (this.length === 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

$(function(){
  $('#questions').sheetrock({
    url: 'https://docs.google.com/spreadsheets/d/1w4ERlxdoCrUIYpp0tYjINYA600nBxED0gWlx0UgI7V0/edit?usp=sharing#gid=0'
  });

  /* Load all questions, scrambles the answers, randomises the question order, etc. */
  function loadQuestions(){
    if(questions.length > 0) return; // don't load questions if they're already loaded
    questions = $('#questions tr:not(:first-child)').map(function(){ // first row is header row, ignore
      var vals = $(this).find('td').map(function(){ return $(this).html()} );
      var answers = vals.slice(1,5).toArray();
      var rightAnswer = answers[0];
      shuffle(answers); // randomise the order of the answers
      var rightAnswerPosition = answers.indexOf(rightAnswer); // work out which answer is right for storing
      return { question: vals[0], answers: answers, right: rightAnswerPosition, flavour: vals[5] };
    }).toArray();
    shuffle(questions); // randomise the order of the questions
  }

  /* Next question */
  function nextQuestion(){
    // sanity check
    if(!(currentQuestion = questions.pop())) {
      database.ref('state').set('pause');
      return;
    }
    // switch off answer mode, if applicable
    database.ref('showing-answer').set('false');
    // pop next question off the queue and display
    renderCurrentQuestion();
    qTime = QUESTION_DURATION;
    updateCountdownTimer();
  }

  /* Draw current question */
  function renderCurrentQuestion(){
    $('#question').html('<p>' + currentQuestion.question + '</p>');
    $('#answer-1').html(currentQuestion.answers[0]);
    $('#answer-2').html(currentQuestion.answers[1]);
    $('#answer-3').html(currentQuestion.answers[2]);
    $('#answer-4').html(currentQuestion.answers[3]);
    $('.answer').removeClass('correct');
    $('#answer-' + (currentQuestion.right + 1)).addClass('correct');
    $('#flavour-text').html(currentQuestion.flavour);
  }

  /* Draw countdown timer */
  function updateCountdownTimer(){
    var qTimeHuman = Math.ceil(qTime / 100).toString();
    var qTimePc = (qTime / QUESTION_DURATION) * 100;
    if(qTime < 300) qTimeHuman = '';
    $('#ticker').width(qTimePc + '%').text(qTimeHuman);
  }

  /* Ticker */
  setInterval(function(){
    if(state == 'play'){
      qTime -= 1;
      updateCountdownTimer();
      if(qTime == 0) {
        // score users based on their current answers
        var rightAnswer = currentQuestion.right + 1;
        database.ref('users').once('value', function(snapshot){
          console.log('right answer = ' + rightAnswer);
          snapshot.forEach(function(user){
            var key = user.key;
            var name = user.val()['name'];
            var answer = user.val()['answer'];
            var streak = user.val()['streak'];
            var bestStreak = user.val()['bestStreak'];
            var streaking = 'false';
            var lastCorrect = 'false';
            if((typeof(answer) !== 'undefined') && (Number(answer) == rightAnswer)){
              // user is correct
              console.log(name + ' is correct (answered ' + answer + ')');
              lastCorrect = 'true';
              streak++;
              if(streak > bestStreak){
                bestStreak = streak;
                streaking = 'true';
              }
            } else {
              // user is incorrect
              console.log(name + ' is wrong (answered ' + answer + ')');
              streak = 0;
            }
            database.ref('users/' + key).update({ answer: null, streak: streak, bestStreak: bestStreak, streaking: streaking, lastCorrect: lastCorrect });
          });
        });
        // switch to showing answer mode
        database.ref('showing-answer').set('true');
      } else if (qTime <= ANSWER_DURATION) {
        nextQuestion();
      }
    }
  }, 10); // TODO: consider checking "how much time has passed" since last run, rather than assuming it's always running when it should! (will allow bg runs too!)

  /* "Constant" changes */
  database.ref('constants/question-duration').on('value', function(snapshot){
    QUESTION_DURATION = snapshot.val() * 100; // expressed in seconds, stored in hundredths of seconds
  });  
  database.ref('constants/answer-duration').on('value', function(snapshot){
    ANSWER_DURATION = -1 * snapshot.val() * 100; // expressed in seconds, stored in negative hundredths of seconds
  });
  database.ref('constants/scores-limit').on('value', function(snapshot){
    SCORES_LIMIT = snapshot.val();
  });

  /* Command changes */
  database.ref('command').on('value', function(snapshot){
    var command = snapshot.val();
    database.ref('command').remove();
    if(typeof(command) === 'undefined') return;
    if(command == 'next-question'){
      nextQuestion();
    }
  });

  /* State change */
  database.ref('state').on('value', function(snapshot){
    state = snapshot.val();
    switch(state){
      case 'pause':
        switchTo('pause');
        break;
      case 'play':
        loadQuestions();
        nextQuestion();
        switchTo('play');
        break;
    }
  });

  /* User (e.g. score) change */
  database.ref('users').on('value', function(snapshot){
    var scores = [];
    var scoreboard = $('#scores');
    snapshot.forEach(function(user){ scores.push(user.val()) });
    scores.sort(function(a, b){
      var diff = Number(b.bestStreak) - Number(a.bestStreak);
      if(diff == 0) diff = Number(b.streak) - Number(a.streak); // tiebreak
      if(diff == 0) diff = (a.name > b.name ? -1 : 1); // second tiebreak
      return(diff);
    });
    html = '';
    for(var i = 0; i < (scores.length) && (i < 10); i++){
      var up = '&nbsp;';
      if(scores[i].streaking == 'true') up = '<img src="up.png" style="height: 32px;" alt="^" />';
      html = html + '<li><div class="pos">' + (i+1) + '.</div><div class="name">' + scores[i].name + '</div> <div class="score">' + scores[i].bestStreak + '</div> <div class="streaking">' + up + '</div></li>';
    }
    hashCode = html.hashCode(); // used to ensure that we only update if changed, without HTML/DOM comparison issues or storing huge strings
    if(scoreboard.data('hashCode') != hashCode) scoreboard.data('hashCode', hashCode).html(html);
  });

  /* Showing answer change */
  database.ref('showing-answer').on('value', function(snapshot){
    showingAnswer = (snapshot.val() == 'true');
    $('body').toggleClass('showing-answer', showingAnswer);
  });
});



















/* Snowfall (from https://codepen.io/loktar00/pen/CHpGo) */
(function() {
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame ||
    function(callback) {
        window.setTimeout(callback, 1000 / 60);
    };
    window.requestAnimationFrame = requestAnimationFrame;
})();


var flakes = [],
    canvas = document.getElementById("snow"),
    ctx = canvas.getContext("2d"),
    flakeCount = 400,
    mX = -100,
    mY = -100

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

function snow() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < flakeCount; i++) {
        var flake = flakes[i],
            x = mX,
            y = mY,
            minDist = 150,
            x2 = flake.x,
            y2 = flake.y;

        var dist = Math.sqrt((x2 - x) * (x2 - x) + (y2 - y) * (y2 - y)),
            dx = x2 - x,
            dy = y2 - y;

        if (dist < minDist) {
            var force = minDist / (dist * dist),
                xcomp = (x - x2) / dist,
                ycomp = (y - y2) / dist,
                deltaV = force / 2;

            flake.velX -= deltaV * xcomp;
            flake.velY -= deltaV * ycomp;

        } else {
            flake.velX *= .98;
            if (flake.velY <= flake.speed) {
                flake.velY = flake.speed
            }
            flake.velX += Math.cos(flake.step += .05) * flake.stepSize;
        }

        ctx.fillStyle = "rgba(255,255,255," + flake.opacity + ")";
        flake.y += flake.velY;
        flake.x += flake.velX;
            
        if (flake.y >= canvas.height || flake.y <= 0) {
            reset(flake);
        }


        if (flake.x >= canvas.width || flake.x <= 0) {
            reset(flake);
        }

        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
        ctx.fill();
    }
    requestAnimationFrame(snow);
};

function reset(flake) {
    flake.x = Math.floor(Math.random() * canvas.width);
    flake.y = 0;
    flake.size = (Math.random() * 3) + 2;
    flake.speed = (Math.random() * 1) + 0.5;
    flake.velY = flake.speed;
    flake.velX = 0;
    flake.opacity = (Math.random() * 0.5) + 0.3;
}

function init() {
    for (var i = 0; i < flakeCount; i++) {
        var x = Math.floor(Math.random() * canvas.width),
            y = Math.floor(Math.random() * canvas.height),
            size = (Math.random() * 3) + 2,
            speed = (Math.random() * 1) + 0.5,
            opacity = (Math.random() * 0.5) + 0.3;

        flakes.push({
            speed: speed,
            velY: speed,
            velX: 0,
            x: x,
            y: y,
            size: size,
            stepSize: (Math.random()) / 30,
            step: 0,
            opacity: opacity
        });
    }

    snow();
};

window.addEventListener("resize",function(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
})

init();