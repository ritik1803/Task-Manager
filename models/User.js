const { type } = require('express/lib/response');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/first')
    .then(() => console.log("Connected to MongoDB"));

const userSchema= mongoose.Schema({
    username:String,
    name:String,
    email:String,
    password: String,
    tasks:[
        {
           type: mongoose.Schema.Types.ObjectId, ref:"task"       
        }
    ]
});

module.exports=mongoose.model('user',userSchema)