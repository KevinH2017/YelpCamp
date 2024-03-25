require('dotenv').config();

const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground');

mongoose.set('strictQuery', true);                       // Supresses strictQuery warning message
mongoose.connect('mongodb://127.0.0.1:27017/YelpCamp', { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true })  // Must use port 27017
    .then(() => {
        console.log("MONGO CONNECTION OPEN!");
    })
    .catch(err => {
        console.log("MONGO ERROR OCURRED!");
        console.log(err);
    })

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database Connected!");
});

// Randomly creates campgrounds with cities, states and title descriptors from ./seedHelpers.js
const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 50; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            author: '65cd4da8a32d6835646ca54a',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'Lorem ipsom dolor sit amet consectetur',
            price,
            geometry: {
                type: "Point",
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude,
                ]
            },
            images: [
                {
                  url: 'https://res.cloudinary.com/dbyeazlaj/image/upload/v1708795786/YelpCamp/pcaahuo80ojmhrzczjsi.jpg',
                  filename: 'YelpCamp/pcaahuo80ojmhrzczjsi'
                },
                {
                  url: 'https://res.cloudinary.com/dbyeazlaj/image/upload/v1708795786/YelpCamp/zacg0d7riljzkicnhelw.jpg',
                  filename: 'YelpCamp/zacg0d7riljzkicnhelw'
                },
              ],
        })
        await camp.save();
    }
}

// Runs seedDB and closes mongoose connection after
seedDB().then(() => {
    mongoose.connection.close()
});