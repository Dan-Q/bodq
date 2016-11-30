var SCORES_LIMIT = 30;
var SWITCH_TIME = 20; // seconds
var HARD_REFRESH_TIME = 5; // minutes

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
    for(var i = 0; i < (scores.length) && (i < SCORES_LIMIT); i++){
      var up = '&nbsp;';
      if(scores[i].streaking == 'true') up = '<img src="up.png" style="height: 32px;" alt="^" />';
      html = html + '<li><div class="pos">' + (i+1) + '.</div><div class="name">' + scores[i].name + '</div> <div class="score">' + scores[i].bestStreak + '</div> <div class="streaking">' + up + '</div></li>';
    }
    hashCode = html.hashCode(); // used to ensure that we only update if changed, without HTML/DOM comparison issues or storing huge strings
    if(scoreboard.data('hashCode') != hashCode) scoreboard.data('hashCode', hashCode).html(html);

    function switchScreen(){
      if($('section#how-to-play').is('.current')){
        switchTo('scoreboard');
      } else {
        switchTo('how-to-play');
      }
    }
    setInterval(switchScreen, 1000 * SWITCH_TIME);
    switchScreen();
  });

  setTimeout(window.location.reload, 1000 * 60 * HARD_REFRESH_TIME)
});
