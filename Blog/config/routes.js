const userController = require('./../controllers/user');
const homeController = require('./../controllers/home');
const articleController = require('./../controllers/article');
const adminController = require('./../controllers/admin/admin');
const tagController = require('./../controllers/tag');
const searchController = require('./../controllers/search');
const eventController = require('./../controllers/event');



module.exports = (app) => {
    app.get('/', homeController.index);
    app.get('/category/:id', homeController.listCategoryArticles);

    app.get('/user/register', userController.registerGet);
    app.post('/user/register', userController.registerPost);

    app.get('/user/login', userController.loginGet);
    app.post('/user/login', userController.loginPost);

    app.get('/user/logout', userController.logout);
    app.get('/article/create', articleController.createGet);
    app.post('/article/create', articleController.createPost);
    app.get('/article/details/:id', articleController.details);
    app.get('/article/edit/:id',articleController.editGet);
    app.post('/article/edit/:id',articleController.editPost);
    app.get('/article/delete/:id', articleController.deleteGet);
    app.post('/article/delete/:id', articleController.deletePost);
    app.get('/tag/:name', tagController.listArticleByTag);

    app.use((req,res, next) => {
        if (req.isAuthenticated()){
            next();
        } else {
            res.redirect('/user/login');
        }
    });
    app.post('/result', searchController.searchTitlesAndUsers);
    app.get('/user/details', userController.details);
    app.post('/user/details', userController.changeUserInfo);
    app.get('/user/contacts', userController.contactsGet);
    app.get('/user/details/:id', userController.inspectProfile);
    app.post('/user/details/:id', userController.contactsPost);
    app.get('/user/:id/articles', userController.articlesByUser);
    app.get('/user/delete/', userController.deleteProfileGet);
    app.post('/user/delete/', userController.deleteProfilePost);

    app.get('/event/create', eventController.createGet);
    app.post('/event/create', eventController.createPost);
    app.get('/event/list', eventController.listAll);
    app.get('/event/details/:id', eventController.details);


    app.use((req,res, next) => {
            req.user.isInRole('Admin').then(isAdmin => {
                if(isAdmin){
                    next();
                } else {
                    res.redirect('/');
                }
            })
    });
    app.get('/admin/user/all', adminController.user.all);

    app.get('/admin/user/edit/:id', adminController.user.editGet);
    app.post('/admin/user/edit/:id', adminController.user.editPost);

    app.get('/admin/user/delete/:id', adminController.user.deleteGet);
    app.post('/admin/user/delete/:id', adminController.user.deletePost);

    app.get('/admin/category/all', adminController.category.all);

    app.get('/admin/category/create', adminController.category.createGet);
    app.post('/admin/category/create', adminController.category.createPost);

    app.get('/admin/category/edit/:id', adminController.category.editGet);
    app.post('/admin/category/edit/:id', adminController.category.editPost);

    app.get('/admin/category/delete/:id',adminController.category.deleteGet);
    app.post('/admin/category/delete/:id', adminController.category.deletePost);
};

