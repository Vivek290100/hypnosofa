const express = require("express");
const app = express(); 
require('dotenv').config();
const bodyParser = require("body-parser");
const session = require('express-session');
const path = require('path');
const passport = require('passport');
const flash = require('connect-flash');
const router = require('./routers/userrouter');
const router1 = require('./routers/adminrouter');
const cartCountMiddleware = require("./middlewares/cartCountMiddleware");

app.use((req,res,next)=>{
    res.set("Cache-Control","no-store")
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({extended : true}));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets',express.static(path.join(__dirname, 'public/assets')))
app.use('/assets',express.static(path.join(__dirname, 'public/assets/homeimg')))

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 1000 }, 
}));

app.use(flash()); 
app.use(passport.session());
app.use(cartCountMiddleware);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use("/", router);
app.use('/', router1);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on PORT http://localhost:${PORT}`);
});
 