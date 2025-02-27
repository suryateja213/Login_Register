const express = require('express');
const { registerController, loginController,getUserController } = require('./auth.controller');
const verifyToken = require('../../middleware/jwt/jwt');
const router = express.Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.get('/user', verifyToken, getUserController);

module.exports = router;
