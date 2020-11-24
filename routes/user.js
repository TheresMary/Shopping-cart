const { response } = require('express');
var express = require('express');
const { resolve } = require('promise');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
var userHelpers = require('../helpers/user-helpers')

const verifyLogin=(req,res,next)=>{
  if(req.session.userLoggedIn){
    next()
  }
  else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/',async function(req, res, next) {
  let user=req.session.user;
  let cartCount=null
    if(req.session.user){
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    }
  //console.log(user)
  productHelpers.getAllProducts().then((products)=>{
    //console.log(products)
    res.render('user/view-products', { title: 'BOOTS', products,user,cartCount});
  });
});

router.get('/login',(req,res)=>{
  if(req.session.user){
    res.redirect('/')
  }
  else{
  res.render('user/user-login',{"loginErr":req.session.userLoginError})
  req.session.userLoginError=false;     //error should go while refreshing
  }
});

router.get('/signup',(req,res)=>{
  res.render('user/user-signup')
});

router.post('/signup',(req,res)=>{
  userHelpers.doSignup(req.body).then((response)=>{
          //console.log(response)
          req.session.user=response;
          req.session.userLoggedIn=true;
          res.redirect('/')

      })
});

router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    //console.log(response)
    if(response.loginStatus){
       req.session.user = response.user
       req.session.userLoggedIn = true;
       res.redirect('/')
    }
    else{
      req.session.userLoginError="Invalid User. Try Again!";
      res.redirect('/login')
    }
  })
});

router.get('/logout',(req,res)=>{
  req.session.user=null;
  req.session.userLoggedIn=false;
  res.render('user/user-login')
});

router.get('/cart',verifyLogin,async(req,res)=>{       //go to cart only if loggedin
  let products= await userHelpers.getCartProducts(req.session.user._id)
  let total=0
  if(products.length>0){
    total=await userHelpers.getTotalAmount(req.session.user._id)
  }
 
  console.log(products)
  res.render('user/cart',{products,user:req.session.user,total})
});

router.get('/add-to-cart/:id',(req,res)=>{
  console.log("api call")
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
   // res.redirect('/cart')
   res.json({status:true})    //status- item is added to cart
  })
});

router.post('/change-prod-quantity',(req,res,next)=>{
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
     response.total=await userHelpers.getTotalAmount(req.body.user)
     res.json(response)
  })
});

router.get('/remove-products/:id',(req,res)=>{
  productHelpers.removeProducts(req.session.user._id,req.params.id).then((response)=>{
   res.redirect('/cart')
  })
});

router.get('/place-orders',verifyLogin,async(req,res)=>{
  let total=await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user})
});

router.post('/place-orders',async(req,res)=>{
  console.log(req.body)
  //before placing order, take cart products & total amount
  let products= await userHelpers.getCartProductList(req.body.userId) //cart products 
  let total=await userHelpers.getTotalAmount(req.body.userId)  //total amount
  userHelpers.placeOrder(req.body,products,total).then((orderId)=>{
    if(req.body['payment-method']==='COD'){
      res.json({codSuccess:true})
    }
    else{
      userHelpers.generateRazorpay(orderId,total).then((response)=>{  //order id from userhelpers.placeorder response
          res.json(response)  
      }) 
    }
  })
});

router.get('/order-success',(req,res)=>{
  res.render('user/order-success',{user:req.session.user})
});

router.get('/view-order',verifyLogin,async(req,res)=>{
  let orders=await userHelpers.getAllOrders(req.session.user._id)
    console.log(orders)
    res.render('user/view-order',{user:req.session.user,orders})
  });

router.get('/view-order-products/:id',async(req,res)=>{
  let orderId = req.params.id;
  let orderProduct = await userHelpers.getOrderProducts(orderId)
  res.render('user/view-order-products',{user:req.session.user,orderProduct})
});

router.post('/verify-payment',(req,res)=>{
  console.log(req.body)
  userHelpers.verifyPayment(req.body).then(()=>{
    userHelpers.paymentStatus(req.body['order[receipt]']).then(()=>{
      console.log("payment successfull")
      res.json({status:true})
    })
  }).catch((err)=>{
    console.log(err)
    res.json({status:false,errMsg:''})
  })
})

module.exports = router;
