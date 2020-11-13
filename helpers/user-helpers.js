var db = require('../config/connection')
var collection = require('../config/collections')
var bcrypt = require('bcrypt')
const { CART_COLLECTION } = require('../config/collections')
const { ObjectId } = require('mongodb')
const { response } = require('express')
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
        return new Promise(async(resolve,reject)=>{
            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
            if(userCart){       //user already has a cart - update items
                db.get().collection(collection.CART_COLLECTION).updateOne({user:ObjectId(userId)},
                {
                        $push:{products:objectId(prodId)} 
                }).then((response)=>{
                    resolve()
                })    
            } 
            else{              //no cart -create cart
                let cartObj={
                    user:objectId(userId),
                    products:[objectId(prodId)]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }
        })
    }
}

