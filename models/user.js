const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minLength: 6,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        timstamps: true, // atlas creates these automaticaly createdAt and updatedAt 
        minLength: 8,
    }
})

module.exports = mongoose.model('User', userSchema)