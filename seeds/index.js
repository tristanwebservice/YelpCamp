// init mongoose lib, import cities data, import db model
const mongoose = require(`mongoose`);
const cities = require(`./cities`);
const { descriptors, places } = require(`./seedHelpers`);
const Campground = require(`../models/campground`);

mongoose.connect(`mongodb://localhost:27017/yelp-camp`); // mongo running on 27017, temporary hardcode

// error handling for db connection
const db = mongoose.connection;
db.on(`error`, console.error.bind(console, `connection error:`));
db.once(`open`, () => {
  console.log(`Database connected`);
});

// this will help to generate a title
const sample = (array) => array[Math.floor(Math.random() * array.length)];

// this function will populate our db with sample data (also ensures data is freshly generated)
const seedDB = async () => {
  await Campground.deleteMany({});
  for (let i = 0; i < 50; i++) {
    const random1000 = Math.floor(Math.random() * 1000);
    const price = Math.floor(Math.random() * 20) + 10;
    const camp = new Campground({
      location: `${cities[random1000].city}, ${cities[random1000].state}`,
      title: `${sample(descriptors)} ${sample(places)}`,
      image: `https://picsum.photos/400?random=${Math.random()}`,
      description: `Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ea quibusdam, expedita dolorem repudiandae assumenda atque ullam aliquam iusto cumque neque qui amet hic tempora doloremque necessitatibus, delectus harum nihil libero?`,
      price,
    });
    await camp.save();
  }
};

// executes the function, loads db and closes db
seedDB().then(() => {
  mongoose.connection.close();
});
