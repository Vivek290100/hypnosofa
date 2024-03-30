const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs/promises').unlink;
const FS = require('fs');


const productList = async (req, res) => {
    try {
        const products = await Product.find({ isDeleted: false }).populate('category');
        res.render('./product/products', {
            title: 'Products',
            products,
        });
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
            
                images.push(imageFilename);
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
    const { name, description, category, price, quantity } = req.body;
    const deleteExistingImages = req.body;
    const newImages = req.files; // Assuming you're using multer or similar for file uploads

    try {
        const currentProduct = await Product.findById(productId);
        if (!currentProduct) {
            return res.status(404).send('Product not found');
        }

        // Delete existing images
        for (const key in deleteExistingImages) {
            if (key.startsWith('deleteExistingImage')) {
                const index = parseInt(key.replace('deleteExistingImage', ''));
                const imageFilename = deleteExistingImages[key];
                const imagePath = path.join(__dirname, '../public/assets/product-images', imageFilename);
                
                // Delete image file
                await FS.promises.unlink(imagePath);
                console.log('Image Deleted Successfully:', imageFilename);
                
                // Remove filename from product's images array
                currentProduct.images.splice(index, 1);
                
                // Delete image from the database (if needed)
                await Product.deleteOne({ filename: imageFilename });
                console.log('Image deleted from the database:', imageFilename);
            }
        }

        // Add new images
        if (newImages && newImages.length > 0) {
            newImages.forEach(async (image) => {
                const imageFilename = image.filename; // Assuming multer saves filename
                currentProduct.images.push(imageFilename);
                // You may also need to save image metadata to the database
                // Example: await Image.create({ filename: imageFilename, productId });
                console.log('New image added:', imageFilename);
            });
        }
        
        // Update other fields
        currentProduct.name = name;
        currentProduct.description = description;
        currentProduct.category = category;
        currentProduct.price = price;
        currentProduct.quantity = quantity;

        // Save the updated product
        await currentProduct.save();

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
        if (product.images && product.images.length > 0) { 
            for (const image of product.images) { 
                const imagePath = path.join(__dirname, '../public/assets/product-images', image);
                try {
                    await FS.promises.unlink(imagePath);
                    console.log('Image Deleted Successfully');
                } catch (error) {
                    console.error('Error deleting image file:', error.message);
                }
            }
        }
       const ProductData =  await Product.findById(productId);
       ProductData.isDeleted = true;
       await ProductData.save();
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