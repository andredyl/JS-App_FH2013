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
        if (req.session.user) {
            res.view();
        } else {
            res.redirect('/login');
        };
    }
}