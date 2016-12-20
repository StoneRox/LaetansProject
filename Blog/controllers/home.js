const mongoose = require('mongoose');
const Article= mongoose.model('Article');
const Category = require('mongoose').model('Category');
const User = require('mongoose').model('User');
const Tag = require('mongoose').model('Tag');
module.exports = {
 index: (req, res) => {
     Category.find({}).then(categories => {
         let user = req.user;
         if(user){
             User.findById(user.id).populate('unreadMessagesFrom').then(u =>{

                 res.render('home/index', {categories: categories, user: u})
             });
         }
         else {
             res.render('home/index', {categories: categories, user: user})
         }
     })
 },
    listCategoryArticles: (req,res) => {
     let id = req.params.id;

     Category.findById(id).populate('articles').then(category => {
         User.populate(category.articles, {path: 'author'}, (err) => {
             if(err){
                 console.log(err.message)
             }
             Tag.populate(category.articles, {path: 'tags'}, (err) => {
                 if(err){
                     console.log(err.message);
                 }
                 Category.find({}).then(categories => {
                     for(let article of category.articles)
                     {
                         let contentCut = 300;
                         if(article.content.length < 300){
                             contentCut = article.content.length;
                         }
                         article.content = article.content.substr(0, contentCut) + '...';
                     }

                     res.render('home/article', {articles: category.articles, category: category, categories: categories});
                 })
             })
         });
     });
    }

};