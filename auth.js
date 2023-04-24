const express = require('express')
const route = express.Router()
const {check,body} = require('express-validator')
const authController = require('../controllers/auth')
const User = require('../models/user')
route.get('/login', authController.getLogin)
route.get('/signup', authController.getSignUp)
route.post('/login',[body('email')
.isEmail()
.withMessage('enter valid email')
.normalizeEmail(),
body('password')
.isLength({min:'5'})
.isAlphanumeric()
.trim()
.withMessage('enter valid password')
 ],authController.postLogin)
route.post('/signup',[
    check('email')
.isEmail()
.withMessage('Please enter a valid email')
.custom((value,{req})=>{
//     if(value === 'test@test.com'){
//         throw new Error('This email address is forbidden')
//     }
//     return true
return User.findOne({email:value})
.then((userDoc)=>{   // finding user in database
    if(userDoc){
       return Promise.reject('Email already exist please try a new one')
    }
})
})
.normalizeEmail()
,body('password','Please enter valid password with min 5 char')
.isLength({min:5})
.isAlphanumeric()
,
body('confirmPassword').custom((value,{req})=>{
   if(value!==req.body.password){
    throw new Error('Passwords does not match')
   }
   return true
})

] ,authController.postSignUp)
,route.post('/logout', authController.postLogout)
route.get('/reset', authController.getReset)
route.post('/reset',authController.postReset)
module.exports = route


