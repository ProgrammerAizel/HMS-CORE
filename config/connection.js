var mongoose = require('mongoose')

let connectDb = async ()=>{
    try{
const url = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/HMS';
await mongoose.connect(url);
        console.log("Database connected succesfully");
    }catch(err){
        console.log("database error: ",err)
    }
}

module.exports = connectDb