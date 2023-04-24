const Product = require('../models/product')
// const mongodb = require('mongodb')
const {validationResult} = require('express-validator')
exports.addController = (req, res, next) => {
    res.render('admin/edit-product', {
        Title: 'Productt',
        editing: false,
        hasErrors:false,
        errorMessage:null
    })

}

exports.setController = (req, res, next) => {
    // const NewObject = mongodb.ObjectId
    // const Id = new NewObject(req.user._id)
    // console.log(user)
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    if(!image){
        return res.status(422).render('admin/edit-product', {
            product: product, Title: 'Add Products',
            path: '/edit-product',
            editing: false,
            hasErrors:true,
            errorMessage:'Attached file is not an image',
            product:{title:title,
            price:price,
            description:description
        }
        })
    }
    const errors = validationResult(req)
    if(!errors.isEmpty){
       return res.status(422).render('admin/edit-product', {
            product: product, Title: 'Add Products',
            path: '/edit-product',
            editing: false,
            hasErrors:true,
            errorMessage:errors.array()[0].msg,
            product:{title:title,
            imageUrl:imageUrl,
            price:price,
            description:description
        }
        })
    }
    const imageUrl = image.path
    const product = new Product({
        title:title,
        price:price,
        description:description,
        imageUrl:imageUrl,
        userId:req.user
    });
    product.save()
        .then((result) => {
            res.redirect('/')
            console.log(result)
        })
        .catch(err => console.log(err))
}
exports.getEditProducts = (req, res, next) => {
    const editMode = req.query.edit
    console.log(editMode)
    if (!editMode) {
        return res.redirect('/')
    }
    const prodId = req.params.productId
    // Product.findByPk(prodId)
    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return res.redirect('/')
            }
            res.render('admin/edit-product', {
                product: product, Title: 'Edit Products',
                path: '/edit-product',
                editing: editMode,
                hasErrors:false,
                errorMessage:null
            })
        }).catch(err => console.log(err))
}

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId
    const updatedTitle = req.body.title
    const updatedPrice = req.body.price
    const image = req.file
    const updatedDescription = req.body.description
    const errors = validationResult(req)
    if(!errors.isEmpty){
       return res.status(422).render('admin/edit-product', {
          Title: 'Edit Products',
            path: '/edit-product',
            editing: true,
            hasErrors:true,
            errorMessage:errors.array()[0].msg,
            product:{
            title:updatedTitle,
            price:updatedPrice,
            description:updatedDescription,
            _id:prodId
        }
        })
    }
Product.findById(prodId).then(product=>{
    if(product.userId.toString()!==req.user._id.toString()){
        return res.redirect('/')
    }
    product.title=updatedTitle;
    product.price=updatedPrice;
    if(image){
    product.imageUrl=image.path
    }
    product.description=updatedDescription
    return product.save().then(result => {
        res.redirect('/products')
    })
})

}

exports.postDeleteeleteProduct = (req, res, next) => {

    const prodId = req.body.productId
    Product.deleteOne({_id:prodId,userId:req.user._id})
        .then(() => {
            res.redirect('/products')
        })
        .catch(err => console.log(err))


}

exports.getProducts = (req, res, next) => {
    Product.find({userId:req.user._id})
    // .select('title price -_id')
    // .populate('userId','name')
        .then(product => {
            console.log(product)
            res.render('admin/products', {
                prods: product, Title: 'Admin Products',
                path: '/products',
                isAuthenticated: req.session.isLoggedIn
            })
        }
        ).catch(err => console.log(err))

}