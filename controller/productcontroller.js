const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs/promises').unlink;
const FS = require('fs');


const productList = async (req, res) => {
    try {
        let query = {};
        const products = await Product.find(query)
            .populate('category')
        res.render('./product/products', {
            title: 'Products',
            products,
        });
        // console.log(products)
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Internal Server Error');
    }
};

//add product with categories that stored in database------------------------------------------------------->
const addform = function(req, res) {
    Category.find({}).exec()
        .then(categories => {
            res.render('./product/addproduct', { categories });
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
};


//add product in admin side-------------------------------------------------------
const addproduct = async function (req, res) {
    try {
        const { name, description, category, price, quantity } = req.body;

        const categoryObject = await Category.findById(category).populate('name');
        // console.log("category name",categoryObject);

        let images=[];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const imagePath = file.path;
                const imageFilename = file.filename;
                const resizedImagePath = path.join(__dirname, '../public/assets/product-images/', `resized_${imageFilename}`);
            
            // Resize and save the image using sharp
            await sharp(imagePath)
                .resize(300, 200)
                .toFile(resizedImagePath);
            
                images.push(imageFilename); // Push the filename to the array
        }

    }

        const newProduct = new Product({
            name,
            description,
            images,
            price,
            category:categoryObject,
            quantity,
        });

        await newProduct.save();
        
        res.redirect('/product');
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).send('Internal Server Error');
    }
};

//fetching product id and category id to edit product------------------------------------------------------->
const editform = function(req, res) {
    const productId = req.params.id;
    Promise.all([
        Product.findById(productId),
        Category.find({})
    ])
    .then(([product, categories]) => {
        res.render('./product/editproduct', { product, categories });
    })
    .catch(err => {
        console.error(err);
        res.status(500).send('Internal Server Error');
    });
};

//updateproduct in the admin side------------------------------------------------------->
const updateproduct = async function (req, res) {
    const productId = req.params.id;
    const { name, description, category, price, quantity, deleteExistingImage } = req.body;
    try {
        const currentProduct = await Product.findById(productId);
        if (!currentProduct) {
            return res.status(404).send('Product not found');
        }

        // Delete existing images if checkbox is ticked
        if (deleteExistingImage === 'on' && currentProduct.images && currentProduct.images.length > 0) {
            for (const image of currentProduct.images) {
                const imagePath = path.join(__dirname, '../public/assets/product-images', image);
                try {
                    await FS.promises.unlink(imagePath);
                    console.log('Image Deleted Successfully');
                } catch (error) {
                    console.error('Error deleting image file:', error.message);
                }
            }
            currentProduct.images = []; // Clear the images array
        }

        // Handle addition of new images
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const imagePath = file.path;
                const imageFilename = file.filename;
                const resizedImagePath = path.join(__dirname, '../public/assets/product-images', `resized_${imageFilename}`);
                await sharp(imagePath)
                    .resize(300, 200)
                    .toFile(resizedImagePath);
                currentProduct.images.push(`resized_${imageFilename}`);
            }
        }

        // Update other fields
        currentProduct.name = name;
        currentProduct.description = description;
        currentProduct.category = category;
        currentProduct.price = price;
        currentProduct.quantity = quantity;

        await currentProduct.save();
        console.log('Updated Product:', currentProduct);
        res.redirect('/product');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};



//delete product in admin side------------------------------------------------------->
const deleteproduct = async function(req, res) {
    const productId = req.params.id;
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send('Product not found');
        }
        if (product.images && product.images.length > 0) { // Corrected this line
            for (const image of product.images) { // Loop through images
                const imagePath = path.join(__dirname, '../public/assets/product-images', image);
                try {
                    await FS.promises.unlink(imagePath);
                    console.log('Image Deleted Successfully');
                } catch (error) {
                    console.error('Error deleting image file:', error.message);
                }
            }
        }
        await Product.findByIdAndDelete(productId);
        res.redirect('/product');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};




module.exports = {
    productList,
    addproduct,
    addform,
    editform,
    updateproduct,
    deleteproduct
};