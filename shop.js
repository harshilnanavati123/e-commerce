const Product = require('../models/product')
const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')
const stripe = require('stripe')('sk_test_51MyszYSEcbmDRKK3QJvSy5UIoW3IqwNJGuwVKxpe7IRR26XoRGBdB6oMvjG08AyPDJRRg9xKURcdBaXzc9IHGxrM00GBk4YRw6')
const pdfDocument = require('pdfkit')
const Order = require('../models/order')
const ITEM_PERPAGE = 1
exports.getProducts = (req,res,next)=>{
    const page = +req.query.page || 1
        let totalItems
        Product.find().countDocuments().then(numProducts=>{
            totalItems = numProducts
            return  Product.find()
            .skip((page - 1)*ITEM_PERPAGE)
            .limit(ITEM_PERPAGE)
        }).then(products=>{
            console.log(products)
            res.render('shop/product-list',
            {
                prods:products,
                Title:'Products',path:'/',
                currentPage:page,
                hasNext:ITEM_PERPAGE*page<totalItems,
                hasPrevious:page>1,
                nextPage:page+1,
                previousPage:page-1,
                lastPage:Math.ceil(totalItems/ITEM_PERPAGE)
            })
        })
    .catch(err=>console.log(err))

    }
    exports.getProduct = (req,res,next)=>{
        const prodId = req.params.productId
        Product.findById(prodId)
        .then(product =>{
            res.render('shop/product-detail',{product:product,Title:'Product Details',path:'/products',isAuthenticated: req.session.isLoggedIn})
        }).catch(err=>console.log(err))
       
    }

    exports.getIndex = (req,res,next)=>{
        const page = +req.query.page || 1
        let totalItems
        Product.find().countDocuments().then(numProducts=>{
            totalItems = numProducts
            return  Product.find()
            .skip((page - 1)*ITEM_PERPAGE)
            .limit(ITEM_PERPAGE)
        }).then(products=>{
            console.log(products)
            res.render('shop/index',
            {
                prods:products,
                Title:'Shop',path:'/',
                currentPage:page,
                hasNext:ITEM_PERPAGE*page<totalItems,
                hasPrevious:page>1,
                nextPage:page+1,
                previousPage:page-1,
                lastPage:Math.ceil(totalItems/ITEM_PERPAGE)
            })
        }).catch(err=>console.log(err))
         }

    exports.getCart = (req,res,next)=>{
        req.user
       .populate('cart.items.productId')
         .then(user=>{
            // console.log(user.cart.items)
            const products= user.cart.items
            res.render('shop/cart',
         {path:'/cart',Title:'Your Cart',products:products,isAuthenticated: req.session.isLoggedIn})
        })
     
     .catch(err=>console.log(err))
        
//         Cart.getCart(cart =>{
//        Product.fetchAll(products => {
//         const cartProducts = []
// for (product of products){
//     const cartProductData = cart.products.find(prod => prod.id===product.id)
//     if(cartProductData){
// cartProducts.push({productData:product,qty:cartProductData.qty})
//     }
// }
           
//        })
//         })
    }
    exports.postCart = (req,res,next)=>{
        const prodId = req.body.productId
        Product.findById(prodId)
        .then(product=>{
            return req.user.addToCart(product)
        })
        .then(result=>{
            console.log(result)
            res.redirect('/cart')
        })
    }
exports.postCartDelete = (req,res,next)=>{

    const prodId = req.body.productId
    req.user.removeFromCart(prodId)
        .then((result)=>{
            console.log(result)
        res.redirect('/cart')
    }).catch(err=>console.log(err))
}
exports.getCheckout = (req,res,next)=>{
    let products;
    let total = 0
    req.user
       .populate('cart.items.productId')
       .then(user=>{
            products = user.cart.items
           products.forEach(p=>{
            total += p.quantity * p.productId.price
           })
            return stripe.checkout.sessions.create({
            payment_method_types:['card'],
            line_items:products.map(p=>{
                return {
                    name:p.productId.title,
                    description:p.productId.description,
                    amount:p.productId.price * 100,
                    currency:'usd'
                }
            }),
            success_url:req.protocol+'://'+req.get('host')+'/checkout/success',

            cancel_url:req.protocol+'://'+req.get('host')+'/checkout/cancel'
            })
        }).then(session=>{
            res.render('shop/checkout',
            {path:'/checkout',
            Title:'Check Out',
            products:products,
            totalSum:total,
            sessionId:session.id
    })

        })
     
     .catch(err=>console.log(err))
}
exports.getCheckoutSuccess = (req,res,next)=>{
    req.user.populate('cart.items.productId')
    .then(user=>{
        const products = user.cart.items.map(i=>{
            return{quantity:i.quantity,product:{...i.productId._doc}}
        })
        const order = new Order({
            user:{
                email:req.user.email,
                userId:req.user
            },
            products:products
        })
       return order.save()
    })
    .then(result=>{
        console.log(result)
       return req.user.clearCart()
    }).then(()=>{
        res.redirect('/orders')
    }).catch(err=>{console.log(err)})
}
exports.getOrders = (req,res,next)=>{
    Order.find({"user.userId":req.user._id})
    .then(orders=>{
        // console.log(orders)
        res.render('shop/orders',{Title:'OrderPage',path:'/orders',orders:orders,isAuthenticated: req.session.isLoggedIn})
    })
    
    
}
 
exports.getInvoice = (req,res,next)=>{
    const orderId = req.params.orderId
    Order.findById(orderId).then(order=>{
        if(!order){
            return next(new Error('No Order Found'))
        }
        if(order.user.userId.toString()!==req.user._id.toString()){
            return next(new Error('Unauthorized'))
        }
        const invoiceName = 'invoice-' + orderId + '.pdf'
        const invoicePath = path.join('data','invoices',invoiceName)
        const pdfDoc = new pdfDocument()
         res.setHeader('Content-Type', 'application/pdf')
            res.setHeader('Content-Disposition','inline;filename="'+invoiceName +'"')
        pdfDoc.pipe(fs.createWriteStream(invoicePath))
        pdfDoc.pipe(res)
        pdfDoc.text('----------------')
        let totalPrice = 0
        order.products.forEach(prod=>{
            totalPrice +=  prod.quantity*prod.product.price
            pdfDoc.text(prod.product.title+'-'+prod.quantity+'*'+'$'+prod.product.price)
        })
        pdfDoc.text('Total Price $' + totalPrice)
        pdfDoc.end()
        // fs.readFile(invoicePath,(err,data)=>{
        //     if(err){
        //        return next(err)
        //     }
        //     res.setHeader('Content-Type', 'application/pdf')
        //     res.setHeader('Content-Disposition','inline;filename="'+invoiceName +'"')
        //     res.send(data)
        // })
                    res.setHeader('Content-Type', 'application/pdf')
            res.setHeader('Content-Disposition','inline;filename="'+invoiceName +'"')
           
    })
  
}