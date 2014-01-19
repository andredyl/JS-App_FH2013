/**
 * AuthController
 *
 * @module      :: Controller
 * @description :: Contains logic for handling requests.
 */

var crypto = require ("crypto-js/sha3");

module.exports = {

    login : function (req,res) {
        //if there is already an authenticated session, return OK.
        //otherwise, it will render the login page.
        
        if (req.session.user) {
            //res.redirect('/menu');
            return res.view("home/authenticated_index",{layout: "layout_extended"});
        } else {
            res.view({error: false});
        };
    },

    login_post : function (req,res) {
        var error = false;
        if(req.body.username == "" || req.body.password == "")
        {
           return res.view("auth/login", {error: "Username/Password cannot be left empty."});
        }
        
        //search for the username in the database.
       Users.findByUsername(req.body.username).done(function(err,usr) {
           if(err) {
               res.send(500, { error: "DB Error"});
           } else {
               if (usr.length > 0) {
                   //if the user is found, check the provided password with the one in the database.
                   if (generatePWD(req.body.password,generateUser(req.body.username)) == usr[0].password) {
                       //if the passwords match, check if the "Remember Me" is selected.
                       //in any case, a new session will be created.
                       if (req.body.remember_me) {
                           req.session.regenerate(function () {
                               Users.update({id: usr[0].id}, {isonline : true}, (function (err, usr) {
                                   Users.publishUpdate(usr[0].id,{username : usr[0].username, isonline : true});
                               }));
                               req.session.user = usr[0].username;
                               req.session.cookie.maxAge = 60 * 60 * 1000;
                               //res.redirect('/menu');
                                 return res.view("home/authenticated_index",{layout: "layout_extended"});
                           });
                       } else {
                           req.session.regenerate(function () {
                               Users.update({id: usr[0].id}, {isonline : true}, (function (err, usr) {
                                   Users.publishUpdate(usr[0].id,{username : usr[0].username, isonline : true});
                               }));
                               req.session.user = usr[0].username;
                               //res.redirect('/menu');
                                return res.view("home/authenticated_index",{layout: "layout_extended"});
                           });
                       };
                   } else {
                       return res.view("auth/login", {error: "Please check your Username/Password."});
                       
                       
                   }
               } else {
                   
                   //res.send(400, {error: "Username does not seem to exist."});
                  return res.view("auth/login", {error: "Username does not seem to exist."});
                   
               }
           }
           
       });
       
   },

    logout : function (req,res) {
        var usrname = req.session.user
        if (usrname !== undefined)
        {
            Users.update({username: usrname}, {isonline : false}, (function (err, usr) {
                Users.publishUpdate(usr[0].id,{username : usrname, isonline : false});
            }));
        }

        req.session.destroy(function () {
            res.redirect('/login');
        });
    },

    signup : function (req,res) {

        if (req.session.user) {
            res.redirect('/menu');
        } else {
            res.view({error: false});
        };
    },

    signup_post : function (req,res) {
        //TODO check if all user parameters are being inserted!
        //firstly, will check if the desired username and e-mail don´t
        //exist in the database. In case both conditions are false,
        //the data will be inserted into the database and a welcome
        //email is sent.
        var error = false;
        if(req.body.email == "" || req.body.name == ""
           || req.body.matnumber == "" || req.body.password == ""
           || req.body.surname == ""|| req.body.username == "")
        {
             res.view("auth/signup", {error: "One or more required fields are missing"});
        }

        Users.find({
            or : [
                {username : req.body.username},
                {email : req.body.email}
            ]
        }).done(function(err,usr) {
            if(err) {
                res.send(500, { error: "DB Error"});
            } else if (usr.length > 0) {
                usr.forEach(function(u) {
                    if (u.username == req.body.username){
                        res.send(400, {error: "Username already taken"});
                    } else if (u.email == req.body.email) {
                        res.send(400, {error: "You already have an account with this e-mail!"});
                    };
                });
            } else {
                Users.create({
                    username: req.body.username,
                    password: generatePWD(req.body.password, generateUser(req.body.username)),
                    firstname: req.body.name,
                    lastname: req.body.surname,
                    matnumber: req.body.matnumber,
                    role:'student',
                    email : req.body.email,
                    isonline : false
                }).done(function (err,usr){
                        if(err){

                            res.view("auth/signup", {error: "Wrong Email Format - No Foreign Characters"});

                            //res.send(500, {error: "DB Error"});
                        } else {
                            EmailService.sendWelcomeEmail({
                                "username": req.body.username,
                                "infoname": req.body.firstname + ' ' + req.body.lastname,
                                "email": req.body.email });
                            res.redirect('/login');
                        };
                    });
            };
        });

    },

    changepwd : function (req,res) {
        //if there is already an authenticated session, renders
        //the view, otherwise redirect to the login page.
        if (req.session.user) {
            res.view();
        } else {
            res.redirect('/login');
        };
    },

    changepwd_post: function (req, res) {
        //update the password of the user.
        //as this request can also be called during a reset procedure
        //after the password is changed, we destroy the token for that user (if it exists)
        Users.update({username: req.session.user}, {
            password: generatePWD(req.body.password, generateUser(req.session.user))
        }, (function (err, usr) {
            if (err) {
                req.send(500, {error: "DB Error"});
            } else {
                Tokens.destroy({user: req.session.user}).done(function(err){
                    res.send(200);
                });
            };
        }));
    },

    resetpwd : function(req,res) {
        //query the request for the token and the user param.
        //it will then try to find the token in the database.
        //if found, checks if it is too old or not. In case positive,
        //deletes the token.
        var token = req.query["t"];
        var user = req.query["u"];

            if (token) {
            Tokens.findById(token).done(function(err,tkn) {
                if(err) {
                    res.send(500, { error: "DB Error"});
                } else if (tkn.length == 0) {
                    res.send(500, {error: "Token is invalid."});
                } else {
                    if ( (new Date().getTime() - parseInt(tkn[0].createtime)) >= 18000000 ) {
                        Tokens.destroy({username: user}).done(function(err) {
                            res.send(500, {error: "Token has expired."});
                        });
                    } else {
                        req.session.user = user;
                        res.redirect('/changepwd');
                    };
                };
            });
        } else {
                res.view({error: false});
        };
    },

    resetpwd_post : function (req,res) {

        //generates a token with 128bits.
        //checks for the e-mail in the database and if found,
        //send the reset link to the user.
        var token = generateResetCode(128);
        var error = false;
        Users.findByEmail(req.body.email).done(function(err,usr) {
            if(err) {
                res.send(500, { error: "DB Error"});
            } else {
                if(usr.length > 0){
                Tokens.create({
                    id : token,
                    user : usr[0].username,
                    createtime : new Date().getTime()
                }
                ).done(function(err,tkn) {
                        if (err) {
                            res.send(500, { error: "DB Error"});
                        } else {
                            EmailService.sendResetLink({
                                "infoname": usr[0].firstname + ' ' + usr[0].lastname,
                                "user" : usr[0].username,
                                "token" : token,
                                "email": usr[0].email});
                            res.view("auth/login", {error: "Email Sent"});
                        };
                    });
                }
                else
                {
                    res.view("auth/resetpwd", {error: "Email Not Found"});
                }
            };
        });
    }

};

// aux. functions
var generatePWD = function (pwd,salt) {
    return crypto( pwd + salt.substr(salt.length - 4)).toString();
};

var generateUser = function (usr) {
    return crypto(usr).toString();
};

var generateResetCode = function (bits){
    var char = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
    var ret = '';

    while (bits > 0) {
        var rand = Math.floor(Math.random() * 0x100000000);
        for (i = 26; i > 0 && bits > 0; i -= 3, bits -= 3) {
            ret += char[0x3F & rand >>> i];
        };
    };

    return ret;
};