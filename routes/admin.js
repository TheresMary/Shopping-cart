var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')

/* GET users listing. */
router.get('/', function(req, res, next) {

  productHelpers.getAllProducts().then((products)=>{
    console.log(products)
    res.render('admin/view-products',{admin:true, products});
  });
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
