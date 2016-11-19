const  Category = require('mongoose').model('Category');

module.exports = {
    all: (req,res) => {
        Category.find({}).then(categories => {
            res.render('admin/category/all', {categories: categories});
        })
    },

    createGet: (req,res) => {
        res.render('admin/category/create');
    },

    createPost: (req,res) => {
        let categoryArgs = req.body;

        if (!categoryArgs.name){
            let errorMsg = 'Category name cannot be null!';
            categoryArgs.error = errorMsg;
            res.render('admin/category/create', categoryArgs)
        }
        else {
            Category.findOne({name: categoryArgs.name}).then(category => {
                let errorMsg = '';
                if (category) {
                    errorMsg = 'This category name already exists!';
                }

                if (errorMsg) {
                    categoryArgs.error = errorMsg;
                    res.render('admin/category/create', categoryArgs)
                } else {
                    Category.create(categoryArgs).then(category => {
                        res.redirect('/admin/category/all');
                    })
                }
            });
        }
    },
    editGet: (req,res) => {
        let id = req.params.id;

        Category.findById(id).then(category => {
            res.render('admin/category/edit', {category: category});
        });
    },
    editPost: (req,res) => {
        let id = req.params.id;

        let editArgs = req.body;

        if(!editArgs.name){
            let errorMessage = 'Category name cannot be null!';

            Category.findById(id).then(category => {
                res.render('admin/category/edit', {category: category, errorMessage: errorMessage});
            });
        } else {
            Category.findOneAndUpdate({_id: id}, {name: editArgs.name}).then(category => {
                res.redirect('/admin/category/all');
            })
        }
    },

    deleteGet: (req,res) => {
        let id = req.params.id;

        Category.findById(id).then(category => {
            res.render('admin/category/delete', {category: category});
        });
    },

    deletePost: (req,res) => {
        let id = req.params.id;

        Category.findOneAndRemove({_id: id}).then(category => {
            category.prepareDelete();
            res.redirect('/admin/category/all');
        });
    }

};