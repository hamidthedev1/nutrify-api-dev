const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();


//Importing user model
const userModel = require("./models/userModel")
//Importing food model
const foodModel = require('./models/foodModel');
const trackingModel = require('./models/trackingModel')
//Importing middleware 
const verifyToken = require('./middleware/verifyToken');
const { configDotenv } = require('dotenv');



// database connection
mongoose
  .connect(process.env.DATABASE_URL) 
  .then(() => {
    console.log("database connection successful");
  })
  .catch((err) => {
    console.log(err);
  });


const app = express()
//middleware for extracting req body data
app.use(express.json())

//endpoint for registering user
app.post("/register", (req, res) => {
  let user = req.body;

  bcrypt.genSalt(10, (err, salt) => {
    if (!err) {
      bcrypt.hash(user.password, salt, async (err, hpass) => {
        if (!err) {
          user.password = hpass;
          try {
            let doc = await userModel.create(user);
            console.log(doc);
            res.status(201).send({ message: "user registered" });
          } catch (err) {
            console.log(err);
            res.status(500).send({ message: "some problem" });
          }
        }
      });
    }
  });
});
  //endpoint for login
  app.post("/login", async (req, res) => {
    let userCred = req.body;
    // console.log(userCred);
    try {
      const user = await userModel.findOne({ email: userCred.email })
      if (user) {
       const success = await bcrypt.compare(userCred.password, user.password)
          if (success) {
            jwt.sign({ email: userCred.email }, "nutrifyapp",(err, token)=> {
              if (!err) {
                res
                  .status(200)
                  .send({ message: "Login Success", token: token });
              }
            })
          } else {
            res.status(403).send({message:"Incorrect Password"})
          }
        
      } else {
        res.status(404).send({message:"User Not Found"})
      }
      
    } catch (err) {
      console.log(err);
      res.status(500).send({message:"Internal Server Error"})
    }
  })


// endpoint to fetch all food
app.get("/foods", verifyToken, async (req, res) => {

  try {
    let foods = await foodModel.find()
    res.send(foods)
  } catch (err) {
    console.log(err);  
    res.status(500).send({message:"Some Problem while getting infos"})
  }
})

// Search food by name
app.get("/foods/name/:name", verifyToken, async (req, res) => {
  try {
    let foods = await foodModel.find({
      name: { $regex: req.params.name, $options: "i" },
    });
    if (foods.length !== 0) {
      res.send(foods);
    } else {
      res.status(404).send({ message: "Food Item Not Found" });
    }
  } catch (err) {
    console.log(err);
    res.status(403).send({ message: "Food Not Found" });
  }
});

// Search food by category
app.get("/foods/category/:category", verifyToken, async (req, res) => {
  try {
    let foodsByCategory = await foodModel.find({
      category: { $regex: req.params.category, $options: "i" },
    });
    res.send(foodsByCategory);
  } catch (err) {
    console.log(err);
    res.send({ message: "Some problem while finding the foods" });
  }
});

//endpoint to track a food

app.post("/track", verifyToken, async (req, res) => {
  let trackData = req.body;
  console.log(trackData);
  try {
    let data = await trackingModel.create(trackData);
    // console.log(data);
    res.status(201).send({message:"Food Added"})
  } catch (err) {
    console.log(err);
    res.send({message:"Some Problem in in adding the food"})
  }
})
// endpoint to fetch all foods eaten by a Person 
app.get("/track/:userid/:date", verifyToken, async (req, res) => {
  let userid = req.params.userid;
  let date = new Date(req.params.date);
  let strDate =
    date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
console.log(strDate,date);
  try {
    let foods = await trackingModel
      .find({ userId: userid, eatenDate: strDate })
      .populate("userId")
      .populate("foodId");
    res.send(foods);
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Some Problem in getting the food" });
  }
});



app.listen(process.env.PORT, () => {
  console.log("server is up and running");
})
