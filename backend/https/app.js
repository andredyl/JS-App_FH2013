
/**
 * Module dependencies.
 */

//modules
var express = require('express');
var https = require('https');
var fs = require("fs");
var http = require('http');
var path = require('path');
var query = require('pg-query');
var RedisStore = require('connect-redis')(express);

var options = {
    key: fs.readFileSync('privatekey.pem'),   //Private Key generated with OPEN SSL
    cert: fs.readFileSync('certificate.pem')  //Certificate from CA
};
//routes
var routes = require('./routes');
var user = require('./routes/user');
var auth = require('./routes/authentication');


//init
var app = express();
query.connectionParameters = "postgres://postgres:andredyl@localhost:5432/postgres"; //"postgres://postgres:naruto@localhost/test";//

// all environments
app.set('port', process.env.PORT || 443);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());

//sessions
app.use(express.cookieParser('123456789ZXCVBNM'));
app.use(express.session({
    store: new RedisStore({
        host: 'localhost',
        port: 6379,
        db: 2,
        pass: 'RedisPASS'
    }),
    secret: '123456789ZXCVBNM',
    cookie: {
        httpOnly: true, secure: true,
        maxAge: 60 * 60 * 1000
    }
}));   //Cookies sent in secure way

app.use(app.router);
app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
app.use(express.static(path.join(__dirname, 'public')));


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

app.get('/login', auth.logindex);

app.post('/login', function (req,res) {
    auth.loginpost(req,res,query);
});

app.get('/logout', auth.logout);

app.get('/signup', auth.signup);

app.post('/signup', function (req,res) {
   auth.singuppost(req,res,query);
});


https.createServer(options,app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});