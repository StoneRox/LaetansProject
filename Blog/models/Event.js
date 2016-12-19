const mongoose = require('mongoose');

let eventSchema = mongoose.Schema({
    title: {type: String, required: true, unique: true},
    description: {type: String, required: true},
    location: {type: String, required: true},
    attendanceLimit: {type: Number, min: 0, required: false},
    attendees: [{type:mongoose.Schema.Types.ObjectId, ref:'User'}],
    author: {type: mongoose.Schema.ObjectId, required: true, ref: 'User'},
    picture: {type: String, required: false},
    eventStart: {type: Date, default: Date.now},
    eventEnd: {type: Date, default: Date.now},
    status: {type: String, default: "Upcoming"}
});

eventSchema.method({

});

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;