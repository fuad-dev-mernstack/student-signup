const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const User = require('./config/db');
const mongoose= require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret';


const app = express();

fs.readFile(path.join(__dirname, 'ssl', 'key.pem'),(err,key) => {
    if(err){
        console.error('Error reading key file', err);
        return;
    }

    fs.readFile(path.join(__dirname, 'ssl', 'cert.pem'), (err,cert) => {
        if(err){
            console.error('Error reading cert file : ', err);
            return;
        }

        const sslServer = https.createServer({key,cert}, app);

        sslServer.listen(port, () => {
            console.log(`Secure server is running on PORT : ${port}`);
        });
    })
})

///Database Connection///

mongoose.connect("mongodb://127.0.0.1:27017/User")
.then(console.log("MongoDB Connected"))
.catch((err) => console.error("MongoDB crashed"))

const port = 3443;

/// Middleware ///

app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({extended : false}));

///Routes///



app.post("/signup", async(req,res) => {
    const {userName,email,password} = req.body;
    console.log(req.body);
    try{
        const newUser = new User({userName,email,password});
        await newUser.save();
        //Generates JWT upon successful signup

        const token = jwt.sign({userId: newUser._id, email: newUser.email},JWT_SECRET,{expiresIn: '1h'});
        console.log(`User created successfully :
            SignUp token: ${token}`);
        res.redirect('/newsfeed');
        //.json({messege: 'User created Successfully', token})
    }catch(error){
        res.json({messege : 'Failed to create user', details : error });
    };

});

app.post('/signin', async (req,res) => {
    const{email,password} = req.body;
    console.log(`email: ${email}
        password: ${password}`);
    try {
        const existingUser = await User.findOne({email});
        if(!existingUser){
            return res.json({messege:'Invalid email'});
        }

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
        if(!isPasswordCorrect){
            return res.json({messege: 'Invalid Password'});
        }

        const token = jwt.sign({userId: existingUser._id, email: existingUser.email, userName: existingUser.userName},JWT_SECRET,{expiresIn:'1h'});
        console.log(`User Successfully Log In
            logIn Token: ${token}`);
            return res.redirect('/newsfeed');

    } catch (error) {
        console.error(`Error Details: ${error}`);
    };
});



app.get('/newsfeed',(req,res) => {
    res.sendFile('You succesfully Logged in');
});
