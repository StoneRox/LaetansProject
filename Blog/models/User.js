const mongoose = require('mongoose');
const Role = require('mongoose').model('Role');
const encryption = require('./../utilities/encryption');

let userSchema = mongoose.Schema(
    {
        email: {type: String, required: true, unique: true},
        passwordHash: {type: String, required: true},
        fullName: {type: String, required: true},
        salt: {type: String, required: true},
        articles: [{type: mongoose.Schema.ObjectId, ref: 'Article'}],
        roles: [{type: mongoose.Schema.Types.ObjectId, ref: 'Role'}],
        avatar: {type: String, required: false, default: '/images/avatar_default.jpg'},
        userInformation: {type: String, required: false},
        contacts: [{type: String, required: false}],
        //events: [{type: mongoose.Schema.ObjectId, ref: 'Event'}],
        events: {type: [mongoose.Schema.ObjectId], default: []},
        userComments:  [{type: mongoose.Schema.ObjectId, ref: 'Comment'}],


        messages: [{type: mongoose.Schema.ObjectId, ref: 'Message'}],
        unreadMessagesFrom: [{type: mongoose.Schema.ObjectId, ref: 'User'}],
    }
);

userSchema.method({
    authenticate: function (password) {
        let inputPasswordHash = encryption.hashPassword(password, this.salt);
        let isSamePasswordHash = inputPasswordHash === this.passwordHash;

        return isSamePasswordHash;
    },
    isAuthor: function (article) {
        if (!article) {
            return false;
        }
        let isAuthor = article.author.equals(this.id);
        return isAuthor;
    },

    isEventAuthor: function (event) {
        if (!event) {
            return false;
        }
        let isAuthor = event.author.equals(this.id);
        return isAuthor;
    },
    isInRole: function (roleName) {
        return Role.findOne({name: roleName}).then(role => {
            if (!role) {
                return false;
            }

            let isInRole = this.roles.indexOf(role.id) !== -1;
            return isInRole;
        })
    },

    prepareInsert: function () {
        for (let role of this.roles) {
            Role.findById(role).then(role => {
                role.users.push(this.id);
                role.save();
            })
        }
    },
    prepareDelete: function () {
        for(let role of this.roles){
            Role.findById(role).then(role => {
                role.users.remove(this.id);
                role.save();
            })
        }
        let Article = mongoose.model('Article');
        for(let article of this.articles){
            Article.findById(article).then(article => {
                article.prepareDelete();
                article.remove();
            })
        }
        let Message = mongoose.model('Message');
        for(let contact of this.contacts){
            User.findById(contact).then(c => {
                c.contacts.splice(c.contacts.indexOf(this.id),1);
                for(let message of this.messages){
                    Message.findOneAndRemove({_id: message}).then(m => {
                        c.messages.splice(c.messages.indexOf(m.id));
                    })
                }
                c.save();
            })
        }
        let Comment = mongoose.model('Comment');
        for(let comment of this.userComments){
            Comment.findById(comment).then( c => {
                Article.findById(c.article).then(a => {
                    a.articleComments.splice(a.articleComments.indexOf(comment),1);
                    c.remove();
                })
            })
        }
    },


});

userSchema.set('versionKey', false);

const User = mongoose.model('User', userSchema);

module.exports = User;

module.exports.seedAdmin = () => {
    let email = 'admin@softuni.bg';
    User.findOne({email: email}).then(admin => {
        if (!admin) {
            Role.findOne({name: 'Admin'}).then(role => {
                let salt = encryption.generateSalt();
                let passwordHash = encryption.hashPassword('admin', salt);

                let roles = [];
                roles.push(role.id);

                let user = {
                    email: email,
                    passwordHash: passwordHash,
                    fullName: 'Admin',
                    articles: [],
                    salt: salt,
                    roles: roles
                };
                User.create(user).then(user => {
                    role.users.push(user.id);
                    role.save(err => {
                        if (err) {
                            console.log(err.message);
                        } else {
                            console.log('Admin seeded successfully!')
                        }
                    });
                })
            })
        }

    })
};


