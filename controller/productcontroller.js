const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const path = require('path');
const fs = require('fs').promises;
const { cloudinary } = require('../config/cloudinary');


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


const addproduct = async (req, res) => {
  try {
    const { name, description, category, price, quantity } = req.body;

    const newProduct = new Product({
      name,
      description,
      images: [],
      category,
      price,
      quantity,
    });
    await newProduct.save();

    if (req.files && req.files.length) {
      const uploadPromises = req.files.map(file => {
        return cloudinary.uploader.upload(file.path, {
          public_id: `${newProduct._id}_${Date.now()}_${file.originalname.split('.')[0]}`,
        });
      });

      const results = await Promise.all(uploadPromises);
      newProduct.images = results.map(r => r.secure_url);
      console.log("newProduct",newProduct);
      

      await Promise.all(req.files.map(f => fs.unlink(f.path).catch(() => {})));
    }

    await newProduct.save();
    res.redirect('/product');
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).send('Internal Server Error');
  }
};


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

const updateproduct = async (req, res) => {
  const productId = req.params.id;
  const { name, description, category, price, quantity } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).send('Product not found');

    const deleteImages = req.body.deleteImages || [];

    for (const url of deleteImages) {
      if (url && product.images.includes(url)) {
        const publicId = url.split('/').pop().split('.')[0];

        await cloudinary.uploader.destroy(publicId).catch(err => {
          console.error(`Failed to delete image ${publicId}:`, err);
        });

        product.images = product.images.filter(img => img !== url);
      }
    }

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file =>
        cloudinary.uploader.upload(file.path, {
          folder: 'products',
          public_id: `${product._id}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        })
      );

      const results = await Promise.all(uploadPromises);
      product.images.push(...results.map(r => r.secure_url));

      await Promise.all(
        req.files.map(file => fs.unlink(file.path).catch(() => {}))
      );
    }

    product.name = name.trim();
    product.description = description.trim();
    product.category = category;
    product.price = parseFloat(price);
    product.quantity = parseInt(quantity);

    await product.save();

    res.redirect('/product');
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).send('Internal Server Error');
  }
};




const deleteproduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.isDeleted = true;
    await product.save();

    res.json({ success: true, message: 'Product deleted' });

    product.images.forEach(url => {
      const publicId = url.split('/').pop().split('.')[0];
      cloudinary.uploader.destroy(publicId).catch(err => {
        console.log('Failed to delete image:', publicId, err.message);
      });
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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