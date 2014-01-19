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
                                professor: us[0].id,
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
                .limit(20).done(function(err,usr) {
                    if(err) {
                        res.send(500, { error: "DB Error"});
                    } else {
            res.view({list:usr,layout:"layout_extended"});}
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
                            if (!regist) {
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
    },

    subjectmenu: function (req,res){
    var project='Currently there is no project defined';
    var exam='The dates of the exam are not defined yet';
    var bo=false;
    if (req.session.user) {
        Subjects.findByName(req.param("subject")).done(function(err,usr){
            if (usr.length >0){
                Projects.findBySubjectID(usr[0].id).done(function(er,us){
                    if (us.length>0){project=us[0].name+': '+us[0].description+' Deadline: '+us[0].deadline;}
                    Exams.findBySubjectID(usr[0].id).done(function(e,u){
                        if (u.length>0){exam='Date First Round: '+u[0].date1+'\n Date Second Round: '+u[0].date2;}
                        req.session.subjectid=usr[0].id;
                        Users.findByUsername(req.session.user).done(function(d,f){
                            Groups.findBySubjectID(req.session.subjectid).done(function(g,h){
                                Users_Groups.findByUserID(f[0].id).done(function(k,l){
                                    l.forEach(function(t){
                                        h.forEach(function(y){
                                            if(y.id== t.groupID){
                                                bo=true;
                                                req.session.groupid= t.groupID;
                                                req.session.projectid=us[0].id;
                                            }
                                        });
                                    });
                                });

                            });
                        });
                setTimeout(function(){res.view({sub:req.param("subject"),ex:exam,pr:project,hasgroup:bo});},200);
            });
                });}
            else {
                res.send(400,{error: "invalid link"})
            }
        });

    } else {
        res.redirect('/login');
    }
    },

    createexam: function (req,res){
    if (req.session.user) {
        Users.findByUsername(req.session.user).done(function(err,usr){
            if(err) {
                res.send(500, { error: "DB Error"});
                }
            else {
                if (usr[0].role =='professor'){
                    res.view();
                }
                else {
                    res.send(400, {error: "You don't have permission to create an Exam"})
                }
            }
            });
        }
    else {
        res.redirect('/login');
    }
    },

    createexam_post: function(req,res){
    var regist = false;
    Subjects.findByName(req.body.subject).done(function(err,usr){
            if(err){
                res.send(500, {error:"DB Error"});
            }
            else {
                if (usr.length>0){
                    Users.findByUsername(req.session.user).done(function(er,us){
                       if(usr[0].professor==us[0].id){
                           Exams.findBySubjectID(usr[0].id).done(function(e,u){
                               if(u.length>0){
                                   regist=true;
                                   res.send(400, {error:"There is a registered exam for this subject"});
                               }

                           if (!regist){
                           Exams.create({
                               subjectID: usr[0].id,
                               date1: req.body.date1,
                               date2: req.body.date2
                           }).done(function (e,u){
                                   Calendar.create({
                                           username : usr[0].id.toString(),
                                           _id : Math.floor((Math.random()*10000)+1).toString(),
                                           start_date : req.body.date1,
                                           end_date : req.body.date1,
                                           text : req.body.subject+' Exam'
                                       }
                                   ).done(function(ab,cd){
                                           if(ab){
                                               res.send(500, {error: "DB Error"});
                                           } else {
                                               Calendar.create({
                                                       username : usr[0].id.toString(),
                                                       _id : Math.floor((Math.random()*10000)+1).toString(),
                                                       start_date : req.body.date2,
                                                       end_date : req.body.date2,
                                                       text : req.body.subject+' Exam'
                                                   }
                                               ).done(function(fg,hi){
                                                       if(fg){
                                                           res.send(500, {error: "DB Error"});
                                                       } else {
                                                           res.redirect('/menu');
                                                       }});
                                           }});
                               });
                           }
                           });
                       }
                        else {
                           res.send(400, {error:"The Subject was not created by you"});
                       }
                    });
                }
                else{
                    res.send(400, {error:"The Subject does not exist"});
                }
            }
        });
    },

    createproject: function (req,res){
        if (req.session.user) {
            Users.findByUsername(req.session.user).done(function(err,usr){
                if(err) {
                    res.send(500, { error: "DB Error"});
                }
                else {
                    if (usr[0].role =='professor'){
                        res.view();
                    }
                    else {
                        res.send(400, {error: "You don't have permission to create an Exam"})
                    }
                }
            });
        }
        else {
            res.redirect('/login');
        }
    },

    createproject_post: function(req,res){
        var regist = false;
        Subjects.findByName(req.body.subject).done(function(err,usr){
            if(err){
                res.send(500, {error:"DB Error"});
            }
            else {
                if (usr.length>0){
                    Users.findByUsername(req.session.user).done(function(er,us){
                        if(usr[0].professor==us[0].id){
                            Projects.findBySubjectID(usr[0].id).done(function(e,u){
                                if(u.length>0){
                                    regist=true;
                                    res.send(400, {error:"There is a registered project for this subject"});
                                }

                                if (!regist){
                                    Projects.create({
                                        subjectID: usr[0].id,
                                        name: req.body.pname,
                                        deadline: req.body.deadline,
                                        description: req.body.description
                                    }).done(function (e,u){
                                            Calendar.create({
                                                        username : usr[0].id.toString(),
                                                        _id : Math.floor((Math.random()*10000)+1).toString(),
                                                        start_date : req.body.deadline,
                                                        end_date : req.body.deadline,
                                                        text : req.body.subject+' Project Deadline'
                                                    }
                                            ).done(function(ab,cd){
                                                    if(ab){
                                                        res.send(500, {error: "DB Error"});
                                                    } else {
                                                res.redirect('/menu');
                                            }});

                                        });
                                }
                            });
                        }
                        else {
                            res.send(400, {error:"The Subject was not created by you"});
                        }
                    });
                }
                else{
                    res.send(400, {error:"The Subject does not exist"});
                }
            }
        });
    }
}

