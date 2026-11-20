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

//----- all shows == GLOBAL feed, everything EVERYONE added
app.get('/watchlist', (req, res) => {
    Anime.find()
        // populate == swaps the owner id for the actual user so we can print their username
        // 'username' == ONLY grab the username (never send passwords/emails to the page)
        .populate('owner', 'username')
        .sort({ _id: -1 }) // -1 == newest first (mongo ids have the time baked in)
        .then(animes => {
            // currentUser == who is logged in (undefined if nobody) so the card can say "(you)"
            res.render('allShows', { animes, currentUser: req.user })
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
        .populate('owner', 'username') // same as the feed, get the username of who added it
        .then(anime => {
            if (!anime) {
                return res.redirect('/watchlist')
            }
            // isMine == true only if the logged in user added this show
            // they get the edit + delete buttons, everyone else just looks
            const isMine = isOwner(anime, req.user)
            res.render('oneShow', { anime, isMine })
        })
        .catch(err => {
            console.log(err.message)
            res.redirect('/watchlist')
        })
}) 

//----- shows edit form for ONE anime
// added isLoggedIn == the feed is global now so we have to check WHO is editing
app.get('/watchlist/edit/:id', isLoggedIn, (req, res) => {
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
            // not your show? back to the show page, no edit form for you
            if (!isOwner(anime, req.user)) {
                return res.redirect(`/watchlist/${anime._id}`)
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
// isLoggedIn + owner in the search == you can only update YOUR shows
// (without this anyone could send a PUT from the console and change someone elses show)
app.put('/watchlist/:id', isLoggedIn, async (req, res) => {
    console.log('Put to body:', req.body) //<- req.boy == new updated values
    delete req.body.owner // dont let anyone change who owns it

    // findOneAndUpdate == find by id AND owner, if its not yours it finds nothing (null)
    Anime.findOneAndUpdate({ _id: req.params.id, owner: req.user._id }, req.body, { runValidators: true }) // checks the model firsy = rating 11 == fail
        .then((anime) => {
            if (!anime) {
                return res.status(403).json({ error: 'You can only edit shows you added' })
            }
            res.json({ message: 'Updated' })
        })
        .catch(err => {
            console.log(err.message)
            res.status(400).json({ error: err.message })
        })
})

// DELETE ======================================================================
//----- deleted an anime by id ONLY
// same idea as PUT == only the owner can delete
app.delete('/watchlist/:id', isLoggedIn, (req, res) => {
    console.log('Deleted Show:', req.params.id)
    Anime.findOneAndDelete({ _id: req.params.id, owner: req.user._id })
        .then((anime) => {
            if (!anime) {
                return res.status(403).json({ error: 'You can only delete shows you added' })
            }
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
    // profile == MY watchlist (only what i added), the /watchlist page is everyone
    Anime.find({ owner: req.user._id })
                        // ^^^^^ value in the db
        .populate('owner', 'username') // so the cards can say "added by" like the feed
        .sort({ _id: -1 })
             //vvvv variable name = i made up
        .then(watching => {
            res.render('profile', { user: req.user, watching, currentUser: req.user })
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

//--------- IS OWNER
// true if the logged in user is the one who added this anime
// works if owner is just an id OR a populated user ({ _id, username })
// String() on both == ids are objects in mongoose so === wont work on them directly
function isOwner(anime, user) {
    if (!anime.owner || !user) return false // nobody logged in or old show with no owner
    const ownerId = anime.owner._id || anime.owner
    return String(ownerId) === String(user._id)
}

app.get('/', (req, res) => {
  res.redirect('/login');
});

// launch ======================================================================

app.listen(PORT, () => {
    console.log(`Server is BURING OIL on PORT ${PORT}`)
})
