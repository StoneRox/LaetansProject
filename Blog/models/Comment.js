const mongoose = require('mongoose');

let commentSchema = mongoose.Schema(
    {
        content: {type: String, required: true},
        author: {type: mongoose.Schema.ObjectId, required: true, ref: 'User'},
        article: {type: mongoose.Schema.ObjectId, required: true, ref: 'Article'},
        date: {type: Date, default: Date.now}
    }
);
const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;