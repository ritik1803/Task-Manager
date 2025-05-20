const mongoose = require('mongoose');


mongoose.connect('mongodb+srv://singhritik2251:RO8VUXKEs4nOJyT4@cluster0.ijongm1.mongodb.net/first?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB connection error:", err));

// Define the user schema
const userSchema = new mongoose.Schema({
    username: String,
    name: String,
    email: String,
    password: String,
    tasks: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "task"
        }
    ]
});

// Export the user model
module.exports = mongoose.model('user', userSchema);
