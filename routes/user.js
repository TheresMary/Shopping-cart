var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
var userHelpers = require('../helpers/user-helpers')

/* GET home page. */
router.get('/', function(req, res, next) {
      res.render('user/user-login')
  // productHelpers.getAllProducts().then((products)=>{
  //   console.log(products)
  //   res.render('user/view-products', { title: 'BOOTS', products});
  //});
});

router.get('/login',(req,res)=>{
  res.render('user/user-login')
});

// router.post('/login',(req,res)=>{
//   res.render('user/view-products')
// });

router.get('/signup',(req,res)=>{
  res.render('user/user-signup')
});

router.post('/signup',(req,res)=>{
  userHelpers.doSignup(req.body).then((response)=>{
          console.log(response)
          productHelpers.getAllProducts().then((products)=>{
            console.log(products)
            res.render('user/view-products', { title: 'BOOTS', products});
          });

      })
});



module.exports = router;
