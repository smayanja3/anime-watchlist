// set up ======================================================================
require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const app     = express()
let PORT      = process.env.PORT || 3050;
const Anime = require('./models/anime')
const passport = require('passport')
const bcrypt = require('bcrypt') // turns a password into a hash -> hash only works one way you cant revert back to password
const User = require('./models/user')
const session = require('express-session')
// const Anime = require('./models/anime')

//pages are ejs files
app.set('view engine', 'ejs')
//srves css and images files in folder
app.use(express.static('public'))
//read from data and put it on re.body
app.use(express.urlencoded({extended: false}))
app.use(express.json())

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false, // only saves a session when something is stored in it... so visitor who do not long in can not create db entries == saveUninitialized
  saveUninitialized: false,
}))

//vvvv add prefix /watchlist before each route how to set up controllers????
//app.use('watchlist', watchlistController) 

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


// express app ======================================================================


//ROUTES ======================================================================
//res




// AUTH ======================================================================




// GET ======================================================================

/////////////////////////////////////////////
//////// RENDER SET UP PAGES ////////////////
/////////////////////////////////////////////
//----- signup form
app.get('/signup', (req, res) => {
    res.render('signup')
})

//----- login form
app.get('/login', (req, res) => {
    res.render('login')
})

app.get('/logout', (req, res) => {
        res.redirect('/login')
})

app.get('/profile', async (req,res) => {
    const watching = await Anime.find({ status: 'watching'})
    res.render('profile', { user: req.user, watching })
})

//----- all shows
app.get('/watchlist', async (req, res) => {
    const animes = await Anime.find()
    res.render('allShows', {animes})
})

//----- empty add form
app.get('/watchlist/new', (req,res) => {
    res.render('add')
})

/////////////////////////////////////////////
/////////////////////////////////////////////

//----- ONE shows
app.get('/watchlist/:id', async (req, res) => {
    // returned a boolean checking if this the a db ID
    if(!mongoose.isValidObjectId(req.params.id)) {
        return res.redirect('/watchlist')
    }
    //returns one anime by id or null
    const anime = await Anime.findById(req.params.id)

    if(!anime) {
        return res.redirect('/watchlist')
    }
    res.render('oneShow', {anime})
})

//----- shows edit form for ONE anime
app.get('/watchlist/edit/:id', async (req, res) => {
     // returned a boolean checking if this the a db ID
     // /watchlist/edit/apple == could crash everything
    if(!mongoose.isValidObjectId(req.params.id)) {
        return res.redirect('/watchlist')
    }
    const anime = await Anime.findById(req.params.id)
    res.render('edit', {anime})
})


// //----- signup form
// app.get('/signup', (req, res) => {
//     res.render('signup')
// })

// //----- login form
// app.get('/login', (req, res) => {
//     res.render('login')
// })


// POST ======================================================================
//----- add == save an anew anime
app.post('/watchlist', async (req,res) => {
  try{
    console.log(req.body)
    await Anime.create(req.body)
    res.redirect('/watchlist')
  } catch (err) {
    console.log(err.message)
    res.redirect('/watchlist/new')
  }
    //res.send('You just Got A Letter')
})


//---------- signup

app.post('/signup', async (req, res) => {

     try {
        const { username, email, password } = req.body
        console.log('Signing up:', username, email)

        const existingUser = await User.findOne({ $or: [{ username }, { email }]}) //match if ANY condition in the list is true
        if(existingUser) {
            console.log('Username or email already taken')
            return res.redirect('/signup')
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        await User.create({ username, email, password: hashedPassword})
        res.redirect('/login')
    }catch(err) {
        console.log(err.message)
        res.redirect('/signup')
    }
})



// PUT ======================================================================

//----- edit show
//async -> await + try -> catch err
app.put('/watchlist/:id', async (req, res) => {
    try{
        console.log('Put to body:', req.body) //<- req.boy == new updated values
        await Anime.findByIdAndUpdate(req.params.id, req.body, {runValidators: true}) // checks the model firsy = rating 11 == fail
        res.json({message: 'Updated'})
    }catch(err) {
        console.log(err.message)
        res.status(400).json({error: err.message})
    }
})

// DELETE ======================================================================
//----- deleted an anime by id ONLY
app.delete('/watchlist/:id', async (req, res) => {
    try{
        console.log('Deleted Show:', req.params.id)
        await Anime.findByIdAndDelete(req.params.id)
        res.json({message: 'Deleted'})
    }catch(err) {
        console.log(err.message)
        res.status(400).json({error: err.message})
    }
    //i tried to do a redirect but one response can only handle one request
})











// launch ======================================================================

app.listen(PORT, () => {
    console.log(`Server is BURING OIL on PORT ${PORT}`)
})
