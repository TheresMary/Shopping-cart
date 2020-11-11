var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
var userHelpers = require('../helpers/user-helpers')

/* GET home page. */
router.get('/', function(req, res, next) {
  productHelpers.getAllProducts().then((products)=>{
    console.log(products)
    res.render('user/view-products', { title: 'BOOTS', products});
  });
});

router.get('/login',(req,res)=>{
  res.render('user/user-login')
});

router.get('/signup',(req,res)=>{
  res.render('user/user-signup')
});

router.post('/signup',(req,res)=>{
  userHelpers.doSignup(req.body).then((response)=>{
          console.log(response)
          res.redirect('/')

      })
});

router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    console.log(response)
    if(response.loginStatus){
       res.redirect('/')
    }
    else{
      res.redirect('/login')
    }
  })
});



module.exports = router;
