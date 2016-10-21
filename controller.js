$(function(){
  $('[data-firebase]').on('change click keyup', function(){
    database.ref($(this).data('firebase')).set($(this).val());
  }).each(function(){
    var field = this;
    database.ref($(this).data('firebase')).on('value', function(snapshot){
      console.log(snapshot);
      $(field).val(snapshot.val());
    });
  });

  switchTo('controller');
})