var db = require('../config/connection')
var collection = require('../config/collections')
var bcrypt = require('bcrypt')
const { CART_COLLECTION } = require('../config/collections')
const { ObjectId } = require('mongodb')
const { response } = require('express')
const { resolve, reject } = require('promise')
var objectId = require('mongodb').ObjectID


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
                console.log(prodExist)  //-1 if no pdt, else index of pdt
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
            console.log(cartItems[0].products)
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
            if(details.count==-1 && details.quantity==1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:objectId(details.cart)},
                {
                    $pull:{products:{item:objectId(details.product)}}
                }).then((response)=>{
                    resolve({removeProduct:true})
                })
            }
            else{
            db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
                {
                    $inc:{'products.$.quantity':details.count}
                }).then((response)=>{
                    resolve()
                })
            }
        })

    }
}

