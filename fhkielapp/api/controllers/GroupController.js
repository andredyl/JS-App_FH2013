/**
 * GroupController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */


module.exports = {

    creategroup : function (req,res) {
        //if there is already an authenticated session, and the user is a professor, display the create subject page
        //otherwise, it will render the login page.
        if (req.session.user) {
            Users.findByUsername(req.session.user).done(function(err,usr){
                if(err) {
                    res.send(500, { error: "DB Error"});
                } else  {
                    Users_Groups.findByUserID(usr[0].id).done(function(er,us) {
                        if(er) {
                            res.send(500, { error: "DB Error"});
                        }
                        else {
                            if (us.length>0){
                            us.forEach(function(z){
                            Groups.findById(z.groupID).done(function(error,a){
                                    if (a[0].subjectID==req.session.subjectid){
                                        res.send(400, {error:"You are already part of a group"});
                                    }
                                    else
                                    {
                                        res.view({layout:"layout_extended"});
                                    }

                                });
                            });
                            }
                            else {
                                res.view({layout:"layout_extended"});
                            }

                        }
                    });
                }
            });
        }
        else {
            res.redirect('/login');
        };

    },

    creategroup_post : function(req,res) {
        if (req.session.user) {
        Users.findByUsername(req.session.user).done(function(e,u){
            if (e){
                res.send(500, { error: "DB Error"});
            } else  {
            Projects.findBySubjectID(req.session.subjectid).done(function(err,usr){
                if (usr.length>0){
                    Groups.create({
                        projectID:usr[0].id,
                        subjectID:req.session.subjectid,
                        name:req.body.name,
                        description:req.body.description
                    }).done(function(er,us){
                            Groups.findByName(req.body.name).done(function(error,gr){
                            if(gr.length>0){
                            Users_Groups.create({
                                groupID:gr[0].id,
                                userID:u[0].id
                            }).done(function(a,b){
                                    if(a){
                                        res.send(500, {error: "DB Error"});
                                    } else {
                                        res.redirect('/landing');
                                    }
                                });
                            }
                            });
                        });
                }
                else {
                    res.send(400,{error:"There is no Project for this Subject yet"});
                }
            });
            }
        });
        }
    },

    group: function(req,res){
        if (req.session.user) {
            Posts.findByGroupID(req.session.groupid).done(function(err,usr){
                res.view({layout:"layout_extended",history:usr});
            });

        } else {
            res.redirect('/login');
        };
    },

    group_post: function(req,res){
        if (req.session.user) {
            var fecha= new Date();
            Posts.create({
                groupID:req.session.groupid,
                text:req.body.message,
                date:fecha
            }).done(function(a,b){
            res.redirect('/group');
                });
        } else {
            res.redirect('/login');
        };
    },

    addmember_post: function(req,res){
        if (req.session.user) {
            Users.findByUsername(req.body.uname).done(function(err,usr){
                if (usr.length>0){
                    Users_Subjects.findByUserID(usr[0].id).done(function(er,us){
                        if (us.length>0){
                            Users_Groups.create({
                                groupID:req.session.groupid,
                                userID:usr[0].id
                            }).done(function(a,b){
                                    res.redirect('/group');
                                });

                        } else {
                            res.send(400,{error:"The username is not enrolled in this subject"});
                        }

                    });

                } else {
                    res.send(400,{error:"The username does not exist"});
                }
            });

        } else {
            res.redirect('/login');
        };
    }

}