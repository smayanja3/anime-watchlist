const LocalStrategy = require('passport-local').Strategy
const User = require('../models/user')

// export a function that sets up passport. server.js calls it and passes passport in
module.exports = function (passport) {

    // ====================================================================
    // passport session setup =========================================
    // ================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // saves the users id in the session
    passport.serializeUser((user, done) => {
        done(null, user._id)
    })

    // use the id to find the user on every request -> req.user
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id).select('-password')
            //no error and here is the user
            done(null, user)
        } catch (err) {
            done(err)
        }
    })

    // ================================================================
    // login -- signup ================================================
    // ================================================================
    passport.use('local-signup', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true, // allows us to read re.body.email and use req.flash
    },
        async (req, username, password, done) => {
            try {
                const email = req.body.email

                //check is the username or email is already taken
                const exisitingUser = await User.findOne({ $or: [{ username }, { email }] })
                if (exisitingUser) {
                    return done(null, false, req.flash('signupMessage', 'That username or email is already taken'))
                }

                //created the user w/ a hash
                const newUser = new User({ username, email })
                newUser.password = newUser.generateHash(password)
                await newUser.save()
                return done(null, newUser)
            }
            catch (err) {
                return done(err)
            }
        }
    ))

    // ================================================================
    // local login ================================================
    // ================================================================

    passport.use('local-login', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true,
    },

        async (req, username, password, done) => {
            try {
                const user = await User.findOne({ username })

                //no user found
                if (!user) {
                    return done(null, false, req.flash('loginMessage', 'No User Found'))
                }

                // wrong password
                if (!user.validPassword(password)) {
                    // no error just wrong password
                    return done(null, false, req.flash('loginMessage', 'Wrong Password!!'))
                }

                //perfect match return the user
                return done(null, user)

            } catch (err) {
                return done(err)
            }
        }
    ))

}