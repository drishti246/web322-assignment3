require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const express = require('express');
const app = express();
const authData = require('./auth-service');
const storeService = require('./store-service');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

const PORT = process.env.PORT || 8080;

storeService.initialize()
    .then(authData.initialize)
    .then(() => {
        app.listen(PORT, () => console.log(`Express server running on port ${PORT}`));
    })
    .catch(err => console.error('Failed to initialize data:', err));

app.post('/register', (req, res) => {
    authData.registerUser(req.body)
        .then(() => {
            res.render('register', { successMessage: "User created" });
        })
        .catch(err => {
            res.render('register', { errorMessage: err, userName: req.body.userName });
        });
});
