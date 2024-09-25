const mongoose = require('mongoose');
require("dotenv").config();

exports.connectDB = () => {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(()=>{console.log("DB connected successfully");})
  .catch((err)=>{
    console.log("DB connection failed!");
    console.error(err.message);
    process.exit(1);
  })
};