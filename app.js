const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const { redirect } = require("statuses");

const app = express();
app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static("public"));

const about = "Content to display";
const feedback =
  "if you have any suggestion to improve this blog please do type ";
const homeContent = "ee all confessions your friends have made";

//connect to mongoose
mongoose.connect("mongodb+srv://nn_code:password@123@cluster0.g2qveat.mongodb.net/studentDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//create schema
const FriendSchema = new mongoose.Schema({
  name: String,
  Content: String,
});

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  scholarNo: String,
});

const msgSchema = new mongoose.Schema({
  // _id: mongoose.Schema.Types.ObjectId,
  senderId: mongoose.Schema.Types.ObjectId,
  recId: mongoose.Schema.Types.ObjectId,
  // recId: String,
  msg: String,
  // sender: String,
});

//create model
const Friend = mongoose.model("Friend", FriendSchema);
const User = mongoose.model("User", userSchema);
const Msg = mongoose.model("Msg", msgSchema);

app.get("/", function (req, res) {
  if (req.headers.cookie) {
    console.log(req.headers.cookie, "checking ");
    if (req.headers.cookie.split("=")[1] != "LogOut") {
      res.redirect("/main");
    } else {
      res.render("about", { About: about });
    }
  } else {
    res.render("about", { About: about });
  }
});
app.get("/register", function (req, res) {
  res.render("register");
});
app.get("/signin", function (req, res) {
  res.render("signin");
});

//when submit button get hit it will make a post request to register route
app.post("/register", function (req, res) {
  User.find({ email: req.body.email })
    .exec()
    .then((result) => {
      if (result.length >= 1) {
        res.json({ msg: "Email Already Exist" });
      } else {
        const newUser = new User({
          name: req.body.name,
          scholarNo: req.body.scholar_no,
          email: req.body.email,
          password: req.body.password,
        });
        newUser.save(function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log(newUser);
            res.cookie("userId", newUser._id, { httpOnly: true });
            res.render("main");
          }
        });
      }
    });
});
//creating post method for login route if user is found then  will be taken to the home page other wise asked to login
app.post("/signin", function (req, res) {
  userEmail = req.body.email;
  userPassword = req.body.password;
  User.findOne({ email: userEmail }, function (err, user) {
    if (err) {
      console.log(err);
    } else {
      if (user) {
        if (user.password === userPassword) {
          console.log(user);
          res.cookie("userId", user._id, { httpOnly: true });
          res.redirect("/main");
        }
      } else {
        res.render("nouser");
      }
    }
  });
});

app.get("/main", function (req, res) {
  console.log(req.headers.cookie);
//.cookie.split("=")[1]
  if (req.headers.cookie.split("=")[1] != "LogOut") {
     console.log(req.headers.cookie.split("=")[1].split("%")[2].slice(2));
    User.find({ _id: req.headers.cookie.split("=")[1].split("%")[2].slice(2) })
      .exec()
      .then((user) => {
        console.log(user);
        const userName = user[0].name;
        console.log(userName);
        res.render("main", { userName: userName });
      });
  } else {
    res.json({ message: "User not logged in." });
  }
});

app.get("/friends", (req, res) => {
  User.find({})
    .exec()
    .then((users) => {
      console.log(users, "users");
      res.render("friends", { users: users });
    });
  // res.json({ msg: "Friends Page here" });
});

app.get("/friends/:friendId", (req, res) => {
  console.log("I here");
  User.find({ _id: req.params.friendId })
    .exec()
    .then((users) => {
      const friendName = users[0].name;
      console.log(friendName);
      res.render("msg", {
        friendName: friendName,
        friendId: req.params.friendId,
        success: false,
      });
    });
});

app.post("/friends/:friendId", (req, res) => {
  // res.json({ friendId: req.params.friendId });
  const senderId = req.headers.cookie.split("=")[1].split("%")[2].slice(2);
  User.find({ _id: req.params.friendId })
    .exec()
    .then((user) => {
      const friendName = user[0].name;
      // console.log(userName);
      const newMsg = new Msg({
        recId: req.params.friendId,
        msg: req.body.describe,
        senderId: senderId,
      });
      newMsg.save(function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log(newMsg);
          res.render("msg", {
            friendName: friendName,
            friendId: req.params.friendId,
            success: true,
          });
        }
      });
    });
});

app.post("/search", (req, res) => {
  User.find({ name: req.body.search })
    .exec()
    .then((users) => {
      console.log(users, "search users");
      res.render("friends", { users: users, msg: false });
    });
});

app.get("/Confessions", function (req, res) {
  Friend.find({}, function (err, posts) {
    console.log(posts);
    res.render("home", { homeContent: homeContent, postarr: posts });
  });
});

app.get("/confess", function (req, res) {
  if (req.headers.cookie.split("=")[1] != "LogOut") {
    res.render("confess");
  } else {
    res.json({ message: "User not logged in." });
  }
});

app.post("/confess", (req, res) => {
  const confession = new Friend({
    name: req.body.frname,
    Content: req.body.describe,
  });
  confession
    .save()

    .then((err) => {
      res.json({ msg: "Saved" });
    });
});


app.get("/mymsg", function (req, res) {
  if (req.headers.cookie.split("=")[1] != "LogOut") {
    const rec = req.headers.cookie.split("=")[1].split("%")[2].slice(2);
    Msg.find({ recId: rec }, function (err, allmsg) {
      if (err) {
        console.log(err);
      } else {
        console.log(allmsg);
        //console.log(loginUser);

        res.render("mymsg", { currentUser: rec, allmsg: allmsg });
      }
    });
  } else {
    res.json({ message: "User not logged in." });
  }
});

// app.post("/friends", function (req, res) {
//   if (req.headers.cookie.split("=")[1] != "LogOut") {
//     const searchName = req.body.searchName;
//     console.log(searchName);
//     User.find({}, function (err, posts) {
//       console.log(posts);
//       res.render("friends", { All_friend: posts, searchName: searchName });
//     });
//   } else {
//     res.json({ message: "User not logged in." });
//   }
// });

// app.post("/msg", (req, res) => {
//   User.find({ _id: req.headers.cookie.split("=")[1].split("%")[2].slice(2) })
//     .exec()
//     .then((user) => {
//       const userName = user[0].name;
//       console.log(userName);

//       const newMsg = new Msg({
//         recId: req.body.recv,
//         msg: req.body.describe,
//         senderId: userName,
//       });
//       newMsg.save(function (err) {
//         if (err) {
//           console.log(err);
//         } else {
//           console.log(newMsg);
//           res.render("main");
//         }
//       });
//     });
// });

app.get("/logout", function (req, res) {
  log = "LogOut";
  res.cookie("userId", log, { httpOnly: true });
  console.log(req.headers);
  res.redirect("/");
});

let port = process.env.PORT;
if(port == null || port=="")
{
  port=8000;
}
app.listen(port, function (req, res) {
  console.log("server has started");
});
