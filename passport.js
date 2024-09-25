const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require("passport");
require('dotenv').config();
passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: "/auth/google/callback",
			scope: ["profile", "email"],
		},
		function (accessToken, refreshToken, profile, callback) {
			callback(null, profile);
		}
	)
);

passport.serializeUser((user, done) => {
	done(null, user);
});

passport.deserializeUser((user, done) => {
	done(null, user);
});

// const passport =require('passport')
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const mongoose = require('mongoose');
// const User = require('./models/User');  // Import the User model
// require('dotenv').config();

// // Google OAuth strategy
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: '/auth/google/callback',
//     },
//     async (accessToken, refreshToken, profile, done) => {
//         callback(null,profile);
//     //   try {
//     //     // Check if user already exists in the database
//     //     let user = await User.findOne({ googleId: profile.id });

//     //     if (user) {
//     //       // If user exists, return the user
//     //       return done(null, user);
//     //     } else {
//     //       // If user doesn't exist, create a new user
//     //       user = new User({
//     //         googleId: profile.id,
//     //         displayName: profile.displayName,
//     //         email: profile.emails[0].value,  // Getting email from profile
//     //         profilePicture: profile.photos[0].value,  // Getting profile picture
//     //       });

//     //       await user.save();
//     //       return done(null, user);
//     //     }
//     //   } catch (err) {
//     //     console.error(err);
//     //     return done(err, null);
//     //   }
//     }
//   )
// );

// // Passport serialize user
// passport.serializeUser((user, done) => {
//   done(null, user.id);
// });

// // Passport deserialize user
// passport.deserializeUser(async (id, done) => {
//   try {
//     const user = await User.findById(id);
//     done(null, user);
//   } catch (err) {
//     done(err, null);
//   }
// });
