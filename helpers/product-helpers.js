var db = require('../config/connection')
var collection = require('../config/collections')
var bcrypt = require('bcrypt')
const { ObjectID } = require('mongodb')
var objectId = require('mongodb').ObjectID

module.exports={

    saveLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.Psw = await bcrypt.hash(userData.Psw,10);
            db.get().collection(collection.ADMIN_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data.ops[0])
            })
        })
    },

    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let response={};
            let user = await  db.get().collection(collection.ADMIN_COLLECTION).findOne({Email: userData.Email})
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

    addProduct:(product,callback)=>{
        console.log(product);
        db.get().collection('product').insertOne(product).then((data)=>{
           // console.log(data)
            callback(data.ops[0]._id)
        })
    },

    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
             let products= await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
             resolve(products)
        })
    },

    deleteProducts:(prodId)=>{
        return new Promise(async(resolve,reject)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:ObjectID(prodId)}).then((response)=>{
            resolve(response)
        })
        })
    },

    getProductDetails:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectID(prodId)}).then((products)=>{
                resolve(products)
             })
        })
    },

    editProduct:(prodId,prodDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION)
            .updateOne({_id:ObjectID(prodId)},{
                $set:{
                        Name:prodDetails.Name,
                        Category:prodDetails.Category,
                        Size:prodDetails.Size,
                        Price:prodDetails.Price,
                        Description:prodDetails.Description
                     }
            }).then((response)=>{
                resolve(response )
            })
        })
    },

    removeProducts:(userId,prodId)=>{
        return new Promise(async(resolve,reject)=>{
        let removeProduct=await db.get().collection(collection.CART_COLLECTION)
                .updateOne({user:objectId(userId)},
                {
                    $pull:{products:{item:objectId(prodId)}}   //remove item from pdt array if item & pdt id matches
                })
                if(removeProduct){
                    resolve()
                }
        })
    },








}