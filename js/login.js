(function(){
	window.fbAsyncInit = function() {

   FB.getLoginStatus(function(response) {
    //FB.api("/me/permissions","delete",function(){});
      //statusChangeCallback(response);
    });

    document.getElementById("facebookButton").addEventListener("click",function(){
      FB.login(function(response) {
          if (response.authResponse) {
           FB.api('/me', function(response) {
            login(response);
           });
          } else {
           console.log('User cancelled login or did not fully authorize.');
          }
      });
    })

	};


})();
