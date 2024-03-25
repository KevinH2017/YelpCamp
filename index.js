require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const ExpressError = require('./utils/ExpressError');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');

const MongoDBStore = require("connect-mongo")(session);

// SrcUrls only allows images and scripts from these links
const scriptSrcUrls = [
    "https://kit.fontawesome.com",
    "https://cdnjs.cloudflare.com",
    "https://cdn.jsdelivr.net",
    "https://unpkg.com/",
];

const styleSrcUrls = [
    "https://kit-free.fontawesome.com",
    "https://api.tiles.mapbox.com",
    "https://fonts.googleapis.com",
    "https://use.fontawesome.com",
    "https://unpkg.com/",
    "https://cdn.jsdelivr.net",
];

const connectSrcUrls = [
    "https://api.mapbox.com",
    "https://*.tiles.mapbox.com",
    "https://events.mapbox.com",
    "https://unpkg.com/",
];

const fontSrcUrls = [];

// Points to node_modules folder relative to this file
module.exports = {
    resolve: {
      modules: [path.resolve('../..', 'node_modules'), 'node_modules']
    }
  };

const mongoose = require('mongoose');

const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/YelpCamp';
const secret = process.env.SECRET

mongoose.set('strictQuery', true);                       // Supresses strictQuery warning message
mongoose.connect(dbUrl, { 
    useNewUrlParser: true, 
    useCreateIndex: true, 
    useUnifiedTopology: true,
    useFindAndModify: false })
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

app.engine('ejs', ejsMate);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize({
    replaceWith: '_'
}))

// Creates a store object in mongoDB to hold session information
const store = new MongoDBStore({
    url: dbUrl,
    secret: secret,
    touchAfter: 24 * 60 * 60,
});

store.on("error", function(e) {
    console.log("SESSION STORE ERROR", e)
})

// Creates session cookie for browser with a specific name
const sessionConfig = {
    store,
    name: 'YelpCampSession',
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,        // Cookie will only work in HTTPS, localhost is not HTTPS (cannot login to account)
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,      // milliseconds, seconds, minutes, hours, days
        maxAge: 1000 * 60 * 60 * 24 * 7,
    }
};
app.use(session(sessionConfig));
app.use(flash());
app.use(helmet());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));           // authenticate() is from passport-local-mongoose

passport.serializeUser(User.serializeUser());                   // Serializes a user into the session
passport.deserializeUser(User.deserializeUser());               // Deserializes user from session

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    return next();
});

app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            childSrc: ["blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dbyeazlaj/",
                "https://images.unsplash.com",
                "https://unpkg.com/",
                "https://*.tile.openstreetmap.org/",
                "https://*.tile.osm.org/",
                "http://*.tile.osm.org/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);

app.get('/', (req, res) => {
    res.render("home");
});

// Runs when none of the above run, returns 404 error
app.all('*', (req, res, next) => {
    return next(new ExpressError('404 Page Not Found', 404))
});

// Generic error handler for all cases
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No! Something Went Wrong!';
    res.status(statusCode).render('error', { err });
});

app.listen(8080, () => {
    console.log("LISTENING ON PORT 8080!");
});