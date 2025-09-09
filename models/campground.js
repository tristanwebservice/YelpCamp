const mongoose = require(`mongoose`); // mongoose lib
const Schema = mongoose.Schema; // shortcut

// the blueprint for each campground
const CampgroundSchema = new Schema({
  title: String,
  image: String,
  price: Number,
  description: String,
  location: String,
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: `Review`,
    },
  ],
});

// mongoose will create a model named Campground based on the schema
// the model interacts with the db, allowing to save and find info
// by exporting it, the entire project can use it
module.exports = mongoose.model(`Campground`, CampgroundSchema);
