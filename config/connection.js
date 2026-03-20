var mongoose = require('mongoose')

let connectDb = async ()=>{
    try{
        await mongoose.connect('mongodb://127.0.0.1:27017/HMS');
        console.log("Database connected succesfully");
    }catch(err){
        console.log("database error: ",err)
    }
}

module.exports = connectDb