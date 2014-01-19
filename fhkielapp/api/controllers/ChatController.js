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

    listUsers : function (req, res) {
        //this function lists all users that the requesting socket
        //can chat with.
        //TODO need to list only users which are in the same group T.B.D

        //find the user ID.
        Users.find({username: req.session.user}).done(function (err, user) {
            var requestUserID = user[0].id;

            //get the subjects the user is enrroled
            Users_Subjects.find({userID: requestUserID}).done(function (err, subjects) {

                var userSubjects = '';
                if (subjects.length > 0) {
                    for (var i = 0; i < subjects.length; i++) {
                        userSubjects += "\'" + subjects[i].subjectID + "\',";
                    }
                    //take last , from string
                    userSubjects = userSubjects.substring(0, userSubjects.length - 1);
                }


                //find the users ids in the sames subjects as the user
                Users_Subjects.query('SELECT * FROM USERS_SUBJECTS WHERE "subjectID" IN (' + userSubjects + ')', function (err, userfriends) {

                    var friendUsers = '';

                    if (userfriends) {

                        for (var i = 0; i < userfriends.rowCount; i++) {
                            if (userfriends.rows[i].userID !== requestUserID.toString()) {
                                friendUsers += "\'" + userfriends.rows[i].userID + "\',";
                            }

                        }
                        friendUsers = friendUsers.substring(0, friendUsers.length - 1);
                    }


                    //find the user info from the users IDs
                    Users.query('SELECT * FROM USERS WHERE ID IN (' + friendUsers + ')', function (err, users) {
                        var userArray = [];

                        if (!err) {
                            for (var i = 0; i < users.rowCount; i++) {
                                var user = {username: '', firstname: '', lastname: '', isonline: '' };

                                user.username = users.rows[i].username;
                                user.firstname = users.rows[i].firstname;
                                user.lastname = users.rows[i].lastname;
                                user.isonline = users.rows[i].isonline;
                                userArray.push(user);

                                Users.subscribe(req.socket, users.rows[i]);

                            }

                        }

                        res.send(200, userArray);
                    });
                });

            }); //close get subjects the user is enrroled
        }); //close find the user ID
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