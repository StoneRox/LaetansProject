const Article = require('mongoose').model('Article');
const User = require('mongoose').model('User');

module.exports = {

    searchTitlesAndUsers: (req,res) => {
        let searchWord = req.body;


        Article.find({}).then(articles => {
            let resultArticles = [];
            for(let article of articles){

                if(article.title.toLowerCase().indexOf(searchWord.search_word.toString().toLowerCase()) !== -1){
                    resultArticles.push(article);
                }
            }
            User.find({}).then(users => {
                let resultUsers = [];
                for(let user of users) {

                    if (user.fullName.toLowerCase().indexOf(searchWord.search_word.toString().toLowerCase()) !== -1) {
                        resultUsers.push(user);
                    }
                }
                for(let article of resultArticles)
                {
                    let contentCut = 300;
                    if(article.content.length < 300){
                        contentCut = article.content.length;
                    }
                    article.content = article.content.substr(0, contentCut) + '...';
                }
                res.render('searchResult/result', {result: {resultArticles, resultUsers}, search_word: searchWord.search_word})
            });
        });
    },

};