const express = require('express');
const router = express.Router({ mergeParams: true });       // Gets params from index.js
const users = require('../controllers/users');
const catchAsync = require('../utils/catchAsync');
const passport = require('passport');
const { checkReturnTo } = require('../middleware.js')
const User = require('../models/user');

// Routes with '/register' comes with .get and .post middleware
router.route('/register')
    .get(users.renderRegister)
    .post(catchAsync(users.register))

// Routes with '/login' comes with .get and .post middleware
router.route('/login')
    .get(users.renderLogin)
    .post(checkReturnTo, passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), users.login)

router.get('/logout', users.logout)

module.exports = router;