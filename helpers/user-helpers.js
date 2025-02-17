var db = require('../config/connection')
var collection = require('../config/collections')
var bcrypt = require('bcrypt')
const { CART_COLLECTION } = require('../config/collections')
const { ObjectId } = require('mongodb')
const { response } = require('express')
const { resolve, reject } = require('promise')
var objectId = require('mongodb').ObjectID
const Razorpay = require('razorpay')
const { resolve4 } = require('dns')
//create instance (code from npm razorpay documentation, keys downloaded from razorpay)
var instance = new Razorpay({
    key_id: 'rzp_test_boh3l9sbmpk6Up', //'YOUR_KEY_ID'
    key_secret: 'PNBm3Gt2sShgaS5RLr48DetM', //'YOUR_KEY_SECRET',
  });


module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.Psw = await bcrypt.hash(userData.Psw,10);
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data.ops[0])
            })
        })
    },

    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let response={};
            let user = await  db.get().collection(collection.USER_COLLECTION).findOne({Email: userData.Email})
            if(!user){      //email not found
                response.loginStatus=false
            }
            else{           
              validPassword= await bcrypt.compare(userData.Psw,user.Psw)
                if(!validPassword){         //psw incorrect
                    response.loginStatus=false
                }
                else{                       //psw correct
                    response.user=user
                    response.loginStatus=true
                }
            }
            resolve(response)                //return response back to doLogin

        })
    },

    addToCart:(prodId,userId)=>{
        let prodObj={
            item:objectId(prodId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
            if(userCart){       //user already has a cart - update items
                let prodExist=userCart.products.findIndex(product=> product.item==prodId)
                //console.log(prodExist)  //-1 if no pdt, else index of pdt
                if(prodExist!=-1){
                    db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId),'products.item':objectId(prodId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }).then(()=>{
                        resolve()
                    })
                }
                else
                db.get().collection(collection.CART_COLLECTION).updateOne({user:ObjectId(userId)},
                {
                        $push:{products:prodObj} 
                }).then((response)=>{
                    resolve()
                })    
            } 
            else{              //no cart - create cart
                let cartObj={
                    user:objectId(userId),
                    products:[prodObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }
        })
    },

    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems= await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}      //get the cart of user by matching user id
                },
                // {
                //     $lookup:{                           // cart has products array with prodid. Match that prodid with id of pdt in pdt collection & get pdt details
                //         from:collection.PRODUCT_COLLECTION,
                //         let:{productList:'$products'},
                //         pipeline:[
                //             {
                //                 $match:{
                //                     $expr:{
                //                         $in:['$_id','$$productList']
                //                     }
                //                 }
                //             }
                //         ],
                //         as:'cartItems'
    
                //     }
                // }
                {
                    $unwind:'$products'        //to take item & quantity outside the array
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'   //now we took cartid, item & quantity in cart
                    }
                },
                {
                    $lookup:{                       //will get product as array          
                        from:collection.PRODUCT_COLLECTION, //product collection
                        localField:'item',              //item from cart collection
                        foreignField:'_id',                  //id from products collection
                        as:'product'       //take details from pdt collection
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
            //console.log(cartItems[0].products)
                resolve(cartItems)
        })
    },

    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0;
            let usercart= await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(usercart){           //check if user already has a cart
                count=usercart.products.length
            }
            resolve(count)
        })
    },

    changeProductQuantity:(details)=>{
        details.count=parseInt(details.count)   //count is a string.Convert to int to increment
        details.quantity=parseInt(details.quantity)
        //console.log()
        return new Promise((resolve,reject)=>{
            if(details.count==-1 && details.quantity==1){       //check if product qnty is 0
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:objectId(details.cart)},
                {
                    $pull:{products:{item:objectId(details.product)}}   //remove item from pdt array if item & pdt id matches
                }).then((response)=>{
                    resolve({removeProduct:true})
                })
            }
            else{
            db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
                {
                    $inc:{'products.$.quantity':details.count}
                }).then((response)=>{
                    resolve({status:true})
                })
            }
        })

    },

    getTotalAmount:(userId)=>{
    return new Promise(async(resolve,reject)=>{ 
        let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
            {
                $match:{user:objectId(userId)}      //get the cart of user by matching user id
            },
            {
                $unwind:'$products'        //to take item & quantity outside the products array
            },
            {
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'   //now we took cartid, item & quantity in cart
                }
            },
            {
                $lookup:{                       //will get product as array          
                    from:collection.PRODUCT_COLLECTION, //product collection
                    localField:'item',              //item from cart collection
                    foreignField:'_id',                  //id from products collection
                    as:'product'       //take details from pdt collection
                }
            },
            {
                $project:{
                    item:1,quantity:1,product:{$arrayElemAt:['$product',0]}     //1 for elements to be projected,0 for not projecting
                }
            },
            {
                $group:{
                    _id:null,
                    total:{$sum:{$multiply:['$quantity',{$toInt: '$product.Price'}]}}
                }
            }
        ]).toArray()
        console.log(total[0].total)
            resolve(total[0].total)
    })
    
    },

    placeOrder:(orderdetails,products,total)=>{
        //before placing order, take cart products & total amount
        return new Promise(async(resolve,reject)=>{
            console.log(orderdetails,products,total)

            //check order status-if COD:order placed, If online:order pending
            let status=orderdetails['payment-method']==='COD'?'placed':'pending'  //conditional operator
            let orderObj={
                deliverydetails:{
                    address:orderdetails.Address,
                    pincode:orderdetails.Pincode,
                    mobile:orderdetails.Mobile
                },
                userId:ObjectId(orderdetails.userId),
                paymentMethod:orderdetails['payment-method'],   //bcoz payment method key is in quotes 
                products:products,
                totalAmount:total,
                status:status,
                date:new Date()
            }

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{     //add orderdetails to DB
                db.get().collection(collection.CART_COLLECTION).removeOne({user:objectId(orderObj.userId)})      //clear cart once order is placed
                resolve(response.ops[0]._id)
            })
        })
    },

    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{ 
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
            resolve(cart.products)
        })
    },

    getAllOrders:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            //console.log(userId)
            let orders= await db.get().collection(collection.ORDER_COLLECTION).find({userId:ObjectId(userId)}).toArray()
            //console.log(orders)
            resolve(orders)
       })
    },

    getOrderProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(orderId)  
            let orderProd= await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:objectId(orderId)}    
                },
                {
                    $unwind:'$products'        //to take item & quantity outside the array
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'   //now we took cartid, item & quantity in cart
                    }
                },
                {
                    $lookup:{                       //will get product as array          
                        from:collection.PRODUCT_COLLECTION, //product collection
                        localField:'item',              //item from cart collection
                        foreignField:'_id',                  //id from products collection
                        as:'product'       //take details from pdt collection
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
            console.log(orderProd)
                resolve(orderProd)
        })
    },

    generateRazorpay:(orderId,totalPrice)=>{
        return new Promise((resolve,reject)=>{
            //instance created gloabally

            //step 1: create order from server (code from razorpay docs)
            var options = {
                amount: totalPrice*100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: ""+orderId    //" " string converts orderId to string
            };
            instance.orders.create(options, function(err, order) {
                if(err){
                    console.log(err)
                }else{
                console.log("razorpay order:",order);
                resolve(order)
                }
            });

        })
    },

    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
         //nodejs crypto libraray 
         const crypto = require('crypto');
         let hmac = crypto.createHmac('sha256','PNBm3Gt2sShgaS5RLr48DetM')    //create hash using secret key
         hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
         hmac=hmac.digest('hex')
         if(hmac==details['payment[razorpay_signature]']){
             resolve()
         }else{
             reject()
         }
        })
    },

    paymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},
            {
                $set:{
                    status:'placed'
                }
            }
            ).then(()=>{
                resolve()
            })
        })
    }




}

