const Article = require('mongoose').model('Article');
const Tag = require('mongoose').model('Tag');
const Category = require('mongoose').model('Category');

module.exports = {
    listArticleByTag: (req,res) => {
        let name = req.params.name;

        Tag.findOne({name: name}).then(tag => {
            Article.find({tags: tag.id}).populate('author tags').then(articles => {
                Category.find({}).then(categories => {
                    for(let article of articles)
                    {
                        let contentCut = 300;
                        if(article.content.length < 300){
                            contentCut = article.content.length;
                        }
                        article.content = article.content.substr(0, contentCut) + '...';
                    }
                    res.render('tag/details', {articles: articles, tag: tag, categories: categories});
                })

            })
        })
    }
};
