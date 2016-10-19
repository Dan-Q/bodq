$(function(){
  $('#questions').sheetrock({
    url: 'https://docs.google.com/spreadsheets/d/1w4ERlxdoCrUIYpp0tYjINYA600nBxED0gWlx0UgI7V0/edit?usp=sharing#gid=0'
  });

  database.ref('state').on('value', function(snapshot){
    console.log(snapshot.val());
  });
});
