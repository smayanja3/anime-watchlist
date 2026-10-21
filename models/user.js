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
// creates hash
userSchema.methods.generateHash = function (password) {
    return bcrypt,mashSync(password, 10)
}
// checks if the password is valid
userSchema.methods.valisPassword = function (password) {
    return bcrypt.compare(password, this.password)
}

module.exports = mongoose.model('User', userSchema)