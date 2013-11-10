/**
 * Created by AndreDy on 11/10/13.
 */


var crypto = require ("crypto-js/sha3");

exports.logindex = function (req,res) {
    if (req.session.user) {
        res.end("Logged in as " + req.session.user);
    } else {
        res.render('login');
    }
};

exports.loginpost = function (req,res,query) {
    query('SELECT USR_PASSWD, USR_NAME FROM JS_USERS WHERE USR_NAME = $1', [req.body.username], function(err, rows, result) {
        if (err) {
            res.end("Error! Check your Username/Password");
        } else if (result.rowCount == 0) {
            res.end("No account found! Please <a href='/signup'> register </a> or check your username/password");
        } else {
            req.session.regenerate(function() {
                req.session.user = result.rows[0].usr_name;
                res.end("Logged in as " +  req.session.user);
            })
        }
    });
};

exports.signup = function (req,res) {
    res.render('signup');
}

exports.singuppost = function (req,res,query) {
    query('SELECT COUNT(USR_PASSWD) FROM JS_USERS WHERE USR_NAME = $1', [req.body.username], function (err, rows, result) {
        if (err) {
            res.end("Error while creating the user. Please try again");
        } else if (result.rows[0].count > 0) {
            res.send('<p class="msg error">This username is already taken!</p>');
        } else {
            query("INSERT INTO JS_USERS VALUES ($1,$2,NEXTVAL('JS_USERS_SEQ'))", [req.body.username,crypto(req.body.passwd).toString()], function (err,rows,result) {
                if(err) {
                    res.end("Error while creating the user. Please try again");
                } else {
                    res.redirect('/login');
                }
            })
        }
    });
}