const Category = require('../models/categoryModel');


//categorylist in admin side
const categoryList = async (req, res) => {
   try{
        let query = {};
        const categories = await Category.find(query)
        res.render('./categories/category',{
            title: 'categories',
            categories,
            error: '',
        })
   }catch(error){
    console.error('Error fetching categories:', error);
    res.status(500).send('Internal Server Error');
   }
};



const createcat = function(req, res) {
    const error= req.flash('error');
    res.render('./categories/createcat',{error:error});
};


const addcat = function(req, res) {
    const categoryName = req.body.categoryName;
    Category.findOne({ name: categoryName })
        .then(existingCategory => {
            if (existingCategory) {
                const error = "Category already exists";
                req.flash('error', error);
                res.redirect('/createcat');
            } else {
                const newCategory = new Category({ name: categoryName });
                newCategory.save()
                    .then(() => {
                        res.redirect('/category');
                    })
                    .catch(err => {
                        console.error(err);
                        res.status(500).send('Internal Server Error');
                    });
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
};



const editCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const updatedName = req.body.updatedName;
        const category = await Category.findByIdAndUpdate(categoryId, { name: updatedName }, { new: true });
        if (!category) {
            return res.status(404).send({ error: 'Category not found' });
        }
        res.redirect('/category'); 
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
};


const editCategoryForm = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).send({ error: 'Category not found' });
        }
        res.render('./categories/editcat', { category: category,categoryId });
    } catch (error) {
        console.error('Error rendering edit category form:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
};



const confirmdel = function(req, res) {
    const categoryId = req.params.id;
    Category.findById(categoryId)
        .then(category => {
            res.render('./categories/delete', { category });
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
};


const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.body.categoryId;
        await Category.findByIdAndDelete(categoryId);
        res.status(200).send({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
};


module.exports = {
    categoryList,
    createcat,
    addcat,
    editCategory,
    editCategoryForm,
    confirmdel,
    deleteCategory
}