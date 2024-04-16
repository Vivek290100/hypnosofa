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

//Edit product------------------------------------------------------->
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

//Update product------------------------------------------------------->
const updateproduct = async function (req, res) {
    const productId = req.params.id;
    const { name, description, category, price, quantity } = req.body;
    const deleteExistingImages = req.body;
    const newImages = req.files;

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
                
                await FS.promises.unlink(imagePath);
                console.log('Image Deleted Successfully:', imageFilename);
                
                currentProduct.images.splice(index, 1);
                
                await Product.deleteOne({ filename: imageFilename });
                console.log('Image deleted from the database:', imageFilename);
            }
        }

        if (newImages && newImages.length > 0) {
            newImages.forEach(async (image) => {
                const imageFilename = image.filename;
                currentProduct.images.push(imageFilename);
                console.log('New image added:', imageFilename);
            });
        }
        
        currentProduct.name = name;
        currentProduct.description = description;
        currentProduct.category = category;
        currentProduct.price = price;
        currentProduct.quantity = quantity;

        await currentProduct.save();

        res.redirect('/product');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};










//delete product in admin side------------------------------------------------------->
const deleteproduct = async function(req, res) {
    const imagesToDelete = req.body.images; // Get image names from request body
    try {
        for (const imageName of imagesToDelete) {
            const imagePath = path.join(__dirname, '../public/assets/product-images', imageName);
            try {
                await fs.promises.unlink(imagePath);
                console.log('Image Deleted Successfully:', imageName);
            } catch (error) {
                console.error('Error deleting image file:', error.message);
            }
        }
        res.status(200).send('Images deleted successfully');
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