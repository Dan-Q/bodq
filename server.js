var QUESTION_DURATION;

var state, qTime, currentQuestion;
var questions = [];
var qDone = [0];

$(function(){
  $('#questions').sheetrock({
    url: 'https://docs.google.com/spreadsheets/d/1w4ERlxdoCrUIYpp0tYjINYA600nBxED0gWlx0UgI7V0/edit?usp=sharing#gid=0'
  });

  /* Load all questions, scrambles the answers, randomises the question order, etc. */
  function loadQuestions(){
    if(questions.length > 0) return; // don't load questions if they're already loaded
    questions = $('#questions tr:not(:first-child)').map(function(){ // first row is header row, ignore
      var vals = $(this).find('td').map(function(){ return $(this).text()} );
      var answers = vals.slice(1,5).toArray();
      var rightAnswer = answers[0];
      shuffle(answers); // randomise the order of the answers
      var rightAnswerPosition = answers.indexOf(rightAnswer); // work out which answer is right for storing
      return { question: vals[0], answers: answers, right: rightAnswerPosition };
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
    // pop next question off the queue and display
    renderCurrentQuestion();
    qTime = QUESTION_DURATION;
    updateCountdownTimer();
  }

  /* Draw current question */
  function renderCurrentQuestion(){
    // TODO: handle markdown etc.
    $('#question').html(currentQuestion.question);
    $('#answer-1').html(currentQuestion.answers[0]);
    $('#answer-2').html(currentQuestion.answers[1]);
    $('#answer-3').html(currentQuestion.answers[2]);
    $('#answer-4').html(currentQuestion.answers[3]);
  }

  /* Draw countdown timer */
  function updateCountdownTimer(){
    var qTimeHuman = Math.ceil(qTime / 100).toString(); // TODO: round up
    var qTimePc = (qTime / QUESTION_DURATION) * 100;
    if(qTime < 300) qTimeHuman = '';
    $('#ticker').width(qTimePc + '%').text(qTimeHuman);
  }

  /* Ticker */
  setInterval(function(){
    if(state == 'play'){
      qTime -= 1;
      updateCountdownTimer();
      if(qTime <= 0) {
        // TODO: answer current question, etc.
        nextQuestion();
      }
    }
  }, 10); // TODO: consider checking "how much time has passed" since last run, rather than assuming it's always running when it should! (will allow bg runs too!)

  /* "Constant" changes */
  database.ref('constants/question-duration').on('value', function(snapshot){
    QUESTION_DURATION = snapshot.val() * 100; // expressed in seconds, stored in hundredths of seconds
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
});
