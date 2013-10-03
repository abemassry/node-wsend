var prompt = require('prompt');
var request = require('request');
var https = require('https');
var fs = require('fs');
var sys = require('sys');
var util = require('util');
var FormData = require('form-data');
var sys = require('sys');
var through = require('through');

var WSEND_DIR = process.env.HOME+'/.wsend';
var HOST = 'https://wsend.net';
var HOSTNAME = 'wsend.net';

var i=0;
var j=0;
var reset = 0;
var nextPiece=1;
var steps = 9;
var counter = 0;

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

function notEnoughSpaceErr() {
  console.error('\033[01;31m');
  console.error('error:   ');
  console.error('error:   not enough space in your account for this transfer');
  console.error('error:    ');
  console.error('error:   you can register with: wsend --register,');
  console.error('error:    ');
  console.error('error:   send referrals with wsend --refer friend@example.com, or');
  console.error('error:   upgrade to a paid account at https://wsend.net');
  console.error('error:   ');
  console.error('\033[00m');
}

function filesizeTooLarge () {
  console.error('\033[01;31m');
  console.error('error:   ');
  console.error('error:   this file is too large for your account');
  console.error('error:   you can register with: wsend --register');
  console.error('error:   for 2GB files, or');
  console.error('error:   upgrade to a paid account at https://wsend.net');
  console.error('error:   for 10GB files');
  console.error('error:   ');
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

function installFirstTime() {
  console.error('\033[01;36m');
  console.error('info:    ');
  console.error('info:    Installing and signing up for the first time');
  console.error('info:    with an unregistered account');
  console.error('info:    if you already have an account you can log in with:');
  console.error('info:    ');
  console.error('info:    wsend --login');
  console.error('info:    ');
  console.error('info:    your transfer will continue');
  console.error('info:    ');
  console.error('\033[00m');
  unregisteredSignUp();
}
  

var checkInstall = function() {
  var exists = fs.existsSync(WSEND_DIR);
  if (exists) {

    // directory exists, check to see if user is registered
    var idExists = fs.existsSync(WSEND_DIR+'/.id');
    if (idExists) {
      var id = fs.readFileSync(WSEND_DIR+'/.id').toString().replace(/(\r\n|\n|\r)/gm,"");
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
    installFirstTime();
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

var register = function() {
  console.error('\033[01;36m');
  console.error('info:    enter email and password to register');
  console.error('\033[00m');
  var idExists = fs.existsSync(WSEND_DIR+'/.id');
  
  // if there is an id get the id
  if (idExists) {
    var id = fs.readFileSync(WSEND_DIR+'/.id').toString().replace(/(\r\n|\n|\r)/gm,"");
  } else {
    //installFirstTime();
  }
    
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

    // if there is an id use the id that was
    // previously gotten
    if (idExists) {
      request.post(
          HOST+'/register_cli', {
            form: { uid: id,
                    email: result.email,
                    password: result.password
                  }
          },
          function (error, response, body) {
            if(!error && response.statusCode == 200) {
              console.error('\033[01;36m');
              console.error('info:    message from server:');
              console.error('info:    '+body+'\n');
              console.error('\033[00m');
            }
          }
      );
    } else {
      // otherwise get an id and then register with that
      // id.  Needed because of the asynchronous nature
      // of node
      request.post(
        HOST+'/createunreg', {
          form: { start: 1 }
        },
        function (error, response, body) {
          if(!error && response.statusCode == 200) {
            fs.writeFileSync(WSEND_DIR+'/.id', body);
            var id = body;
            request.post(
                HOST+'/register_cli', {
                  form: { uid: id,
                          email: result.email,
                          password: result.password
                        }
                },
                function (error, response, body) {
                  if(!error && response.statusCode == 200) {
                    console.error('\033[01;36m');
                    console.error('info:    message from server:');
                    console.error('info:    '+body+'\n');
                    console.error('\033[00m');
                  }
                }
            );

          }
        }
      );
    }
  });

  function onErr(err) {
    console.log(err);
    return 1;
  }
};

var refer = function(email) {
  var id = fs.readFileSync(WSEND_DIR+'/.id').toString().replace(/(\r\n|\n|\r)/gm,"");
  request.post(
    HOST+'/usertype', {
      form: { uid: id }
    },
    function (error, response, body) {
      if(!error && response.statusCode == 200) {
        var userType = body;
        if (userType === 'free' || userType === 'paid') {
          console.error('\033[01;36m');
          console.error('info:    referring a friend');
          console.error('\033[00m');

          request.post(
              HOST+'/refer_cli', {
                form: { email: email,
                        id: id
                      }
              },
              function (error, response, body) {
                if(!error && response.statusCode == 200) {
                  if (body === "success") {
                    console.error('\033[01;36m');
                    console.error('info:    friend referred successfully');
                    console.error('\033[00m');
                  } else {
                    console.error('\033[01;31m');
                    console.error('error:   something went wrong with the referral process');
                    console.error('\033[00m');
                  }
                }
              }
          );

        } else {
          console.error('\033[01;31m');
          console.error('error:   referrals available to registered accounts');
          console.error('\033[00m');
        }
      }
    }
  );

};

var referLink = function() {
  var id = fs.readFileSync(WSEND_DIR+'/.id').toString().replace(/(\r\n|\n|\r)/gm,"");
  request.post(
    HOST+'/usertype', {
      form: { uid: id }
    },
    function (error, response, body) {
      if(!error && response.statusCode == 200) {
        var userType = body;
        if (userType === 'free' || userType === 'paid') {
          console.error('\033[01;36m');
          console.error('info:    getting referral link');
          console.error('\033[00m');

          request.post(
              HOST+'/referlink_cli', {
                form: { id: id
                      }
              },
              function (error, response, body) {
                if(!error && response.statusCode == 200) {
                  console.log(body);
                }
              }
          );

        } else {
          console.error('\033[01;31m');
          console.error('error:   referrals available to registered accounts');
          console.error('\033[00m');
        }
      }
    }
  );
  
};

var sendFile = function(file) {
  var exists = fs.existsSync(WSEND_DIR);
  if (exists) {

    // directory exists, check to see if user is registered
    var idExists = fs.existsSync(WSEND_DIR+'/.id');
    if (idExists) {
      var size = util.inspect(fs.statSync(file).size);
      var id = fs.readFileSync(WSEND_DIR+'/.id').toString().replace(/(\r\n|\n|\r)/gm,"");
      // 
      // start request for user space avaliable
      //
      request.post(
        HOST+'/userspaceavailable', {
          form: { uid: id,
                  size: size
                }
        },
        function (error, response, body) {
          if(!error && response.statusCode == 200) {
            var accountSizeAvailable = body;
      // 
      // end of request for user space available
      //
              if (accountSizeAvailable === 'not enough space in your account for this transfer') {
                notEnoughSpaceErr();
              } else if(accountSizeAvailable === 'file is too big for your account size') { 
                  filesizeTooLarge();
              } else {
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
                        // 
                        // start of file upload
                        //

                        var form = new FormData();
                        var pace = require('pace')(parseInt(size));

                        form.append('uid', id);
                        form.append('filehandle', fs.createReadStream(file));

                        var request = https.request({
                          method: 'post',
                          hostname: 'wsend.net',
                          port: 443,
                          path: '/upload_cli',
                          headers: form.getHeaders()
                        });
                          
                        var tr = through(function (chunk) {
                          this.queue(chunk);
                          i++;
                          var c = 0;
                          function output() {
                            process.nextTick(function() {
                              c++;
                              if (parseInt(size) > 200) {
                                if (counter < parseInt(size)) {
                                  for (var k = 0; k < steps; k++){
                                    pace.op();
                                    counter++;
                                  }
                                }
                              }
                              request.write(chunk, function(){
                                output();
                              });
                            });
                          }
                          if (c === 0) {
                            output();
                          }
                        });

                        request.on('response', function(res) {
                          //res.setMaxListeners(0);
                          res.on('data', function(chunk){
                            pace.op(size);
                            console.error(' ');
                            console.log(chunk.toString());
                            process.exit(0);
                          });
                        });

                        form.pipe(tr);

                        //
                        // end of file upload
                        //
                      }
                    }
                  );

              }

          } else { // end of user space available brace
            console.log('the error is: '+error);
            console.log('the response status code is: '+response.statusCode);
          }
        }
      ); // end of user space available paren
    } else { // if id doesnt exist
      registerInfoMessage();
      request.post(
        HOST+'/createunreg', {
          form: { start: 1 }
        },
        function (error, response, body) {
          if(!error && response.statusCode == 200) {
            fs.writeFileSync(WSEND_DIR+'/.id', body);
            var size = util.inspect(fs.statSync(file).size);
            var id = fs.readFileSync(WSEND_DIR+'/.id').toString().replace(/(\r\n|\n|\r)/gm,"");
            // 
            // start request for user space avaliable
            //
            request.post(
              HOST+'/userspaceavailable', {
                form: { uid: id,
                        size: size
                      }
              },
              function (error, response, body) {
                if(!error && response.statusCode == 200) {
                  var accountSizeAvailable = body;
            // 
            // end of request for user space available
            //
                    if (accountSizeAvailable === 'not enough space in your account for this transfer') {
                      notEnoughSpaceErr();
                    } else if(accountSizeAvailable === 'file is too big for your account size') { 
                        filesizeTooLarge();
                    } else {
                        // 
                        // start of file upload
                        //

                        var form = new FormData();
                        var pace = require('pace')(parseInt(size));

                        form.append('uid', id);
                        form.append('filehandle', fs.createReadStream(file));

                        var request = https.request({
                          method: 'post',
                          hostname: 'wsend.net',
                          port: 443,
                          path: '/upload_cli',
                          headers: form.getHeaders()
                        });
                          
                        var tr = through(function (chunk) {
                          this.queue(chunk);
                          i++;
                          var c = 0;
                          function output() {
                            process.nextTick(function() {
                              c++;
                              if (parseInt(size) > 200) {
                                if (counter < parseInt(size)) {
                                  for (var k = 0; k < steps; k++){
                                    pace.op();
                                    counter++;
                                  }
                                }
                              }
                              request.write(chunk, function(){
                                output();
                              });
                            });
                          }
                          if (c === 0) {
                            output();
                          }
                        });

                        request.on('response', function(res) {
                          //res.setMaxListeners(0);
                          res.on('data', function(chunk){
                            pace.op(size);
                            console.error(' ');
                            console.log(chunk.toString());
                            process.exit(0);
                          });
                        });

                        form.pipe(tr);

                        //
                        // end of file upload
                        //

                    }

                } else { // end of user space available brace
                  console.log('the error is: '+error);
                  console.log('the response status code is: '+response.statusCode);
                }
              }
            ); // end of user space available paren

          }
        }
      );

    } // end of if id dosent exist

  } else { // if directory doesnt exist
    registerInfoMessage();
    fs.mkdirSync(process.env.HOME+'/.wsend/', 0755);
      request.post(
        HOST+'/createunreg', {
          form: { start: 1 }
        },
        function (error, response, body) {
          if(!error && response.statusCode == 200) {
            fs.writeFileSync(WSEND_DIR+'/.id', body);
            var size = util.inspect(fs.statSync(file).size);
            var id = fs.readFileSync(WSEND_DIR+'/.id').toString().replace(/(\r\n|\n|\r)/gm,"");
            // 
            // start request for user space avaliable
            //
            request.post(
              HOST+'/userspaceavailable', {
                form: { uid: id,
                        size: size
                      }
              },
              function (error, response, body) {
                if(!error && response.statusCode == 200) {
                  var accountSizeAvailable = body;
            // 
            // end of request for user space available
            //
                    if (accountSizeAvailable === 'not enough space in your account for this transfer') {
                      notEnoughSpaceErr();
                    } else if(accountSizeAvailable === 'file is too big for your account size') { 
                        filesizeTooLarge();
                    } else {
                        // 
                        // start of file upload
                        //

                        var form = new FormData();
                        var pace = require('pace')(parseInt(size));

                        form.append('uid', id);
                        form.append('filehandle', fs.createReadStream(file));

                        var request = https.request({
                          method: 'post',
                          hostname: 'wsend.net',
                          port: 443,
                          path: '/upload_cli',
                          headers: form.getHeaders()
                        });
                          
                        var tr = through(function (chunk) {
                          this.queue(chunk);
                          i++;
                          var c = 0;
                          function output() {
                            process.nextTick(function() {
                              c++;
                              if (parseInt(size) > 200) {
                                if (counter < parseInt(size)) {
                                  for (var k = 0; k < steps; k++){
                                    pace.op();
                                    counter++;
                                  }
                                }
                              }
                              request.write(chunk, function(){
                                output();
                              });
                            });
                          }
                          if (c === 0) {
                            output();
                          }
                        });

                        request.on('response', function(res) {
                          //res.setMaxListeners(0);
                          res.on('data', function(chunk){
                            pace.op(size);
                            console.error(' ');
                            console.log(chunk.toString());
                            process.exit(0);
                          });
                        });

                        form.pipe(tr);

                        //
                        // end of file upload
                        //

                    }

                } else { // end of user space available brace
                  console.log('the error is: '+error);
                  console.log('the response status code is: '+response.statusCode);
                }
              }
            ); // end of user space available paren

          }
        }
      );
  } // end of directory doesnt exist
};
var sendFileNoProgress = function(file) {
  var exists = fs.existsSync(WSEND_DIR);
  if (exists) {

    // directory exists, check to see if user is registered
    var idExists = fs.existsSync(WSEND_DIR+'/.id');
    if (idExists) {
      var size = util.inspect(fs.statSync(file).size);
      var id = fs.readFileSync(WSEND_DIR+'/.id').toString().replace(/(\r\n|\n|\r)/gm,"");
      // 
      // start request for user space avaliable
      //
      request.post(
        HOST+'/userspaceavailable', {
          form: { uid: id,
                  size: size
                }
        },
        function (error, response, body) {
          if(!error && response.statusCode == 200) {
            var accountSizeAvailable = body;
      // 
      // end of request for user space available
      //
              if (accountSizeAvailable === 'not enough space in your account for this transfer') {
                notEnoughSpaceErr();
              } else if(accountSizeAvailable === 'file is too big for your account size') { 
                  filesizeTooLarge();
              } else {
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
                        // 
                        // start of file upload
                        //

                        var form = new FormData();

                        form.append('uid', id);
                        form.append('filehandle', fs.createReadStream(file));

                        var request = https.request({
                          method: 'post',
                          hostname: 'wsend.net',
                          port: 443,
                          path: '/upload_cli',
                          headers: form.getHeaders()
                        });

                        request.on('response', function(res) {
                          //res.setMaxListeners(0);
                          res.on('data', function(chunk){
                            console.log(chunk.toString());
                            process.exit(0);
                          });
                        });

                        form.pipe(request);

                        //
                        // end of file upload
                        //
                      }
                    }
                  );

              }

          } else { // end of user space available brace
            console.log('the error is: '+error);
            console.log('the response status code is: '+response.statusCode);
          }
        }
      ); // end of user space available paren
    } else { // if id doesnt exist
      registerInfoMessage();
      request.post(
        HOST+'/createunreg', {
          form: { start: 1 }
        },
        function (error, response, body) {
          if(!error && response.statusCode == 200) {
            fs.writeFileSync(WSEND_DIR+'/.id', body);
            var size = util.inspect(fs.statSync(file).size);
            var id = fs.readFileSync(WSEND_DIR+'/.id').toString().replace(/(\r\n|\n|\r)/gm,"");
            // 
            // start request for user space avaliable
            //
            request.post(
              HOST+'/userspaceavailable', {
                form: { uid: id,
                        size: size
                      }
              },
              function (error, response, body) {
                if(!error && response.statusCode == 200) {
                  var accountSizeAvailable = body;
            // 
            // end of request for user space available
            //
                    if (accountSizeAvailable === 'not enough space in your account for this transfer') {
                      notEnoughSpaceErr();
                    } else if(accountSizeAvailable === 'file is too big for your account size') { 
                        filesizeTooLarge();
                    } else {
                        // 
                        // start of file upload
                        //

                        var form = new FormData();

                        form.append('uid', id);
                        form.append('filehandle', fs.createReadStream(file));

                        var request = https.request({
                          method: 'post',
                          hostname: 'wsend.net',
                          port: 443,
                          path: '/upload_cli',
                          headers: form.getHeaders()
                        });

                        request.on('response', function(res) {
                          //res.setMaxListeners(0);
                          res.on('data', function(chunk){
                            console.log(chunk.toString());
                            process.exit(0);
                          });
                        });

                        form.pipe(request);

                        //
                        // end of file upload
                        //

                    }

                } else { // end of user space available brace
                  console.log('the error is: '+error);
                  console.log('the response status code is: '+response.statusCode);
                }
              }
            ); // end of user space available paren

          }
        }
      );

    } // end of if id dosent exist

  } else { // if directory doesnt exist
    registerInfoMessage();
    fs.mkdirSync(process.env.HOME+'/.wsend/', 0755);
      request.post(
        HOST+'/createunreg', {
          form: { start: 1 }
        },
        function (error, response, body) {
          if(!error && response.statusCode == 200) {
            fs.writeFileSync(WSEND_DIR+'/.id', body);
            var size = util.inspect(fs.statSync(file).size);
            var id = fs.readFileSync(WSEND_DIR+'/.id').toString().replace(/(\r\n|\n|\r)/gm,"");
            // 
            // start request for user space avaliable
            //
            request.post(
              HOST+'/userspaceavailable', {
                form: { uid: id,
                        size: size
                      }
              },
              function (error, response, body) {
                if(!error && response.statusCode == 200) {
                  var accountSizeAvailable = body;
            // 
            // end of request for user space available
            //
                    if (accountSizeAvailable === 'not enough space in your account for this transfer') {
                      notEnoughSpaceErr();
                    } else if(accountSizeAvailable === 'file is too big for your account size') { 
                        filesizeTooLarge();
                    } else {
                        // 
                        // start of file upload
                        //

                        var form = new FormData();

                        form.append('uid', id);
                        form.append('filehandle', fs.createReadStream(file));

                        var request = https.request({
                          method: 'post',
                          hostname: 'wsend.net',
                          port: 443,
                          path: '/upload_cli',
                          headers: form.getHeaders()
                        });

                        request.on('response', function(res) {
                          //res.setMaxListeners(0);
                          res.on('data', function(chunk){
                            console.log(chunk.toString());
                            process.exit(0);
                          });
                        });

                        form.pipe(request);

                        //
                        // end of file upload
                        //

                    }

                } else { // end of user space available brace
                  console.log('the error is: '+error);
                  console.log('the response status code is: '+response.statusCode);
                }
              }
            ); // end of user space available paren

          }
        }
      );
  } // end of directory doesnt exist
};

exports.login = login;
exports.checkInstall = checkInstall;
exports.register = register;
exports.refer = refer;
exports.referLink = referLink;
exports.sendFile = sendFile;
exports.sendFileNoProgress = sendFileNoProgress;
