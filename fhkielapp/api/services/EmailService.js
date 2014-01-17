
var ES = require('./Email-Settings');
var EM = {};

EM.server = require("emailjs/email").server.connect({

	host 	    : ES.host,
	user 	    : ES.user,
	password    : ES.password,
	ssl		    : true

});

exports.sendWelcomeEmail = function (account, callback) {
    EM.server.send({
        from         : ES.sender,
        to           : account.email,
        subject      : 'Welcome to FH Kiel Social Platform',
        text         : 'something went wrong... :(',
        attachment   :
            [
                {data:"<html><body>" +
                    "Welcome aboard "+account.infoname+"!<br><br>" +
                    "Your account at FH Kiel Social Platform was successfull!</br>" +
                    "Your username is :: <b>"+account.username+"</b><br><br>" +
                    "We hope you have a good time using our tool.<br><br>" +
                    "Yours sincerely,<br><br>" +
                    "FH Social Team<br><br>" +
                    "</body></html>"
                , alternative:true}
            ]
    }, callback)
};

exports.sendResetLink = function (account, callback) {
    EM.server.send({
        from         : ES.sender,
        to           : account.email,
        subject      : 'FH Social - Password Reset',
        text         : 'something went wrong... :(',
        attachment   :
            [
                {data:"<html><body>" +
                    "Hello "+account.infoname+",<br><br>" +
                    "To reset your password, please click on this link: " +
                    "<a href='https://localhost:1337/resetpwd?t=" + account.token + "&u=" + account.user + "'>Reset password</a><br><br>" +
                    "Yours sincerely,<br><br>" +
                    "FH Social Team</br>" +
                    "</body></html>"
                    , alternative:true}
            ]
    }, callback)
};