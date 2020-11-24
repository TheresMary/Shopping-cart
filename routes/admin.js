var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')

const verifyadminLogin=(req,res,next)=>{
  if(req.session.adminLoggedIn){
    next()
  }
  else{
    res.redirect('/admin/login')
  }
}

  /* GET users listing. */
  router.get('/', function(req, res, next) {
    let admin=req.session.admin;
    if(req.session.admin){
    productHelpers.getAllProducts().then((products)=>{
      //console.log(products)
      res.render('admin/view-products',{admin:true, admin,products});
    });
    }
    else{
      res.redirect('/admin/login')
    }
  });

  router.get('/login',(req,res)=>{
    if(req.session.admin){
      res.redirect('/')
    }
    else{
    res.render('admin/admin-login',{"loginErr":req.session.adminLoginError})
    req.session.adminLoginError=false;     //error should go while refreshing
    }
  });

  router.post('/login',(req,res)=>{
    productHelpers.doLogin(req.body).then((response)=>{
      console.log(response)
      if(response.loginStatus){
         req.session.admin = response.admin
         req.session.adminLoggedIn = true;
         res.redirect('/admin/')
      }
      else{
        req.session.adminLoginError="Invalid Admin. Try Again!";
        res.redirect('/admin/login')
      }
    })
  });
  
  router.get('/logout',(req,res)=>{
    req.session.admin=null;
    req.session.adminLoggedIn=false;
    res.render('admin/admin-login')
  });
 
  router.get('/add-products',(req,res)=>{
    res.render('admin/add-products',{admin:true})
  });

  router.post('/add-products',(req,res)=>{
    //console.log(req.body);
    //console.log(req.files.Image);
    productHelpers.addProduct(req.body,(id)=>{
      let img = req.files.Image
      //console.log(id)
      img.mv('./public/product-images/'+id+'.jpg',(err)=>{
        if(!err){
          res.render('admin/add-products',{admin:true});
      }
        else
          console.log(err);
      })
    })
  })

  router.get('/delete-products/:id',(req,res)=>{
    let prodId = req.params.id;
    //console.log(prodId);
    productHelpers.deleteProducts(prodId).then((response)=>{
      res.redirect('/admin/')
    })
  });

  router.get('/edit-products/:id',async(req,res)=>{
     let prodId = req.params.id;
     let product = await productHelpers.getProductDetails(prodId)
     //console.log(product)
     res.render('admin/edit-products',{admin:true, product});
  });

  router.post('/edit-products/:id',async(req,res)=>{
    productHelpers.editProduct(req.params.id,req.body).then(()=>{
      res.redirect('/admin/')
      if(req.files.Image){                              //if image  in request
        let img = req.files.Image
        img.mv('./public/product-images/'+req.params.id+'.jpg')    //rewrite image -> only 1 image with 1 id name
      }
    })
 });

 

module.exports = router;
