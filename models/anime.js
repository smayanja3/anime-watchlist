const mongoose = require('mongoose') 

const animeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: {
        type: String,
        enum: ['Series', 'Movie', 'OVA'], // enum == enumeration is a special data type used to define a fixed set of named constants
        default: 'Series'
    },
    season: { type: Number, min: 1 },
    totalEpisodes: { type: Number, min: 1 },
    episodesWatched: { type: Number, min: 0, default: 0 },
    status: {
        type: String,
        enum: ['watching', 'planned', 'completed', 'hold'],
        default: 'planned'
    },
    rating: { type: Number, min: 1, max: 10 }, // max and min is necessary here because itprotects the db and the html min and max prevents the user from added a negative number and or messing up the request being sent
    notes: String,
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
});
// a model handles everything  and describes what blank = 'anime' looks like in my db, nad every route used the same model.

module.exports = mongoose.model('Anime', animeSchema) 

/*
Ownership = save the owner of the added shows so that when the user goes to their profile it shows only their own shows and not the whole watchlist.
*/