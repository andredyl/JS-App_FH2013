var express = require('express'),
	app=express(),
	server = require('http').createServer(app),			//not required by express because it creates one, but SOCKET.IO NEEDS a http server
	io = require('socket.io').listen(server);
	
server.listen(3000);

app.get('/', function(req,res){
	res.sendfile(__dirname+'/index.html');
});


io.sockets.on ('connection',function(socket){                //receive message
    socket.on('send message', function(data){               //new message is the same name than the even created in client side
       io.sockets.emit('new message',data);                  //
        //socket.broadcast.emit('new message',data)
    });
});