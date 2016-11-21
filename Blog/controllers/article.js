const Article = require('mongoose').model('Article');
const Category = require('mongoose').model('Category');
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
            let tagNames = articleArgs.tagNames.split(/\s+|,/).filter(tag => {return tag});

            initializeTags(tagNames, article.id);
            article.prepareInsert();
            res.redirect('/');
        });
    },
    details: (req, res) => {
        let id = req.params.id;

        Article.findById(id).populate('author tags').then(article => {
            if (!req.user) {
                Category.find({}).then(categories => {
                    res.render('article/details', {article: article, isUserAuthorized: false, categories: categories});
                });
                return;
            }
            req.user.isInRole('Admin').then(isAdmin => {
                let isUserAuthorized = isAdmin || req.user.isAuthor(article);
                Category.find({}).then(categories => {
                    res.render('article/details', {article: article, isUserAuthorized: isUserAuthorized, categories: categories});
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
                    article.tagNames = article.tags.map(tag => {return tag.name});
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

                let newTagNames = articleArgs.tags.split(/\s+|,/).filter(tag => {return tag});

                let oldTags = article.tags.filter(tag => {return newTagNames.indexOf(tag.name) === -1;});

                for(let tag of oldTags){
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
                    article.tagNames = article.tags.map(tag => {return tag.name});
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

    searchTitles: (req,res) => {
        let searchWord = req.body;
        let result = [];

        Article.find({}).then(articles => {
            for(let article of articles){

                if(article.title.toLowerCase().indexOf(searchWord.search_word.toString().toLowerCase()) !== -1){
                    result.push(article);
                }
            }
            res.render('article/result', {result: result, search_word: searchWord.search_word})
        });
    }
};