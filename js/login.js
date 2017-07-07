(function(){
	window.fbAsyncInit = function() {

   FB.getLoginStatus(function(response) {
    //FB.api("/me/permissions","delete",function(){});
      //statusChangeCallback(response);
    });

    document.getElementById("facebookButton").addEventListener("click",function(){
      hide(document.getElementById("loginPage"));
      show(document.getElementById("loginingPage"));
      FB.login(function(response) {
          if (response.authResponse) {
           FB.api('/me', function(response) {
            login(response);
           });
          } else {
            show(document.getElementById("loginPage"));
            hide(document.getElementById("loginingPage"));
          }
      });
    })

	};


})();
