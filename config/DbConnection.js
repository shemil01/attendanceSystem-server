const mongoose = require("mongoose");

const connectDb = async function () {
  try {
    await mongoose.connect(process.env.MONGO_URL).then(() => {
      console.log("Database connected");
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
module.exports = connectDb;
