// set up ======================================================================
require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt') 
const session = require('express-session')
const passport = require('passport')
const flash = require('connect-flash')
const app = express()
let PORT = process.env.PORT || 3050;
const Anime = require('./models/anime')
const User = require('./models/user')


// connect to MongoDb ======================================================================
const configURL = process.env.MONGODB_URI
mongoose.connect(configURL)
mongoose.connection.on('connected', () => {
    console.log(`Connected to MongoDB: ${mongoose.connection.name}`)
})

mongoose.connection.on('error', (err) => {
    console.log('NOT != MongoDB:', err.message)
})


// configure ======================================================================
require('./config/passport')(passport) // pass passport for the config from passport.js


// express app ======================================================================

//pages are ejs files
app.set('view engine', 'ejs')
//srves css and images files in folder
app.use(express.static('public'))
//read from data and put it on re.body
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false, // does not resave the session if nothing changed only saves after cahnges
    saveUninitialized: false, // do not create session for non users
}))

app.use(passport.initialize())
app.use(passport.session()) // keeps you looged in
app.use(flash()) // flash messages stored in session

//vvvv add prefix /watchlist before each route how to set up controllers????
//app.use('watchlist', watchlistController) 


// GET ======================================================================

/////////////////////////////////////////////
//////// RENDER EMPTY FORMS  ////////////////
/////////////////////////////////////////////

//----- all shows
app.get('/watchlist', (req, res) => {
    Anime.find()
        .then(animes => {
            res.render('allShows', { animes })
        })
        .catch(err => {
            console.log(err.message)
            res.status(500).send('Something went wrong loading the watchlist')
        })
})

//----- empty add form 
// added isLoggedIn so its protected for users ONLY
app.get('/watchlist/new',isLoggedIn, (req, res) => {
    res.render('add')
})

/////////////////////////////////////////////
//////// RENDER SET UP CRUD  ////////////////
/////////////////////////////////////////////

//----- ONE shows
app.get('/watchlist/:id', (req, res) => {
    // returned a boolean checking if this the a db ID
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.redirect('/watchlist')
    }
    //returns one anime by id or null
    Anime.findById(req.params.id)
        .then(anime => {
            if (!anime) {
                return res.redirect('/watchlist')
            }
            res.render('oneShow', { anime })
        })
        .catch(err => {
            console.log(err.message)
            res.redirect('/watchlist')
        })
})

//----- shows edit form for ONE anime
app.get('/watchlist/edit/:id', (req, res) => {
    // returned a boolean checking if this the a db ID
    // /watchlist/edit/apple == could crash everything
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.redirect('/watchlist')
    }
    Anime.findById(req.params.id)
        .then(anime => {
            if (!anime) {
                return res.redirect('/watchlist')
            }
            res.render('edit', { anime })
        })
        .catch(err => {
            console.log(err.message)
            res.redirect('/watchlist')
        })
})


// POST ======================================================================
//----- add == save an anew anime
// added isLoggedIn so its protected for users ONLY
app.post('/watchlist', isLoggedIn, (req, res) => {
    req.body.owner = req.user._id // logged in user owns this anime
    console.log(req.body)
    Anime.create(req.body)
        .then(() => {
            res.redirect('/watchlist')
        })
        .catch(err => {
            console.log(err.message)
            res.redirect('/watchlist/new')
        })
})


// PUT ======================================================================

//----- edit show
//async -> await + try -> catch err
app.put('/watchlist/:id', async (req, res) => {
    console.log('Put to body:', req.body) //<- req.boy == new updated values
    Anime.findByIdAndUpdate(req.params.id, req.body, { runValidators: true }) // checks the model firsy = rating 11 == fail
        .then(() => {
            res.json({ message: 'Updated' })
        })
        .catch(err => {
            console.log(err.message)
            res.status(400).json({ error: err.message })
        })
})

// DELETE ======================================================================
//----- deleted an anime by id ONLY
app.delete('/watchlist/:id', async (req, res) => {
    console.log('Deleted Show:', req.params.id)
    Anime.findByIdAndDelete(req.params.id)
        .then(() => {
            res.json({ message: 'Deleted' })
        })
        .catch(err => {
            console.log(err.message)
            res.status(400).json({ error: err.message })
        })

    //i tried to do a redirect but one response can only handle one request
})

//======================================================================
// AUTHENTICATION ======================================================
//======================================================================

//------ signup form
//blank form
app.get('/signup', (req, res) => {
    res.render('signup', { message: req.flash('signupMessage') })
})
//process the signup form
app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/signup',
    failureFlash: true,
}))

//------- login form
//blank form
app.get('/login', (req, res) => {
    res.render('login', { message: req.flash('loginMessage') })
})

//process the login form
app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true,
}))

//------- logout
app.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err)
        res.redirect('/login')
    })
})

//-------- profile (only for logged in users)
app.get('/profile', isLoggedIn, (req, res) => {
    // added owner - anime i own and i watched
    Anime.find({ owner: req.user._id })
                        // ^^^^^ value in the db
             //vvvv variable name = i made up           
        .then(watching => {
            res.render('profile', { user: req.user, watching })
        })
        .catch(err => {
            console.log(err.message)
            res.status(500).send('Something went wrong loading your profile')
        })

})



//--------- LOGGEDIN
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next() // logg in was successful
    }
    res.redirect('/login') // not logged in
}


// launch ======================================================================

app.listen(PORT, () => {
    console.log(`Server is BURING OIL on PORT ${PORT}`)
})
