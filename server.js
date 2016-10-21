var state, qTime;
var questions = [];
var qDone = [0];

$(function(){
  $('#questions').sheetrock({
    url: 'https://docs.google.com/spreadsheets/d/1w4ERlxdoCrUIYpp0tYjINYA600nBxED0gWlx0UgI7V0/edit?usp=sharing#gid=0'
  });

  /* Load all questions, scrambles the answers, randomises the question order, etc. */
  function loadQuestions(){
    if(questions.length > 0) return; // don't load questions if they're already loaded
    questions =  $('#questions tr:not(:first-child)').map(function(){ // first row is header row, ignore
      var vals = $(this).find('td').map(function(){ return $(this).text()} );
      var answers = vals.slice(1,4);
      var rightAnswer = answers[0];
      shuffle(answers); // randomise the order of the answers
      var rightAnswerPosition = answers.indexOf(rightAnswer); // work out which answer is right for storing
      return { question: vals[0], answers: answers, right: rightAnswerPosition };
    });
    shuffle(questions); // randomise the order of the questions
  }

  /* Next question */
  function nextQuestion(){
    if(questions.length == 0) return; // questions not yet loaded
    var candidateQuestions = [0,1,2,3,4].filter(function(e){return !qDone.includes(e)});
    if(candidateQuestions.length == 0) {
      switchTo('finished');
      return;
    }
  }

  /* Ticker */
  setInterval(function(){
    if(state == 'play'){

    }
  }, 10)

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
