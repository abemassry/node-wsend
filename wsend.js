var prompt = require('prompt');
var request = require('request');
var fs = require('fs');
    


var checkInstall = function() {
  var exists = fs.existsSync(process.env.HOME+'/.wsend/');
  if (exists) {
    // directory exists
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
      'https://wsend.net/login_cli', {
        form: { email: result.email,
                password: result.password
              }
      },
      function (error, response, body) {
        if(!error && response.statusCode == 200) {
          fs.writeFileSync(process.env.HOME+'/.wsend/.id', body);
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
