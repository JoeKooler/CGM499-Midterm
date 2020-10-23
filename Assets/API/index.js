var socketIO = require("socket.io");
const mongoose = require("mongoose");
var Schema = mongoose.Schema;

var io = socketIO(8888);

const getRandomInt = (min, max) => {
  var tempVal = 0;
  min = Math.ceil(min);
  max = Math.floor(max);
  tempVal = Math.floor(Math.random() * (max - min)) + min;
  console.log("Random Number = " + tempVal);
  return tempVal;
};

var randomNum = getRandomInt(1, 100);

mongoose.connect("mongodb://localhost:27017/unity", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

var UserSchema = new Schema({
  name: { type: String },
  score: { type: Number },
});

const UserModel = mongoose.model("User", UserSchema);

const createUser = async (userName) => {
  const isExist = await UserModel.findOne({ name: userName });
  if (!isExist) {
    const user = new UserModel({ name: userName, score: 0 });
    await user.save();
  }
  console.log(`${userName} Connected!`);
};

const updateUserScore = async (userName, score) => {
  const user = await UserModel.findOne({ name: userName });
  user.score = score;
  user.save();
};

const getUserScore = async (userName) => {
  const user = await UserModel.findOne({ name: userName });
  return user["score"];
};

const getTopFive = async () => {
  const member = await UserModel.find({}).sort("-score").limit(5).exec();
  return member;
};

const setUser = (socket) => {
  socket.on("setUserName", async (data) => {
    const userName = data["userName"];
    await createUser(userName);
    const userScore = await getUserScore(userName);
    socket.emit("scoreUpdate", { score: userScore });
    io.emit("server.reply", {
      hint: userName + "Has entered the server",
      isCorrect: false,
    });
  });
};

const guess = (socket) => {
  socket.on("guess", async (data) => {
    const userName = data["userName"];
    const guessedNumber = data["guessedNumber"];
    if (guessedNumber < randomNum) {
      socket.emit("server.reply", {
        hint: "C'mon the answer is not that low...",
        isCorrect: false,
      });
    } else if (guessedNumber > randomNum) {
      socket.emit("server.reply", {
        hint: "C'mon it's not that high :P",
        isCorrect: false,
      });
    } else {
      socket.emit("server.reply", {
        hint: "Correct! you've got 1 point from that :D",
        isCorrect: true,
      });
      io.emit("server.reply", {
        hint: userName + " got the answer right! Re roll la~",
        isCorrect: false,
      });
      const userScore = await getUserScore(userName);
      updateUserScore(userName, userScore + 1);
      randomNum = getRandomInt(1, 100);
    }
  });
};

const getHighScore = (socket) => {
  socket.on("gethighscore", async () => {
    const member = await getTopFive();
    socket.emit("postHighScore", { payload: member });
    console.log(member);
  });
};

io.on("connection", (socket) => {
  console.log("client connected");
  setUser(socket);
  guess(socket);
  getHighScore(socket);
});

console.log("server started");
