/**
 * SubjectController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */


module.exports = {

    createsubject : function (req,res) {
        //if there is already an authenticated session, and the user is a professor, display the create subject page
        //otherwise, it will render the login page.
        if (req.session.user) {
            Users.findByUsername(req.session.user).done(function(err,usr){
                if(err) {
                    res.send(500, { error: "DB Error"});
                } else if (usr.length > 0) {
                    usr.forEach(function(u) {
                        if (u.role =='professor'){
                            res.view();
                        }
                        else {
                            res.send(400, {error: "You don't have permission to create a Subject"})
                        }
            });
                }
            });
        }
        else {
            res.redirect('/login');
        };

    },

    createsubject_post : function (req,res) {
        //If the subject does not exist in the selected term, save it, otherwise send a error message.
        var regis = false;
        Subjects.find({
            or : [
                {name : req.body.name},
                {term : req.body.term}
            ]
        }).done(function(err,usr) {
                if(err) {
                    res.send(500, { error: "DB Error"});
                } else if (usr.length > 0) {
                    usr.forEach(function(u) {
                        if (u.name == req.body.name){
                            if (u.term == req.body.term) {
                            regis=true;
                            res.send(400, {error: "There is already a Subject with this name in this term"});}
                        };
                    });
                }
                if (!regis){
                    Users.findByUsername(req.session.user).done(function(er,us){
                        if(er){
                            req.send(500, {error: "DB Error"});
                        } else {
                            Subjects.create({
                                name: req.body.name,
                                professor: us[0].firstname + ' ' + us[0].lastname,
                                term: req.body.term
                            }).done(function (e,sub){
                                    if(e){
                                        req.send(500, {error: "DB Error"});
                                    } else {
                                        res.redirect('/menu');
                                    };
                                });
                        }

                    });
                }
            });

    },

    enroll : function (req,res) {
        //if there is already an authenticated session, access the enroll page, getting the list of available courses first.
        //otherwise, it will render the login page.
        if (req.session.user) {
            Subjects.find()
                .limit(10).done(function(err,usr) {
                    if(err) {
                        res.send(500, { error: "DB Error"});
                    } else {
            res.view({list:usr});}
                });
        } else {
            res.redirect('/login');
        };
    },
    enroll_post : function (req,res) {
        //if there is already an authenticated session, return OK.
        //otherwise, it will render the login page.
        var regist = false;
        Users.findByUsername(req.session.user).done(function(err,usr){
            if(err){
                req.send(500, {error: "DB Error"});
            } else {
                Subjects.findByName(req.body.subject).done(function (erro,u){
                    if (u.length == 0) {
                        res.send(400, {error: "Subject does not exist."});
                    }
                    else if(u.length > 0){
                        Users_Subjects.findBySubjectID(u[0].id).done(function(er,us) {
                            if (us.length>0){us.forEach(function(a){
                                if (a.userID == usr[0].id){
                                    if (a.subjectID == u[0].id) {
                                        regist=true;
                                        res.send(400, {error: "You are already enrolled in this subject"});}
                                };
                            });
                            }
                            if (!regist) {console.log(regist);
                                Users_Subjects.create({
                                    subjectID: u[0].id,
                                    userID: usr[0].id
                                }).done(function (e,usrt){
                                        if(e){
                                            req.send(500, {error: "DB Error"});
                                        } else {
                                            res.redirect('/menu');
                                        };
                                    });
                            }
                        })
                    }

                });
            }
        });
    }
};