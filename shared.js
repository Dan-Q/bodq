firebase.initializeApp({
  apiKey: "AIzaSyAUNM0PTTEnssJMYf7Y2bN_cgKy4oHw5bA",
  authDomain: "bodq-95961.firebaseapp.com",
  databaseURL: "https://bodq-95961.firebaseio.com",
  storageBucket: "bodq-95961.appspot.com",
  messagingSenderId: "112908799870",
});

var database = firebase.database();

function switchTo(section){
  $('section').removeClass('current');
  $('section#' + section).addClass('current');
}
