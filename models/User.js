<<<<<<< HEAD
const { type } = require('express/lib/response');
const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://singhritik2251:RO8VUXKEs4nOJyT4@cluster0.ijongm1.mongodb.net/first?retryWrites=true&w=majority&appName=Cluster0')

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

=======
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

>>>>>>> 2e84a7f4eae470a565c8e148b7cc4da2bd9f4506
module.exports=mongoose.model('user',userSchema)