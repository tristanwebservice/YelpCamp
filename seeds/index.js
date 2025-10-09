const mongoose = require(`mongoose`);
const cities = require(`./cities`);
const { descriptors, places } = require(`./seedHelpers`);
const Campground = require(`../models/campground`);

mongoose.connect(`mongodb://localhost:27017/yelp-camp`);

const db = mongoose.connection;
db.on(`error`, console.error.bind(console, `connection error:`));
db.once(`open`, () => {
  console.log(`database connected`);
});

// pick random element from array
const sample = (array) => array[Math.floor(Math.random() * array.length)];

// seed function
const seedDB = async () => {
  await Campground.deleteMany({});
  for (let i = 0; i < 50; i++) {
    const random1000 = Math.floor(Math.random() * 1000);
    const price = Math.floor(Math.random() * 20) + 10;
    const camp = new Campground({
      author: `68e79e893efb55c1aeecacb3`,
      location: `${cities[random1000].city}, ${cities[random1000].state}`,
      title: `${sample(descriptors)} ${sample(places)}`,
      description: `dolor sit amet consectetur adipisicing elit. quibusdam dolores vero perferendis laudantium.`,
      price,
      // coords needed for map
      geometry: {
        type: "Point",
        coordinates: [
          cities[random1000].longitude,
          cities[random1000].latitude,
        ],
      },
      images: [
        {
          url: "https://res.cloudinary.com/diebt4sd6/image/upload/v1760009714/pexels-miroalt-176381_dqjkvy.jpg",
          filename: "pexels-miroalt-176381_dqjkvy",
        },
        {
          url: "https://res.cloudinary.com/diebt4sd6/image/upload/v1760009714/pexels-vladbagacian-1061640_raahjm.jpg",
          filename: "pexels-vladbagacian-1061640_raahjm",
        },
      ],
    });
    await camp.save();
  }
};

// run and close db
seedDB().then(() => {
  mongoose.connection.close();
});
