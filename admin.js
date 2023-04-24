const express = require('express')
const {body} = require('express-validator')
const path = require('path')
const route = express.Router()
const isAuth = require('../middleware/is-auth')
const adminController = require('../controllers/admin')
route.get('/add-product',isAuth,adminController.addController)
route.get('/products',isAuth,adminController.getProducts)
route.post('/add-product',[
    body('title').isAlphanumeric().isLength({min:4}).trim(),
    body('price').isFloat(),
    body('description').isLength({min:5,max:200})
],isAuth,adminController.setController)
route.get('/edit-product/:productId',isAuth, adminController.getEditProducts)
route.post('/edit-product',[
    body('title').isString().isLength({min:4}).trim(),
    body('price').isFloat(),
    body('description').isLength({min:5,max:200})
],isAuth,adminController.postEditProduct)
route.post('/delete-product',isAuth,adminController.postDeleteeleteProduct)
module.exports = route
