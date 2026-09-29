const express = require('express');
const router = express.Router();
const { createuser, getuser, getallusers } = require('../controllers/userController');

router.post('/user', createuser);        // POST   /user
router.get('/users', getallusers);       // GET    /users
router.get('/user/:id', getuser);        // GET    /user/:id

module.exports = router;