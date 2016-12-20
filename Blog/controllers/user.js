const User = require('mongoose').model('User');
const Role = require('mongoose').model('Role');
const Article = require('mongoose').model('Article');
const Message = require('mongoose').model('Message');
const encryption = require('./../utilities/encryption');

module.exports = {
    registerGet: (req, res) => {
        res.render('user/register');
    },

    registerPost: (req, res) => {
        let registerArgs = req.body;

        User.findOne({email: registerArgs.email}).then(user => {
            let errorMsg = '';
            if (user) {
                errorMsg = 'User with the same username exists!';
            } else if (registerArgs.password !== registerArgs.repeatedPassword) {
                errorMsg = 'Passwords do not match!'
            }

            if (errorMsg) {
                registerArgs.error = errorMsg;
                res.render('user/register', registerArgs)
            } else {
                let salt = encryption.generateSalt();
                let passwordHash = encryption.hashPassword(registerArgs.password, salt);

                let userObject = {
                    email: registerArgs.email,
                    passwordHash: passwordHash,
                    fullName: registerArgs.fullName,
                    salt: salt
                };
                let roles = [];
                Role.findOne({name: 'User'}).then(role => {
                    roles.push(role.id);
                    userObject.roles = roles;

                    User.create(userObject).then(user => {
                        user.prepareInsert();
                        req.logIn(user, (err) => {
                            if (err) {
                                registerArgs.error = err.message;
                                res.render('user/register', registerArgs);
                                return;
                            }
                            res.redirect('/')
                        })
                    });
                });
            }
        });
    },

    loginGet: (req, res) => {
        res.render('user/login');
    },

    loginPost: (req, res) => {
        let loginArgs = req.body;
        User.findOne({email: loginArgs.email}).then(user => {
            if (!user || !user.authenticate(loginArgs.password)) {
                let errorMsg = 'Either username or password is invalid!';
                loginArgs.error = errorMsg;
                res.render('user/login', loginArgs);
                return;
            }

            req.logIn(user, (err) => {
                if (err) {
                    console.log(err);
                    res.redirect('/user/login', {error: err.message});
                    return;
                }
                let returnUrl = '/';
                if (req.session.returnUrl) {
                    returnUrl = req.session.returnUrl;
                    delete req.session.returnUrl;
                }

                res.redirect(returnUrl);
            })
        })
    },

    logout: (req, res) => {
        req.logOut();
        res.redirect('/');
    },

    details: (req, res) => {
        if (!req.user) {
            res.redirect('/user/login');
        }
        res.render('user/details', req.user);
    },

    changeUserInfo: (req, res) => {
        let body = req.body;
        let user = req.user;

        if (body.avatar_url) {
            user.avatar = body.avatar_url;
            user.save();
        }
        if (body.user_info || body.user_info === '') {
            user.userInformation = body.user_info;
            user.save();
        }
        res.render('user/details', req.user);
    },

    inspectProfile: (req, res) => {
        let id = req.params.id;
        let thisUser = req.user;
        User.findById(id).then(userFound => {
            let user = {
                email: userFound.email,
                fullName: userFound.fullName,
                articles: userFound.articles.length,
                avatar: userFound.avatar,
                userInformation: userFound.userInformation,
                userComments: userFound.userComments
            };
            let inContacts = false;
            if (thisUser.contacts.indexOf(userFound.id) !== -1) {
                inContacts = true;
            }
            let isThis = true;
            if (thisUser.id !== id) {
                isThis = false;
            }
            res.render('user/otherProfile', {user_inspect: user, id: id, inContacts: inContacts, isThis: isThis});
        });
    },

    articlesByUser: (req, res) => {
        let id = req.params.id;
        User.findById(id).then(userFound => {
            let user = userFound.fullName;
            Article.find({author: id}).then(articles => {
                res.render('user/articles', {user_author: user, articles: articles});
            })

        });
    },

    contactsGet: (req, res) => {
        let user = req.user;
        if (user.contacts.length > 0) {
            let contacts = [];
            for (let contact of user.contacts) {
                User.findById(contact).then(c => {
                    let contactName = {
                        name: c.fullName,
                        id: contact,
                        avatar: c.avatar
                    };
                    contacts.push(contactName);
                })
            }
            res.render('user/contacts', {contacts_names: contacts});
        }
        else {
            res.render('user/contacts');
        }
    },

    contactsPost: (req, res) => {
        let body = req.body;
        let user = req.user;
        if (body.contact_id) {
            user.contacts.push(body.contact_id);
            user.save();
            User.findById(body.contact_id).then(contact => {
                contact.contacts.push(user.id);
                contact.save();
            });
            res.redirect(`/user/details/${body.contact_id}`);
        }
        if (body.remove_contact_id) {
            let index = user.contacts.indexOf(body.remove_contact_id);
            user.contacts.splice(index, 1);
            user.save();
            User.findById(body.remove_contact_id).then(contact => {
                contact.contacts.splice(contact.contacts.indexOf(user.id), 1);
                for (let message of user.messages) {
                    Message.findById(message).then( mess => {
                        if(mess.userSides.indexOf(contact.id) != -1){
                            Message.findOneAndRemove({_id: message}).then(m => {
                                if (m) {
                                    contact.messages.splice(contact.messages.indexOf(m.id));
                                    user.messages.splice(user.messages.indexOf(m.id));
                                    contact.save();
                                    user.save();
                                }
                            })
                        }
                    });
                }
                contact.save();
            });
            res.redirect(`/user/details/${body.remove_contact_id}`);
        }
    },
    deleteProfileGet: (req, res) => {
        if (!req.user) {
            res.redirect('/user/login');
        }
        res.render('user/deleteProfile', req.user);
    },

    deleteProfilePost: (req, res) => {
        //TODO: Prep for delete? Delete user articles and delete user from DB
        let id = req.user.id;

        User.findOneAndRemove({_id: id}).then(user => {
            user.prepareDelete();
            res.redirect('/');
        });
    },


    userCommentsGet: (req, res) => {
        let id = req.params.id;
        User.findById(id).populate('userComments').then(user => {
            let comments = user.userComments;
            for (let comment of comments) {
                comment.dateTime = comment.date.toLocaleDateString() + ' ' + comment.date.toLocaleTimeString();
                Article.findById(comment.article).then(article => {
                    comment.article.title = article.title;
                });
                user.isInRole('Admin').then(isAdmin => {
                    if (isAdmin || req.user.id == user.id) {
                        comment.editable = true;
                    }
                });
            }
            res.render(`user/comments`, {comments: comments, author: user});
        });

    },

    userMessagesGet: (req, res) => {
        let id = req.params.id;
        req.user.unreadMessagesFrom.splice(req.user.unreadMessagesFrom.indexOf(id), 1);
        req.user.save();
        Message.find([{author: id} || {author: req.user.id}]).populate('author').then(userMessages => {
            let messages = [];
            for (let mes of userMessages) {
                if (mes.userSides.indexOf(id) != -1 && mes.userSides.indexOf(req.user.id) != -1) {
                    messages.push(mes);
                }
            }
            messages.reverse();
            for (let m of messages) {
                m.datetime = m.date.toLocaleDateString() + ' ' + m.date.toLocaleTimeString();
            }
            User.findById(id).then(user => {
                res.render('user/messages', {messages: messages, contact: user});
            });


        })
    },

    userMessagesPost: (req, res) => {
        let body = req.body;
        let message = {
            content: body.message,
            author: req.user.id,
            userSides: [req.user.id, body.user_id]
        };

        Message.create(message).then(m => {
            req.user.messages.push(m.id);
            req.user.save();
            User.findById(body.user_id).then(user => {
                user.messages.push(m.id);
                if (user.unreadMessagesFrom.indexOf(req.user.id) == -1) {
                    user.unreadMessagesFrom.push(req.user.id);
                }
                user.save();
                res.redirect('back');
            })
        })
    }

};
