var db = require('../config/connection')
var collection = require('../config/collections')
var bcrypt = require('bcrypt')

module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.Psw = await bcrypt.hash(userData.Psw,10);
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data.ops[0])
            })
        })
    }
}

