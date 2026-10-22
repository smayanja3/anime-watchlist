const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

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
    }
})
 
// creates hash
userSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, 10)
}
// checks if the password is valid
userSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.password)
}

module.exports = mongoose.model('User', userSchema)