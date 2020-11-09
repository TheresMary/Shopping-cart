var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {

  const products=[
    {
      name: "Ankle boot",
      category: "footwear",
      size: "34 35 36",
      price: "₹ 1400",
      description: "Ankle boot with leather lining and upper, rubber sole, elastic inserts on both sides. Extreme cleanliness and linearity",
      image: "https://www.fru.it/site/wp-content/uploads/2020/06/4795.jpg"
    },
    {
      name: "Block heel",
      category: "footwear",
      size: "39 40",
      price: "₹ 2000",
      description: "Black leather boot with silver spike stud",
      image: "https://www.fru.it/site/wp-content/uploads/2020/10/5769.jpg"
    },
    {
      name: "Pointed Ankle boot",
      category: "footwear",
      size: "34 35",
      price: "₹ 2100",
      description: "Ankle boot with leather upper and leather sole. Zip on the back and braid style work on the front, slipped heel and toe.",
      image: "https://www.fru.it/site/wp-content/uploads/2020/09/6583_5.jpg"
    },
    {
      name: "Pointed-toe heels",
      category: "footwear",
      size: "38 39",
      price: "₹ 1200",
      description: "Woman shoe with leather upper and leather sole. Open heel and pointed toe, sweetheart neckline and strap on the back",
      image: "https://www.fru.it/site/wp-content/uploads/2020/02/6260-2.jpg"
    },
    {
      name: "Silver stilettos",
      category: "footwear",
      size: "34 35 36",
      price: "₹ 1000",
      description: "Woman shoe in leather and leather sole",
      image: "https://www.fru.it/site/wp-content/uploads/2020/02/6259-2.jpg"
    },
    {
      name: "Half boot",
      category: "footwear",
      size: "39 40 41",
      price: "₹ 1800",
      description: "Leather upper and leather lining half boot, with rubber sole. Sharp toe, elegant line , animal printed , side zip.",
      image: "https://www.fru.it/site/wp-content/uploads/2020/07/6588_1.jpg"
    },
    
  ]
  res.render('index', { title: 'BOOTS', products, admin:false});
});

module.exports = router;
