/**
 * GroupController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */


module.exports = {

    creategroup : function (req,res) {
        //if there is already an authenticated session, and the user does not have a group, access the create group page
        //otherwise, it will render the error message.
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
                                        res.view({error:false, layout:"layout_extended"});
                                    }

                                });
                            });
                            }
                            else {
                                res.view({error:false, layout:"layout_extended"});
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
        //Checks if the subject has a project, if it is true creates the group, otherwise it is redirected to the menu
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
                    //res.send(400,{error:"There is no Project for this Subject yet"});
                    return res.view("group/creategroup",{error:"There is no Project for this Subject yet", layout:"layout_extended" });
                }
            });
            }
        });
        }
    },

    group: function(req,res){
        //if the user is logged in, displays the list of students to add and the previous posts
        if (req.session.user) {
            Posts.findByGroupID(req.session.groupid).limit(25).done(function(err,usr){
                    Users.find({role:'student'})
                        .limit(50).done(function(er,us) {
                            if(er) {
                                res.send(500, { error: "DB Error"});
                            } else {
                                res.view({error:false, list:us,layout:"layout_extended",history:usr});}
                        });
                });

        } else {
            res.redirect('/login');
        };
    },

    group_post: function(req,res){
        //sends the post to the DB and refreshes the page
        if (req.session.user) {
            var fecha= new Date();
            Users.findByUsername(req.session.user).done(function(err,usr){
                Posts.create({
                    groupID:req.session.groupid,
                    sender:usr[0].firstname+' '+usr[0].lastname,
                    text:req.body.message,
                    date:fecha
                }).done(function(a,b){
                        res.redirect('/group');
                    });
            });
        } else {
            res.redirect('/login');
        };
    },

    addmember_post: function(req,res){
        //checks if the member is not enrolled in the subject, if applies, adds it to the group
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