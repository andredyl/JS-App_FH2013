
/**
 * Module dependencies.
 */

//modules
var express = require('express');
var http = require('http');
var path = require('path');
var query = require('pg-query');
//var env = (function(){
//    var habitat = require('habitat');
//    habitat.load('./config.env');
//    return new habitat('app');
//    }());


//routes
var routes = require('./routes');
var user = require('./routes/user');
var auth = require('./routes/authentication');


//init
var app = express();
//env.get('pgConstrg')
query.connectionParameters = "postgres://postgres:andredyl@localhost:5432/postgres";

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());

//sessions
app.use(express.cookieParser('your secret here'));
app.use(express.session('your secret here'));
app.use(express.csrf());

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

app.get('/signup', auth.signup);

app.post('/signup', function (req,res) {
   auth.singuppost(req,res,query);
});


http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});

//app.get('/users', user.list);