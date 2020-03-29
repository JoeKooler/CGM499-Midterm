var express = require('express');
var socketIO = require('socket.io');
const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var app = express();
var io = socketIO(8888);

const getRandomInt = (min, max) => {
    var tempVal = 0;
    min = Math.ceil(min);
    max = Math.floor(max);
    tempVal = Math.floor(Math.random() * (max - min)) + min;    
    console.log("Random Number = " + tempVal);
    return tempVal;
}


var randomNum = getRandomInt(1,100);

mongoose.connect('mongodb://localhost:27017/unity', {useNewUrlParser: true, useUnifiedTopology: true});

var UserSchema = new Schema({
    name: {type:String},
    score: {type:Number}
});

const UserModel = mongoose.model('User', UserSchema);

//Server most likely to be online 24/7 mapping user and ip wouldn't be a good idea
//We'll send userName from client everytime instead >_>
//If we have login we'd do something like JWT anyway so it's not that heavy request



const createUser = (userName,cb) => {
    UserModel.findOne({ name: userName } , (err,user) => {
        if(err)
            throw(err);
        if(user){
            console.log("Already exist naja");
            cb();
        }else{
            const user = new UserModel({ name: userName,score : 0 });
            user.save().then(() => {
                console.log("User has been created!");
            }).then(() => cb());
        }
    })
}


const updateUserScore = (userName,score) => {
    UserModel.findOne({"name" : userName}, (err,user) => {
        if(err)
            throw(err);
        if(user){
            user.score = score
            user.save().then(() => console.log(`Update ${userName} score = ${score}`))
        }
    });
}

const getUserScore = (userName,cb) => {
    UserModel.findOne({"name" : userName},(err,userInfo) => {
        console.log("Score " + userInfo['score']);
        cb(userInfo['score']);
    });
}

const getTopFive = (cb) => {
    UserModel.find({}).sort('-score').limit(5).exec((err,member) =>{
        // console.log(member);
        cb(member);
    })
}

io.on('connection',(socket) => {
    console.log('client connected');
    // console.log(`User IP: ${socket.conn.remoteAddress}`);

    socket.on('setUserName',(data) => {
        var userName = data['userName'];
        createUser(userName,() => {
            console.log(`${userName} Connected!`)
            getUserScore(userName , (data) => {
                // console.log(data);
                socket.emit('scoreUpdate',{"score" : data});
                io.emit('server.reply',{"hint": userName + " Has Entered the server","isCorrect" : false});
            });
        });
    });

    socket.on('guess',(data) => {
        var userName = data['userName'];
        var guessedNumber = data['guessedNumber'];
        console.log(guessedNumber);
        if(guessedNumber < randomNum){
            socket.emit('server.reply',{"hint": "C'mon the answer is not that low...","isCorrect" : false});
        }else if(guessedNumber > randomNum){
            socket.emit('server.reply',{"hint": "C'mon it's not that high :P","isCorrect" : false});
        }else{
            socket.emit('server.reply',{"hint": "Correct! you've got 1 point from that :D","isCorrect" : true});
            io.emit('server.reply',{"hint": userName + " got the answer right! Re roll la~","isCorrect" : false});
            getUserScore(userName,(data) => {
                updateUserScore(userName,data + 1)
            })
            randomNum = getRandomInt(1,100);
        }
    })

    socket.on('gethighscore',() => {
        getTopFive((member) => {
            socket.emit('postHighScore',{"payload":member});
            console.log(member);
        });
    })
});

console.log('server started')