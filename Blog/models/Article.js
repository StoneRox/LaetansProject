const mongoose = require('mongoose');

//Article model should be renamed to "Article" to fit the naming convention between the other models. TODO: check on calls in the code to this model before rename.

let articleSchema = mongoose.Schema(
    {
        title: {type: String, required: true},
        content: {type: String, required: true},
        author: {type: mongoose.Schema.ObjectId, required: true, ref: 'User'},
        category: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Category'},
        tags: [{type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Tag'}],
        picture: {type: String, required: false},
        date: {type: Date, default: Date.now}
    }
);
articleSchema.method({
    prepareInsert: function () {
        let User = mongoose.model('User');
        User.findById(this.author).then(user => {
            user.articles.push(this.id);
            user.save();
        });

        let Category = mongoose.model('Category');
        Category.findById(this.category).then(category =>{
            if(category){
                category.articles.push(this.id);
                category.save();
            }
        });

        let Tag = mongoose.model('Tag');
        for (let tagId of this.tags){
            Tag.findById(tagId).then(tag => {
                if(tag){
                    tag.articles.push(this.id);
                    tag.save();
                }
            });
        }
    },

    prepareDelete: function () {
        let User = mongoose.model('User');
        User.findById(this.author).then(user => {
            //if user is not deleted already - when we delete from User.
            if(user){
                user.articles.remove(this.id);
                user.save();
            }
        });
        let Category = mongoose.model('Category');
        Category.findById(this.category).then(category => {
            if(category){
                category.articles.remove(this.id);
                category.save();
            }
        });

        let Tag = mongoose.model('Tag');
        for (let tagId of this.tags){
            Tag.findById(tagId).then(tag => {
                if(tag){
                    tag.articles.remove(this.id);
                    tag.save();
                }
            });
        }
    },

    deleteTag: function (tagId) {
        this.tags.remove(tagId);
        this.save();
    },

});
const Article = mongoose.model('Article', articleSchema);
module.exports = Article;
