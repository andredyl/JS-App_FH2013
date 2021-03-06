/**
 * MenuController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */


module.exports = {

    menu : function (req,res) {
        //if there is already an authenticated session, return OK.
        //otherwise, it will render the login page.
        var lista=[];
        if (req.session.user) {
            Users.findByUsername(req.session.user).done(function(er,us){
                if(er){
                    req.send(500, {error: "DB Error"});
                } else {
                    Users_Subjects.findByUserID(us[0].id.toString()).done(function(err,usr){
                        if (err){
                            req.send(500,{error:"DB Error"});
                        } else {
                            if (usr.length>0){usr.forEach(function(a){
                                Subjects.findById(a.subjectID).done(function(e,su){
                                    if (e){
                                        req.send(500,{error: "DB Error"});
                                    } else {
                                        lista.push(su[0].name);
                                    }
                                });
                            });}
                        }
                    });
                setTimeout(function(){res.view({list:lista,type:us[0].role});},200);
                }
            });
        } else {
            res.redirect('/login');
        };
    }


}