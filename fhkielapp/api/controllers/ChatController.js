/**
 * ChatController
 *
 * @module      :: Controller
 * @description :: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {

    requestChat : function (req,res) {
        //first checks whether a chat between users is already created.
        //in case positive - return the chat ID to the client side
        //in case negative - create a new chat between the two users and return the ID.
        //WARNING: 'AND' modifier simply does not work in the normal .find() method!!
        //had to implement a sql query instead.
        Chat.query('SELECT * FROM CHAT WHERE (USER1= $1 AND USER2 = $2) OR (USER1 = $2 AND USER2 = $1)',[req.session.user,req.body.username],function(err,chat){
            if(err) {
                res.send(500, { error: "DB Error"});
            } else {
                if (chat.rowCount == 1) {
                    res.send(200,{chatid : chat.rows[0].id});
                } else {
                    Chat.create({
                        chatid : generateChatCode(64),
                        user1 : req.session.user,
                        user2 : req.body.username
                    }).done(function(err,chat) {
                            res.send(200,{chatid : chat.id});
                        });
                };
            };
        });

//        Chat.find({
//            or : [
//                { and : [{
//                    user1 : req.session.user,
//                    user2 : req.body.username
//                }]
//                },
//                { and : [{
//                    user1 : req.body.username,
//                    user2 : req.session.user
//                }]
//                }
//            ]
//        }).done(function(err,chat) {
//                if(err) {
//                    res.send(500, { error: "DB Error"});
//                } else {
//                    if (chat.length == 1) {
//                        res.send(200,{chatid : chat[0].id});
//                    } else {
//                        Chat.create({
//                            chatid : generateChatCode(64),
//                            user1 : req.session.user,
//                            user2 : req.body.username
//                        }).done(function(err,chat) {
//                                res.send(200,{chatid : chat.id});
//                            });
//                    };
//                };
//            });
    },

    chat : function (req,res) {
        res.view();
    },

    newmessage : function (req,res) {
        Chat.publish([{id:req.body.chatid}],{
            payload : {
                type: 'chat',
                chatid : req.body.chatid,
                user: req.session.user,
                message: req.body.message
            }
        });
    },

    subscribe : function (req,res) {
        Chat.find({id:req.body.id}).exec(function(err,chats){
            Chat.subscribe(req.socket,chats);
        })
    },

    listUsers : function (req,res) {
        //this function lists all users that the requesting socket
        //can chat with.
        //TODO need to list only users which are in the same group T.B.D

        //this is subject to be changed!
        Users.find({
            username :{'!' : req.session.user}
        }).exec(function(err,users){

                //TODO subscribe to receive whether a user is online or not - Needs to be implemented!!
                Users.subscribe(req.socket,users);

                var userArray = [];

                for (var i = 0; i < users.length; i++) {
                    var user = {username: '', firstname: '', lastname : '', isonline : '' };

                    user.username = users[i].username;
                    user.firstname = users[i].firstname;
                    user.lastname = users[i].lastname;
                    user.isonline = users[i].isonline;
                    userArray.push(user);
                };

                res.send(200,userArray);
            });
    },

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to ChatController)
   */
  _config: {}

};

//not used.
var getChatPK = function (chatuuid) {
    return chatID = (chatuuid.substr(chatuuid.search(":") - chatuuid.length + 1));
};

var generateChatCode = function (bits){
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