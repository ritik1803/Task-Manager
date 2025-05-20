

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
