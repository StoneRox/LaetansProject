const Comment = require('mongoose').model('Comment');
const Article = require('mongoose').model('Article');
const Category = require('mongoose').model('Category');
const User = require('mongoose').model('User');

const initializeTags = require('./../models/Tag').initializeTags;

module.exports = {
    createGet: (req, res) => {
        if (!req.isAuthenticated()) {
            let returnUrl = '/article/create';
            req.session.returnUrl = returnUrl;

            res.render('user/login');
            return;
        }

        Category.find({}).then(categories => {
            res.render('article/create', {categories: categories});
        })

    },
    createPost: (req, res) => {
        if (!req.isAuthenticated()) {
            let returnUrl = '/article/create';
            req.session.returnUrl = returnUrl;

            res.render('user/login');
            return;
        }
        let articleArgs = req.body;

        articleArgs.author = req.user.id;
        articleArgs.tags = [];


        Article.create(articleArgs).then(article => {
            let tagNames = articleArgs.tagNames.split(/\s+|,/).filter(tag => {
                return tag
            });

            initializeTags(tagNames, article.id);
            article.prepareInsert();
            res.redirect('/');
        });
    },
    details: (req, res) => {
        let id = req.params.id;

        Article.findById(id).populate('author tags articleComments').then(article => {
            for (let i = 0; i < article.articleComments.length; i++) {
                User.findById(article.articleComments[i].author).then(user => {

                    article.articleComments[i].author = user;
                    article.articleComments[i].datetime =
                        article.articleComments[i].date.toLocaleDateString()
                        + ' ' +
                        article.articleComments[i].date.toLocaleTimeString();


                    if (req.user) {
                        req.user.isInRole('Admin').then(isAdmin => {
                            if(isAdmin || req.user.id == user.id){
                                article.articleComments[i].editable = true;
                            }
                        });
                    }
                })
            }
            let date =  article.date.toLocaleDateString() +' ' + article.date.toLocaleTimeString();
            if (!req.user) {
                Category.find({}).then(categories => {
                    res.render('article/details', {article: article, isUserAuthorized: false, categories: categories, date: date});
                });
                return;
            }
            req.user.isInRole('Admin').then(isAdmin => {
                let isUserAuthorized = isAdmin || req.user.isAuthor(article);
                Category.find({}).then(categories => {
                    res.render('article/details', {
                        article: article,
                        isUserAuthorized: isUserAuthorized,
                        categories: categories,
                        loggedUser: true,
                        date: date
                    });
                })
            });
        });
    },
    editGet: (req, res) => {
        let id = req.params.id;

        if (!req.isAuthenticated()) {
            let returnUrl = `/article/edit/${id}`;
            req.session.returnUrl = returnUrl;

            res.redirect('/user/login');
            return;
        }
        Article.findById(id).populate('tags').then(article => {
            req.user.isInRole('Admin').then(isAdmin => {
                if (!isAdmin && !req.user.isAuthor(article)) {
                    res.redirect('/');
                    return;
                }
                Category.find({}).then(categories => {
                    article.categories = categories;
                    article.tagNames = article.tags.map(tag => {
                        return tag.name
                    });
                    res.render('article/edit', article);
                });

            });
        });
    },
    editPost: (req, res) => {
        let id = req.params.id;

        let articleArgs = req.body;

        let errorMsg = '';
        if (!articleArgs.title) {
            errorMsg = 'Article title cannot be empty!';
        }
        else if (!articleArgs.content) {
            errorMsg = 'Article content cannot be empty!';
        }
        if (errorMsg) {
            res.render('article/edit', {error: errorMsg})
        }

        else {

            if (!req.isAuthenticated()) {
                let returnUrl = `/article/edit/${id}`;
                req.session.returnUrl = returnUrl;

                res.redirect('/user/login');
                return;
            }

            Article.findById(id).populate('category tags').then(article => {
                if (article.category.id !== articleArgs.category) {
                    article.category.articles.remove(article.id);
                    article.category.save();
                }

                article.category = articleArgs.category;
                article.title = articleArgs.title;
                article.content = articleArgs.content;
                article.picture = articleArgs.picture;

                let newTagNames = articleArgs.tags.split(/\s+|,/).filter(tag => {
                    return tag
                });

                let oldTags = article.tags.filter(tag => {
                    return newTagNames.indexOf(tag.name) === -1;
                });

                for (let tag of oldTags) {
                    tag.deleteArticle(article.id);
                    article.deleteTag(tag.id);
                }

                initializeTags(newTagNames, article.id);

                article.save((err) => {
                    if (err) {
                        console.log(err.message);
                    }

                    Category.findById(article.category).then(category => {
                        if (category.articles.indexOf(article.id) === -1) {
                            category.articles.push((article.id));
                            category.save();
                        }
                        res.redirect(`/article/details/${id}`);
                    })
                });
            });

        }
    },
    deleteGet: (req, res) => {
        let id = req.params.id;

        if (!req.isAuthenticated()) {
            let returnUrl = `/article/delete/${id}`;
            req.session.returnUrl = returnUrl;

            res.redirect('/user/login');
            return;
        }
        Article.findById(id).populate('category tags').then(article => {
            req.user.isInRole('Admin').then(isAdmin => {
                if (!isAdmin && !req.user.isAuthor(article)) {
                    res.redirect('/');
                    return;
                }

                Category.findOne({articles: article}).then(category => {
                    article.tagNames = article.tags.map(tag => {
                        return tag.name
                    });
                    res.render('article/delete', {article: article, category: category});
                })

            });
        });

    },
    deletePost: (req, res) => {
        let id = req.params.id;
        Article.findOneAndRemove({_id: id}).populate('author').then(article => {
            article.prepareDelete();
            res.redirect('/');
        });
    },

    commentPost: (req, res) => {
        let body = req.body;
        if (!body.comment_id) {
            let user = req.user.id;
            let commentArgs = {};
            commentArgs.content = body.content;
            commentArgs.author = user;
            commentArgs.article = body.article_id;

            Comment.create(commentArgs).then(comment => {
                Article.findById(body.article_id).then(article => {
                    article.articleComments.push(comment.id)
                    article.save();
                    req.user.userComments.push(comment.id);
                    req.user.save();
                });
            });
        }
        else {
            let commentId = body.comment_id;
            let articleId = body.article_id;
            Comment.findById(commentId).then(c => {
                    Article.findById(articleId).then(article => {
                        article.articleComments.splice(article.articleComments.indexOf(commentId), 1);
                        article.save();
                        User.findById(c.author).then(user => {
                            user.userComments.splice(user.userComments.indexOf(c.id),1);
                            user.save();
                        });
                        c.remove();
                    })
            }
            );
        }
        res.redirect('back');
        //res.redirect(`/article/details/${body.article_id}`);
    },


};