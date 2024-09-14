const mongoose = require('mongoose');


const exerciseSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    date: String,
    dateobj: {
        type: Date,
        select: false,
        default: Date.now()
    }
});

exerciseSchema.pre('save', function (next)
{
    if (!this.date)
    {
        this.date = this.dateobj.toDateString();
    }
    next();
});


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    count: Number,
    log: [exerciseSchema]
});

module.exports.User = mongoose.model('User', userSchema);
module.exports.Exercise = mongoose.model('Exercise', exerciseSchema);
