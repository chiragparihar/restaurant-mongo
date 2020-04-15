//get the necessary libraries and modules
let express = require('express');
let router = express.Router();
const ObjectID = require('mongodb').ObjectID;
//router for a get request for users

router.get('',getusers);

//function to handle the get request for users

function getusers(req,res,next){
    let db = req.app.locals.db.collection('users');
    //if there is no query for name, send all the users with privacy = false
    if(!req.query.name){
        db.find().toArray((err,result)=>{
            if(err){
                console.log(err);
            }
            if(!result){
                console.log("colection users do not exsist or cannot connect to db");
            }
            let datatosend = {loggedin:req.session.loggedin,users:result}
            res.status(200).render('users',{data:datatosend});
            next();
        });
    }
    else{/home/chirag/Downloads/rohit/2406/server.js
        
    
        //if there is a query, then look for the names matching with the query and then send them
        db.find({username:{$regex:req.query.name,$options:"$i"}}).toArray((err,result)=>{
            if(err){
                console.log(err);
            }
            if(!result){
                result={};
                console.log("collection users do not exsist or cannot connect to db");
            }
            
            let datatosend = {loggedin:req.session.loggedin,users:result}
            res.status(200).render('users',{data:datatosend});
            next();
        });
    }


}
//router to get user details using user id
router.get('/:userid',getUser);
function getUser(req,res,next){
    let db = req.app.locals.db.collection('users');
    let db2 = req.app.locals.db.collection('orders');
    let id = req.params.userid;
    let userId;
    //get the id from the database from the query
    try{
		userId = new ObjectID(id);
	}catch{
		res.status(404).send("That ID does not exist.");
		return;
    }
    //find the user asscoicated with the passed id
    db.findOne({_id : userId},(err,result)=>{
        if(err){
            console.log(err);
        }
        if(!result){
            console.log("canot find at id in db");
            res.status(404).send("no such id in database");
        }
        else{
            //send the user information after checking their login and privacy settings
            if(result.username === req.session.username || result.privacy === false){
                let show =false;
                if(result.username === req.session.username && req.session.loggedin === true){
                    show = true;
                }
                db2.find({username:result.username}).toArray((err,result2)=>{
                    if(err){
                        console.log(err);
                    }
                   
                    let datatosend={prof:show,user:result.username,restaurant:result2,loggedin:req.session.loggedin,privacy:result.privacy};
                    res.status(200).render('profile',{data:datatosend});
                });
                
                

            }
            //send 404 if the user is not authorized
            else{
                res.status(401).send("you are not authorized to see this profile");
                next();
            }
        }
    });
}

module.exports = router;
