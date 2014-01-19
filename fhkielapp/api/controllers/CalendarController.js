/**
 * CalendarController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
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
    
  index : function (req,res) {
      res.view();
  },

    eventHandler: function (req,res) {
        var data = req.body;
        var mode = data["!nativeeditor_status"];
        var sid = data.id;
        var tid = sid;

        function update_response(err, result){
            if (err)
                mode = "error";
            else if (mode == "inserted")
                tid = result.id;

            res.setHeader("Content-Type","text/xml");
            res.send("<data><action type='"+mode+"' sid='"+sid+"' tid='"+tid+"'/></data>");
        }

        switch (mode) {
            case "updated" :
                Calendar.update({id : data.id},{
                    start_date : data.start_date,
                    end_date : data.end_date,
                    text : data.text
                }).done(function(err,event){
                        update_response(err,event);
                    });
                break;
            case "inserted" :
                Calendar.create({
                    username : req.session.user,
                    _id : data.id,
                    start_date : data.start_date,
                    end_date : data.end_date,
                    text : data.text
                }).done(function(err,event){
                        update_response(err,event);
                    });
                break;
            case "deleted" :
                Calendar.destroy({ id : data.id}).done(function(err,event){
                    update_response(err,event);
                });
        }
    },

    getEvents : function (req,res) {
        Calendar.find({username : req.session.user},function(err,events){
            Users.findByUsername(req.session.user).done(function(e,u){
                Users_Subjects.findByUserID(u[0].id).done(function(er,us){
                   if (us.length>0){
                       us.forEach(function(x) {
                           Calendar.find({username: x.subjectID},function(error,ev){
                               if (ev.length>0){
                              events=events.concat(ev)}
                           });setTimeout(function(){res.send(events);},200);
                       });
                   }
                    else {setTimeout(function(){res.send(events);},200);}
                });
            });

        });
    },

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to CalendarController)
   */
  _config: {}

  
};
