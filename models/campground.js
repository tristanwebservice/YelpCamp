const mongoose = require(`mongoose`); // mongoose lib
const { campgroundSchema } = require("../schemas");
const Schema = mongoose.Schema; // shortcut
const Review = require(`./review`);
const user = require("./user");
const { string } = require("joi");

// the blueprint for each campground
const CampgroundSchema = new Schema({
  title: String,
  images: [
    {
      url: String,
      filename: String,
    },
  ],
  price: Number,
  description: String,
  location: String,
  author: {
    type: Schema.Types.ObjectId,
    ref: `User`,
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: `Review`,
    },
  ],
});

CampgroundSchema.post(`findOneAndDelete`, async function (doc) {
  if (doc) {
    await Review.deleteMany({ _id: { $in: doc.reviews } });
  }
});

// mongoose will create a model named Campground based on the schema
// the model interacts with the db, allowing to save and find info
// by exporting it, the entire project can use it
module.exports = mongoose.model(`Campground`, CampgroundSchema);
