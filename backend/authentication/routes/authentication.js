/**
 * Created by AndreDy on 11/10/13.
 */


var crypto = require ("crypto-js/sha3");

exports.logindex = function (req,res) {
    if (req.session.user) {
        res.render('resource', { title: 'Account manager', user : req.session.user});
    } else {
        res.render('login' ,{message: ''});
    }
};

exports.loginpost = function (req,res,query) {
    query('SELECT USR_PASSWD, USR_NAME FROM JS_USERS WHERE USR_NAME = $1', [generateUser(req.body.username)], function(err, rows, result) {
        if (err) {
            res.render('login',{message : 'Error while retrieving information. Please try again'});
        } else if (result.rowCount == 0) {
            res.render('login',{message : 'No account found! Please <a href="/signup"> register </a> or check your username/password'});
        } else {
            if (generatePWD(req.body.password,req.body.username) != result.rows[0].usr_passwd) {
                res.render('login',{message : 'Error! Check your Username/Password!'});
            } else {
            req.session.regenerate(function() {
                req.session.user = req.body.username;
                res.redirect('/login');
            });
            }
        }
    });
};

exports.signup = function (req,res) {
    res.render('signup', {message : ''});
}

exports.singuppost = function (req,res,query) {
    query('SELECT COUNT(USR_PASSWD) FROM JS_USERS WHERE USR_NAME = $1', [req.body.username], function (err, rows, result) {
        if (err) {
            res.render('signup', {message : 'Error while retrieving information. Please try again'});
        } else if (result.rows[0].count > 0) {
            res.render('signup', {message : 'This username is already taken!'});
        } else {
            query("INSERT INTO JS_USERS VALUES ($1,$2,NEXTVAL('JS_USERS_SEQ'))", [ generateUser(req.body.username), generatePWD(req.body.password,req.body.username) ], function (err,rows,result) {
                if(err) {
                    res.render('signup', {message : 'Error while creating the user. Please try again'});
                } else {
                    res.redirect('/login');
                }
            })
        }
    });
}

exports.logout = function (req, res) {
    req.session.destroy(function () {
        res.redirect('/');
    });
}


//just simple "salt" generation. Usually gives the username, as this will also be hashed in the database.
var generatePWD = function (pwd,salt) {
    return crypto( pwd + salt.substr(salt.length - 4)).toString();
}

var generateUser = function (usr) {
    return crypto(usr).toString();
}