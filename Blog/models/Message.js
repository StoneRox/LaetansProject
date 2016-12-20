const mongoose = require('mongoose');

let messageSchema = mongoose.Schema({
    content: {type: String, required: true},
    author: {type:mongoose.Schema.Types.ObjectId, ref:'User'},
    userSides: [{type:mongoose.Schema.Types.ObjectId, ref:'User'}],
    date: {type: Date, default: Date.now}
});

const Message = mongoose.model('Message', messageSchema);