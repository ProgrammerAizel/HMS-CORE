const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// GET Signup Page
router.get('/signup', (req, res) => {
    res.render('signup');
});

//POST signup(saving the doctor/admin)
router.post('/signup', async (req, res) => {
    try {
        // Log this to your terminal to see if data is actually arriving
        console.log("Form Data Received:", req.body);

        if (!req.body || !req.body.username) {
            return res.status(400).send("Form data is missing! Check your input names.");
        }

        const { username, password } = req.body;
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ 
            username: username, 
            password: hashedPassword 
        });

        await newUser.save();
        res.redirect('/auth/login');
    } catch (err) {
        console.error("SIGNUP ERROR:", err);
        // We use res (the second argument) to send the status
        res.status(500).send("Error creating Account: " + err.message);
    }
});

// GET Login Page
router.get('/login', (req, res) => {
    res.render('login');
});

// POST Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log("Login attempt for:", username);

        // 1. Find user
        const user = await User.findOne({ username });
        if (!user) {
            console.log("User not found in database");
            return res.send("Invalid username or password. <a href='/auth/login'>Retry</a>");
        }

        // 2. Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("Password does not match");
            return res.send("Invalid username or password. <a href='/auth/login'>Retry</a>");
        }

        // 3. Success! Set session
        req.session.user = user;
        console.log("Login successful! Session created.");
        res.redirect('/');
        
    } catch (err) {
        console.error("LOGIN CRASH:", err);
        res.status(500).send("Server Error during login: " + err.message);
    }
});

//LOGOUT
router.get('/logout', (req,res)=>{
    req.session.destroy();
    res.redirect('/auth/login')
})

module.exports = router