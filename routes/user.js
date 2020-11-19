const { response } = require('express');
var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
var userHelpers = require('../helpers/user-helpers')

const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
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
  if(req.session.loggedIn){
    res.redirect('/')
  }
  else{
  res.render('user/user-login',{"loginErr":req.session.loginError})
  req.session.loginError=false;     //error should go while refreshing
  }
});

router.get('/signup',(req,res)=>{
  res.render('user/user-signup')
});

router.post('/signup',(req,res)=>{
  userHelpers.doSignup(req.body).then((response)=>{
          console.log(response)
          req.session.loggedIn=true;
          req.session.user=response;
          res.redirect('/')

      })
});

router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    console.log(response)
    if(response.loginStatus){
       req.session.loggedIn = true;
       req.session.user = response.user
       res.redirect('/')
    }
    else{
      req.session.loginError="Invalid User. Try Again!";
      res.redirect('/login')
    }
  })
});

router.get('/logout',(req,res)=>{
  req.session.destroy();
  res.render('user/user-login')
});

router.get('/cart',verifyLogin,async(req,res)=>{       //go to cart only if loggedin
  let products= await userHelpers.getCartProducts(req.session.user._id)
  console.log(products)
  res.render('user/cart',{products,user:req.session.user})
});

router.get('/add-to-cart/:id',(req,res)=>{
  console.log("api call")
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
   // res.redirect('/cart')
   res.json({status:true})    //status- item is added to cart
  })
});

router.post('/change-prod-quantity',(req,res,next)=>{
  userHelpers.changeProductQuantity(req.body).then((response)=>{
     res.json(response)
  })
});

module.exports = router;
