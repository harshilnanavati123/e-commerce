const User = require('../models/user')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const {validationResult}=require('express-validator')
// const nodeMailer = require('nodemailer')
// const sendGridTransport = require('nodemailer-sendgrid-transport')
// const transporter = nodeMailer.createTransport(sendGridTransport({
//     auth:{
//         api_user:
//     }
// }))

exports.getLogin = (req, res, next) => {
 let message = req.flash('err')
if(message.length>0){
    message = message[0]
}else{
    message = null
}
    
    res.render('auth/login', {
        path: '/login',
        Title: 'LoginPage',
        errorMessage:message,
        oldInput:{email:'',password:''}
    })
}

exports.getSignUp = (req,res,next)=>{
    let message = req.flash('err')
if(message.length>0){
    message = message[0]
}else{
    message = null
}
    res.render('auth/signup', {
        path: '/signup',
        Title: 'SignUp Page',
        errorMessage:message,
        oldInput:{email:'',password:'',condirmPassword:''}
    })
}

exports.postLogin = (req, res, next) => {
    const email = req.body.email
    const password = req.body.password
    const errors = validationResult(req)
    if(!errors.isEmpty()){
       return res.status(422).render('auth/login', {
            path: '/login',
            Title: 'LoginPage',
            errorMessage:errors.array()[0].msg,
            oldInput:{email:email,password:password}
        })
    }
    User.findOne({email:email}).then(user=>{
        if(!user){
            return res.status(422).render('auth/login', {
                path: '/login',
                Title: 'LoginPage',
                errorMessage:'Invalid email or password',
                oldInput:{email:email,password:password}
            })
        }
        bcrypt.compare(password,user.password).then(doMatch=>{
            if(doMatch){
                req.session.user = user;
                req.session.isLoggedIn = true
                return req.session.save(err => {
                    console.log(err)
                    return res.redirect('/')
                })
            }
            return res.status(422).render('auth/login', {
                path: '/login',
                Title: 'LoginPage',
                errorMessage:'Invalid email or password',
                oldInput:{email:email,password:password}
            })
        })
    })
   
}
exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        console.log(err)
        res.redirect('/')
    })
}

exports.postSignUp = (req,res,next)=>{
const email = req.body.email;
const password = req.body.password;
const errors = validationResult(req)
if(!errors.isEmpty){
    console.log(errors.array())
    return res.status(422).render('auth/signup', {
        path: '/signup',
        Title: 'SignUp Page',
        errorMessage:errors.array()[0],
        oldInput:{email:email,password:password,confirmPassword:req.body.confirmPassword}
    })
}

 bcrypt.hash(password, 12)         //hashing the password
   .then((hashedPassword)=>{                
    const user = new User({                  //creating a new user
        email:email,                         
        password:hashedPassword,                //using hased password
        cart:{items:[]}
    })
    return user.save() 
})
                    
    .then(result=>{
        res.redirect('/login')
    }).catch(err=>console.log(err))
}

exports.getReset = (req,res,next)=>{
    let message = req.flash('err')
    if(message.length>0){
        message = message[0]
    }else{
        message = null
    }
    res.render('auth/reset', {
        path: '/reset',
        Title: 'Reset Page',
        errorMessage:message
    })
}

exports.postReset = (req,res,next)=>{
crypto.randomBytes(32,(err,buffer)=>{
    if(err){
        return res.redirect('/reset')
    }
    const token =  buffer.toString('hex')
    User.findOne({email:req.body.email}).then(user=>{
        if(!user){
            req.flash('err','No account Found')
           return res.redirect('/reset')
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000
        return user.save()
        .then(result=>{
             res.redirect('/')
        })
    }).catch()
})
}