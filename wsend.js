var prompt = require('prompt');
var request = require('request');
var fs = require('fs');
var WSEND_DIR = process.env.HOME+'/.wsend';
var HOST = 'https://wsend.net';

function freeInfoMessage() {
  console.error('\033[01;36m');
  console.error('info:    ');
  console.error('info:    free accounts are limited to 2GB files');
  console.error('info:    for more space refer friends with: ');
  console.error('info:    ');
  console.error('info:    wsend --refer friend@example.com');
  console.error('info:    ');
  console.error('info:    or purchase space at: ');
  console.error('info:    https://wsend.net');
  console.error('info:    and get up to 10GB files');
  console.error('info:    ');
  console.error('info:    your free transfer will now continue');
  console.error('info:    ');
  console.error('\033[00m');
}

function registerInfoMessage() {
  console.error('\033[01;36m');
  console.error('info:    ');
  console.error("info:    It appears you aren't registered");
  console.error('info:    Registration is free and comes with 2GB of storage space');
  console.error('info:    Plus get 1G of space for every friend you refer');
  console.error('info:    ');
  console.error('info:    Sign up now with: wsend --register');
  console.error('info:    ');
  console.error('info:    unregistered accounts are limited to 200MB');
  console.error('info:    your unregistered transfer will now continue');
  console.error('info:    ');
  console.error('\033[00m');
}

function unregisteredSignUp() {
  console.error('\033[01;36m');
  console.error('info:    ');
  console.error('info:    creating unregistered account');
  console.error('info:    Registration is free and comes with 2GB of storage space');
  console.error('info:    Plus get 1G of space for every friend you refer');
  console.error('info:    ');
  console.error('info:    Sign up now with: wsend --register');
  console.error('info:    ');
  console.error('info:    unregistered accounts are limited to 200MB');
  console.error('info:    your unregistered transfer will now continue');
  console.error('info:    ');
  console.error('\033[00m');
  request.post(
    HOST+'/createunreg', {
      form: { start: 1 }
    },
    function (error, response, body) {
      if(!error && response.statusCode == 200) {
        fs.writeFileSync(WSEND_DIR+'/.id', body);
      }
    }
  );
}


var checkInstall = function() {
  var exists = fs.existsSync(WSEND_DIR);
  if (exists) {

    // directory exists, check to see if user is registered
    var idExists = fs.existsSync(WSEND_DIR+'/.id');
    if (idExists) {
      var id = fs.readFileSync(WSEND_DIR+'/.id');
      request.post(
        HOST+'/usertype', {
          form: { uid: id }
        },
        function (error, response, body) {
          if(!error && response.statusCode == 200) {
            var userType = body;
            if (userType === 'free') {
              freeInfoMessage();
            } else if (userType === 'unregistered') {
              registerInfoMessage();
            } else if (userType === 'unknown') {
              unregisteredSignUp();
            }
          }
        }
      );
    } else {
      installFirstTime();
    }

  } else {

    // directory doesn't exist and should be installed
    fs.mkdirSync(process.env.HOME+'/.wsend/', 0755);
  }
};

var login = function() {
  console.error('\033[01;36m');
  console.error('info:    enter email and password to login');
  console.error('\033[00m');
  var properties = [
    {
      name: 'email'
    },
    {
      name: 'password',
      hidden: true
    }
  ];
  
  prompt.start();

  prompt.get(properties, function (err, result) {
    if (err) { return onErr(err); }
    request.post(
        HOST+'/login_cli', {
          form: { email: result.email,
                  password: result.password
                }
        },
        function (error, response, body) {
          if(!error && response.statusCode == 200) {
            fs.writeFileSync(WSEND_DIR+'/.id', body);
          }
        }
    );


  });

  function onErr(err) {
    console.log(err);
    return 1;
  }
};

exports.login = login;
exports.checkInstall = checkInstall;
