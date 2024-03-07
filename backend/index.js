const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
const routes = require("./routes/routes");

app.use(routes);

app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:4200"],
  })
);

app.use(cookieParser());

app.use(express.json());

app.use("/api", routes);

mongoose.connect("mongodb://localhost:27017/dbconnect").then(() => {
  console.log("connected to database");
  app.listen(3000, () => {
    console.log("app running on port 3000");
  });
});
