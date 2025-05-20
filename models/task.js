<<<<<<< HEAD


const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: String,
    details: String,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

module.exports = mongoose.model('task', taskSchema);
=======


const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: String,
    details: String,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

module.exports = mongoose.model('task', taskSchema);
>>>>>>> 2e84a7f4eae470a565c8e148b7cc4da2bd9f4506
