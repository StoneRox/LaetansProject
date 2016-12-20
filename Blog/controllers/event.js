const Event = require('mongoose').model('Event');
const User = require('mongoose').model('User');

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

    editGet: (req, res) => {
        let id = req.params.id;

        Event.findById(id).then(event => {
            res.render('event/editEvent', {event: event});
        })
    },

    editPost: (req, res) => {
        let id = req.params.id;

        let eventArgs = req.body;

        let errorMsg = '';
        if (!eventArgs.title) {
            errorMsg = 'Article title cannot be empty!';
        }
        else if (!eventArgs.description) {
            errorMsg = 'Article content cannot be empty!';
        }
        if (errorMsg) {
            res.render('event/details/editEvent', {error: errorMsg})
        }

        else {

            if (!req.isAuthenticated()) {
                let returnUrl = `/event/editEvent/${id}`;
                req.session.returnUrl = returnUrl;

                res.redirect('/user/login');
                return;
            }

            Event.findById(id).then(event => {

                event.title = eventArgs.title;
                event.location = eventArgs.location;
                event.attendanceLimit = eventArgs.attendanceLimit;
                event.eventStart = eventArgs.eventStart;
                event.eventEnd = eventArgs.eventEnd;
                event.description = eventArgs.description;
                event.picture = eventArgs.picture;

                event.save((err) => {
                    if (err) {
                        console.log(err.message);
                    }
                });
                res.redirect(`/event/details/${id}`);
            });

        }
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

        //This checks if the user has joined this event. Join button if "-1", else a Not_Going button.
        Event.findById(id).then(event => {
            let hasJoined = req.user.eventsJoined.indexOf(event.id);
            if (hasJoined !== -1) {
                hasJoined = true;
            }
            else {
                hasJoined = false
            }



            //update status
            if (event.isExpired(event)){
                event.status = "Over";
                event.save();
            }

            if (!req.user.isEventAuthor(event)){
                res.render('event/details', {event: event, isUserAuthorized: false, hasJoined: hasJoined});
                return;
            }

            req.user.isInRole('Admin').then(isAdmin => {
                let isUserAuthorized = isAdmin || req.user.isEventAuthor(event);
                res.render('event/details', {event: event, isUserAuthorized: isUserAuthorized, hasJoined: hasJoined});
            })
        })
    },

    joinEventGet: (req, res) =>{
        let id = req.params.id;

        Event.findById(id).then(event => {
            res.render('event/joinEvent', {event: event});
        })
    },

    joinEventPost: (req, res) => {
        let id = req.params.id;
        Event.findById(id).then(event => {
            event.attendees.push(req.user.id);
            event.save();
            User.findById(req.user.id).then(user => {
               user.eventsJoined.push(event.id);
               user.save();
            });

            res.redirect('/event/list');
        })

    },

    leaveEventGet: (req, res) => {
        let id = req.params.id;

        Event.findById(id).then(event => {
            res.render('event/leaveEvent', {event: event});
        })
    },

    leaveEventPost: (req, res) => {
        let id = req.params.id;
        Event.findById(id).then(event => {
            event.attendees.remove(req.user.id);
            event.save();
            User.findById(req.user.id).then(user => {
                user.eventsJoined.remove(event.id);
                user.save();
            });

            res.redirect('/event/list');
        })
    },

    deleteEventGet: (req, res) => {
        let id = req.params.id;

        Event.findById(id).then(event => {
            res.render('event/deleteEvent', {event: event});
        })
    },
    deleteEventPost: (req, res) => {
        let id = req.params.id;
        Event.findById(id).then(event => {

            User.find({eventsJoined: event.id}).then(users => {
                //finds all users who have joined the event, removes the event
                users.forEach(function(user){
                    user.eventsJoined.remove(event.id);
                    user.save();
                    event.attendees.remove(user.id);
                    event.save();
                })
            });

            User.findOne({events: event.id}).then(author => {
                author.events.remove(event.id);
                author.save();
            });

            event.remove();
            event.save();

            res.redirect('/event/list');
        })
    }
};