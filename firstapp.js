// const http = require('http')
const path = require('path')
const mongoose = require('mongoose')
const express = require('express')
const bodyParser = require('body-parser')
const mainroute = require('./routes/admin')
const subroute = require('./routes/shop')
const authRoute = require('./routes/auth')
const session = require('express-session')
const mongoDbStore = require('connect-mongodb-session')(session)
const multer = require('multer')
const User = require('./models/user')
const csrf = require('csurf')
const flash = require('connect-flash')
// const mongoConnect = require('./database').mongoConnect
const app = express()
const store = new mongoDbStore({
    uri:'mongodb+srv://nanavatih6:Gaumata@cluster0.aulljie.mongodb.net/shop',
    collection:'sessions'
})
const csrfToken = csrf()
const fileStorage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'images')
    },
   filename:(req,file,cb)=>{
    cb(null,file.filename + '-' + file.originalname)
   }
})
const fileFilter = (req,file,cb)=>{
    if(file.mimetype === 'image/png'  ||
     file.mimetype === 'image/jpg'    ||
     file.mimetype === 'image/jpeg'){
        cb(null,true)
    }
else{
    cb(null,false)
}
}
app.set('view engine', 'ejs')
app.set('views', 'views')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(multer({storage:fileStorage,fileFilter:fileFilter}).single('image'))
app.use('/images',express.static(path.join(__dirname,'images')))
app.use(session({secret:'my secret', resave:false,saveUninitialized:false,store:store}))
app.use(csrfToken)
app.use(flash())
app.use((req,res,next)=>{
    if(!req.session.user){
        return next()
    }
    User.findById(req.session.user._id)
    .then(user=>{
        req.user = user;
        next()
    }).catch(err=>console.log(err))
    
    })
    app.use((req,res,next)=>{
        res.locals.isAuthenticated = req.session.isLoggedIn;
        res.locals.csrfToken = req.csrfToken()
        next()
    })
app.use(subroute)
app.use(mainroute)
app.use(authRoute)
app.use((req, res, next) => {
    res.status(404).send('Page not found')
})
// const server = http.createServer(app)

mongoose.connect('mongodb+srv://nanavatih6:Gaumata@cluster0.aulljie.mongodb.net/shop?retryWrites=true&w=majority')
.then(result=>{
 
    app.listen(3000)
    console.log('hi')
}).catch(err=>console.log(err))
