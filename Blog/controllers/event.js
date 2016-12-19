const Event = require('mongoose').model('Event');

module.exports = {
    createGet: (req, res) => {
        if (!req.isAuthenticated()) {
            let returnUrl = '/event/create';
            req.session.returnUrl = returnUrl;

            res.render('user/login');
            return;
        }

        res.render('event/create');
    },

    createPost: (req, res) => {
        if (!req.isAuthenticated()) {
            let returnUrl = '/event/create';
            req.session.returnUrl = returnUrl;

            res.render('user/login');
            return;
        }
        let eventArgs = req.body;

        eventArgs.author = req.user.id;

        Event.create(eventArgs).then(event => {
            req.user.events.push(event.id);
            req.user.save((err)=>{
                console.log(err);
            });
            res.redirect('/')
        })
    },

    listAll: (req, res) => {
        Event.find({}).then(events => {
            res.render('event/list', {events: events});
        })
    },

    details: (req, res) => {
        //TODO: Bug - if you specified an invalid picture location when creating the event, console logs error. Currently we only check if the passed value is null.
        let id = req.params.id;

        Event.findById(id).populate('author').then(event => {
            if (!req.user.isEventAuthor(event)){
                res.render('event/details', {event: event, isUserAuthorized: false});
                return;
            }

            req.user.isInRole('Admin').then(isAdmin => {
                let isUserAuthorized = isAdmin || req.user.isEventAuthor(event);
                res.render('event/details', {event: event, isUserAuthorized: isUserAuthorized});
            })
        })
    },
};