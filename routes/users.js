var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log("Error logging out:", err);
            return res.redirect('/');
        }
        res.clearCookie('connect.sid'); // Clears the session cookie from the browser
        res.redirect('/auth/login');
    });
});

module.exports = router;
