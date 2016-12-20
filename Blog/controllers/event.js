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
            let upcomingEvents = [];
            let expiredEvents = [];
            let cancelledEvents= [];
            events.forEach( function (entry) {
                if (entry.status == "Upcoming"){
                    upcomingEvents.push(entry)
                }
                else if (entry.status == "Over"){
                    expiredEvents.push(entry);
                }
                else if(entry.status == "Cancelled"){
                    cancelledEvents.push(entry);
                }
            });
            //res.render('event/list', {events: events});
            res.render('event/list', {upcomingEvents: upcomingEvents, expiredEvents: expiredEvents, cancelledEvents: cancelledEvents});
        })
    },

    details: (req, res) => {
        //TODO: Bug - if you specified an invalid picture location when creating the event, console logs error. Currently we only check if the passed value is null.
        let id = req.params.id;

        //compromise - Localhosting doesn't have cronjobs, and I can't find how to schedule a check to see if event expired to update the status in the DB.
        // that's why we are making the check and update when opening up the details on the event.

        Event.findById(id).populate('author').then(event => {

            //update status
            if (event.isExpired(event)){
                event.status = "Over";
                event.save();
            }

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