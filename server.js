const express = require('express');
const app = express();
const session = require('express-session');
const mc = require("mongodb").MongoClient;
let db;
const objectId = require('mongodb').ObjectID;
//intialize the the database store
const Mongodstore = require('connect-mongodb-session')(session);
const store = new Mongodstore({uri: 'mongodb://localhost:27017/a4',collection: 'sessions'});
app.use(session({secret: 'you are awesome',store:store ,resave:false,saveUninitialized:false }));
app.use(express.urlencoded({extended: true})); 
//route to handle all the /user requests
let userroute = require('./user-router');
app.use('/users',userroute);
//route to handle all the /orders requests
let orderroute = require('./order-router');
app.use('/orders',orderroute);
//set template engine to pug
app.set('view engine','pug');

//send the orderform js file if requested
app.get('/orderform.js',(req,res,next)=>{
    res.status(200).sendFile(__dirname+'/restaurant_data/orderform.js');

});
//send the add.jpg file if requested by client
app.get('/add.jpg',(req,res,next)=>{
    res.status(200).sendFile(__dirname+'/restaurant_data/add.jpg');

});
//send the remove.jpg image file
app.get('/remove.jpg',(req,res,next)=>{
    res.status(200).sendFile(__dirname+'/restaurant_data/remove.jpg');

});
//connect to the database
mc.connect('mongodb://localhost:27017',(err,client)=>{
    if(err){
        console.log('cannot connect to the database');
        return
    }
    //start the server
    app.listen(3000);

    //connect to a4
    db = client.db('a4');
    app.locals.db = db;
    console.log('server started');
});
//route for homepage
app.get('/',homePage);
app.get('/orderform',auth,(req,res,next)=>{
    res.status(200).render('index',{user:req.session.username});
})
//if there is a post request at /login page
app.post('/login',(req,res,next)=>{
    db.collection('users').findOne({username: {$eq : req.body.username},password:{$eq : req.body.password}},(err,result)=>{
        if(err){
            console.log(err);
            return;
        }
        if(!result){
            console.log('incorrect credentials');
            res.status(401).render('homepageloggedin',{data:'incorrect correntials, please enter correct credentials'});
            return;
        }
        else{
            req.session.loggedin = true;
            req.session.username = req.body.username;
            res.redirect('/');

        }
    });
    
});
//if the user logs out change the session info and send the message
app.get('/logout',(req,res,next)=>{
    if(req.session.loggedin){
        req.session.loggedin = false;
		res.status(200).render('homepageloggedin',{data:"You are logged out"});
	}else{
		res.status(200).render('homepageloggedin',{data:"You have to log in first to logout"});
	}
});
//if the user wants to register, send them the registration page
app.get('/register',(req,res,next)=>{
    res.status(200).render('register');
});
//if the  user request their profile, send them their profile page
app.get('/profile',auth,(req,res,next)=>{
    let uid;
    db.collection('users').findOne({username:req.session.username},(err,result)=>{
        if(err){
            console.log(err);
        }
        if(!result){
            console.log("cannot finduser by that name");
        }
        else{
            uid = result._id;
            res.redirect('/users/'+uid);
        }
        next();
    });
});
//get the new profile settings from the user, if the user changes them
app.post('/changePrivacy',(req,res,next)=>{
   
    if(req.body.privacy === 'yes'){
        db.collection('users').updateOne({username:req.session.username},{"$set":{privacy:true}},(err,result)=>{
            if(err) throw err;
        });
        
    }
    else{
        db.collection('users').updateOne({username:req.session.username},{"$set":{privacy:false}},(err,result)=>{
            if(err) throw err;
        });
        

    }
});
//get the new user details after they have resgitered and check that the user name is unique
app.post('/register',(req,res,next)=>{
    db.collection('users').findOne({username: {$eq : req.body.regname}},(err,result)=>{
        if(err){
            console.log(err);
            return;
        }
        if(result){
            res.status(409).render('register',{data:"Username already exsists !"});
            return;
        }
        else{
            db.collection("users").insertOne({username:req.body.regname, password:req.body.regpassword,privacy:false},function(err){
                if(err){
                    console.log(err);
                    return;
                }
                req.session.loggedin = true;
                req.session.username = req.body.regname;
                res.redirect('/profile');
            });

        }

    });

});
//function to render the home page
function homePage(req,res,next){
    
    if(req.session.loggedin){
        res.status(200).render('homepageloggedout',{data:"welcome "+req.session.username});
        return;

    }
    else{
        res.status(200).render('homepageloggedin',{data:"welcome to my website!!"});
        return;
    }
}
function auth(req,res,next){
    if(!req.session.loggedin){
        res.status(401).send('unauthorized');
        return;
    }
    next();
}
