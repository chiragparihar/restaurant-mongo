//get all the required libraries
let express = require('express');
let router = express.Router();
const ObjectID = require('mongodb').ObjectID;

//post router for /orders
router.post('/',express.json(),writetodb);
//get router to get the order data from uid
router.get('/:uid',getfromdb);

//function to add new user to database
function writetodb(req,res,next){
    //get the order collection
    let db = req.app.locals.db.collection('orders');
    //insert the new order into the database with a username
    db.insertOne({username:req.session.username,order:req.body},(error,result)=>{
        if(error){
            console.log(error);
            return;
        }
        if(!result){
            console.log("cannot add to database");
            res.status(500).send("cannot add that order");
        }
        else{
            res.status(200).send("ok");
        }

    });

    

}
//function to get the user order details if asked using a uid
function getfromdb(req,res,next){
    let db = req.app.locals.db.collection('orders');
    let dbnames = req.app.locals.db.collection('users');
    let id = req.params.uid;
    let orderid;
    //try to get the _id from the id string
    try{
		orderid = new ObjectID(id);
	}catch{
		res.status(404).send("That ID does not exist.");
		return;
    }
    //find the order associated with the _id
    db.findOne({"_id": orderid}, function(err, result){
		if(err){
			console.log(err);
			return;
		}
		if(!result){
			res.status(404).send("That ID does not exist in the database.");
			return;
        }
       //see if the user is logged in or privacy setting is false and respond accordingly
        dbnames.findOne({username:result.username},(err,results)=>{
            if(err){
                console.log(err);
            }
            if((req.session.username === result.username && req.session.loggedin === true)|| results.privacy === false){
                result.loggedin = req.session.loggedin;
            
                res.status(200).render('ordersummary',{data:result});
                next();
            }
            else{
                res.status(404).send("unauthorized");
                next();
            }
        });
      
	});

}


module.exports = router;