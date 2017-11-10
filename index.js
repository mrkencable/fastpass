var firebase = require("firebase");
var request = require("request");
var http = require('http');



const util = require('util')
var winston = require('winston');

var paypal = require('./paypal');
var express = require('express');
var bodyParser = require('body-parser');

var app = express();
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
app.set('port',process.env.PORT || 8181);
//app.use(express.cookieParser('your secret here'));
//app.use(express.session());


var router = express.Route;





REMOTE_ADD ="";



require('dns').lookup(require('os').hostname(), function (err, add, fam) {
	REMOTE_ADD = add;
  console.log('addr: '+add);
})


/*********************************************
Variables
*********************************************/

var username ="admin";
var password="THEpassw0rd";

var vend_username ="";
var vend_password="";





function get_AuthRoot(username, password){
	//var root_url =  "http://"+username+":"+password+"@localhost:8080/cyclos/pelican/web-rpc/";
	var root_url = "https://" + username + ":" + password + "@communities.cyclos.org/FastPass/";
	return 	root_url;
}

//GENERAL

//SERVICE URLS
var URL_GENERAL = get_AuthRoot(username,password) + "web-rpc/general";
var URL_LOGINSERVICE = get_AuthRoot(username,password)+"web-rpc/loginService";
var URL_LOGINUSER = URL_LOGINSERVICE +"web-rpc/loginUser";
var URL_NEWUSER = get_AuthRoot(username,password)+"api/users";

function URL_PAYMENT(uname){
	return get_AuthRoot(username,password)+"api/"+uname+"/payments"
}

function URL_USERACCOUNT(uname){
	return get_AuthRoot(username,password)+"api/"+uname+"/accounts"
}


function URL_NEWOPERATOR(username,password){
	return get_AuthRoot(username,password)+"api/users";
}



var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8181;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1"  




 
 
/********************************************************************
Perform topup
*********************************************************************/
 function topup(data,res){
	//var lres = res;
	// SET DATA
	//---------------------------------------------------------------------------------------------
	var type = "memberaccount.userpayment"; // function constant
	var scheduling = "direct";				//scheduling

	console.log("TOPUP DATA IS: "+ JSON.stringify(data));
	var fromUser = data["fromUser"];     	//"admin"; 			//where funds coming from
	var toUser = data["toUser"]; 			//"mrkencable@gmail";  // who funds going to
	var amount = data["amount"];			//200.00;		transaction amount
	var description = data["description"]; 	// "Topup on Activate"
	var currency = data["currency"];		//currency
	
	var d = {
			
		  subject: toUser,					//"mrkencable@gmail.com",
		  "amount": amount,
		  description: description,
		  currency: currency,
		  type: type,
		  scheduling: scheduling
	};


	
	// SET Make Call to pelican server
	//---------------------------------------------------------------------------------------------

		//SETUP ajax post to Pelican Server
		var req = request({
			url:URL_PAYMENT(fromUser), //url to payments api
			method:'POST',
			json:true,
			headers: {
				'channel':'webServices',
			},
			body:d,
		});
		
		
		
		var resp1 = {};
		req.on("response", function(resp){
			resp1 = resp;
			console.log("-------------------------------------------------------");
			console.log("RESPONSE  CALLED");
			console.log("-------------------------------------------------------");
		});	
		
		
		var body=[];
		var balBody = [];
		var jbalBody={};
		
		req.on('data', function(chunk){
			body.push(chunk);
		
		}).on('end',function(resp){
			body = Buffer.concat(body).toString();
			console.log("-------------------------------------------------------");
			console.log("BODY  END");
			console.log("-------------------------------------------------------");
			console.log(JSON.stringify(body));

			var msg = "";
			msg = body;
			body = JSON.parse(body);
			
			if(resp1.statusCode >= 200 && resp1.statusCode <= 299){
				console.log("SUCCESS: "+ resp1.statusCode);

				console.log("-------------------------------------------------------");
				console.log("BALANCE START");
				console.log("-------------------------------------------------------");

				
				//get Account Balance
				//SETUP ajax post to Pelican Server
				var balReq = request({
					url:URL_USERACCOUNT(toUser,'userpayment'), //url to payments api
					method:'GET',
					json:true,
					headers: {
						'channel':'webServices',
					},
					body:d,
				});
				
				balReq.on('data', function(chunk){
					balBody.push(chunk);
		
				}).on('end',function(resp){
					
					//get balance results as string
					balBody = Buffer.concat(balBody).toString();
					
					//convert  balance results to json
					jbalBody = JSON.parse(balBody);
					

					//GET THE AVAILABLE BALANCE		
					console.log("  ");
					console.log("  ");
					console.log("BALANCE BODY IS: "+ balBody); // JSON.stringify(balBody));
					var status = jbalBody[0].status;
					console.log("  ");
					console.log("BALANCE STATUS IS: "+JSON.stringify(status));
					
					//SET BALANCE TO VARIABLE BAL
					var bal = status.balance;
					
					console.log("  ");
					console.log("BALANCE IS: "+bal);
					console.log("BODY IS: "+body);

					
					
					//body = JSON.stringify(body); 	// replace body string for sending 
					
					body.balance = bal;
					msg = JSON.stringify(body);
					
					
					console.log("-------------------------------------------------------");
					console.log("BALANCE BODY  END");
					console.log(msg);
					console.log("-------------------------------------------------------");
					
				console.log("*************** FINAL BODY IS "+ msg);
				console.log("***************  BODY BALANCE  IS "+ body.balance);
				res.writeHead(200);
				res.write(msg);
				res.end();

					
					
				}).on('error',function(error){
					console.log("-------------------------------------------------------");
					console.log("BALANCE ERROR");
					console.log("-------------------------------------------------------");
					console.log(error);
				});
				
				
				
				
			}
			else{
				console.log("ERROR: "+ resp1.statusCode);
			}
	
		});
	}
/********************************************************************
End perform transaction
*********************************************************************/




 
/********************************************************************
Find User by username
*********************************************************************/
 function FindUser(data,res){
 
	
	//search URL 
	var searchURL = URL_NEWUSER + "?usersToInclude="+data;
	
	console.log("searching for username: '"+data+"' with: "+searchURL);
	
	
	//SETUP ajax Get to Pelican Server
	var req = request({
		url:searchURL, //url to user methods
		method:'GET',
		json:true,
		headers: {
			'channel':'webServices',
		}

	},function(error,response,body){

		var info = body.result;
		var code=response.statusCode;
		
		console.log("User Search Result >>> Status is: '"+code+"'");
		console.log("User Search  Result >>> Body is: '"+JSON.stringify(body)+"'");


		//if no errors detected and login successful return SessionToken
		if (!error && response.statusCode == 200) {

		//Login Credentials successful
		var info = body.result;
		console.log("");
		//console.log("SessionToken is: "+info.sessionToken);
		console.log("");
		code = "SUCCESS";

		//TODO: SET SESSION TOKEN HERE
		
		console.log("returning response : '" + JSON.stringify(response))+"'";
		
		//Write Results to screen
		if( response.constructor === Array ||  !response.length ) {
			res.statusCode = 200
		}
		res.write("<br /><H3> Body is: <H3/><br />"+JSON.stringify(body)+"<HR/>+ Status Code: "+res.statusCode);
		res.end();	

		return response;
		
		
		}
		else{
			console.log("error : " + error);
			console.log("code : " + code);
			console.log("JSON resonse body is: " + JSON.stringify(response));
			console.log("");
			console.log("");
			console.log("JSON resonse body is: " + JSON.stringify(response.body));
			console.log("");
			console.log("");
			console.log("");
			console.log("JSON request body was : " + JSON.stringify(response.request.body));
			console.log("");
			console.log("");
			console.log("");
			console.log("");
			console.log("JSON request was : " + JSON.stringify(response.request));
			code = "ERROR";
		}
	
		//Write Results to screen
		if( response.constructor === Array ||  !response.length ) {
			res.statusCode = 409
		}
		res.write("<br /><H3> Error Code is: '"+res.statusCode+"'  <H3/><br />"+JSON.stringify(body)+"<HR/>+ Status Code: "+res.statusCode);
		res.end();	
	});
	
	req.on("error", function(){
		console.log("-------------------------------------------------------");
		console.log("ERROR CALLED");
		console.log("-------------------------------------------------------");
	});	

 }


 
/********************************************************************
Register New User
*********************************************************************/
 function RegisterUser(data){
	 
var body = {
	  "name": data["name"],
	  "username": data["username"],
	  "email": data["email"],
	  "group": "users",
	  
	  "passwords": [
		{
		  "type": "login",
		  "value": data["password"],
		  "checkConfirmation": false,
		  "confirmationValue": "",
		  "forceChange": false
		}
	  ],
	  "customValues": {},
	  "hiddenFields": [
		"email"
	  ],
	  
	  /*
	  "addresses": [
		{
		  "name": data["name"],
		  "addressLine1": "",
		  "addressLine2": "",
		  "street": "",
		  "buildingNumber": "",
		  "complement": "",
		  "zip": "",
		  "poBox": "",
		  "neighborhood": "",
		  "city": "",
		  "region": "",
		  "country": "",
		  "location": {
			"latitude": 0,
			"longitude": 0
		  },
		  "defaultAddress": true,
		  "hidden": true
		}
		
	  ],*/
	  "mobilePhones": [
		{
		  "name": "mobile phone",
		  "number": data["phone"],
		  "extension": "",
		  "enabledForSms": true,
		  "verified": true,
		  "kind": "mobile"
		}
	  ],
	  /*
	  "landLinePhones": [
		{
		  "name": "",
		  "number": "",
		  "extension": "string",
		  "enabledForSms": true,
		  "verified": true,
		  "kind": "mobile"
		}
	  ],
	  */
	  "images": [
		"string"
	  ],
	  /*
	  "captcha": {
		"challenge": "string",
		"response": "string"
	  },
	  */
	  "acceptAgreement": true,
	  "skipActivationEmail": true
	}
	
	
		//SETUP ajax post to Pelican Server
		var req = request({
			url:URL_NEWUSER, //url to new user creation api
			method:'POST',
			json:true,
			headers: {
				'channel':'webServices',
			},
			body:body,
		},registerUser_callback);
		
		req.on("error", function(){
			console.log("-------------------------------------------------------");
			console.log("ERROR CALLED");
			console.log("-------------------------------------------------------");
		});	
	
	
	return body;
	
	
 } 
  
 function registerUser_callback(error, response, body) {
		var info = body.result;
		var code="";
	
	
	//if no errors detected and login successful return SessionToken
	  if (!error && response.statusCode == 200) {
	  console.log("********** CALL TO PELICAN SERVER HAS NO ERRORS AND RETURN STATUS CODE 200");
		//Login Credentials successful
		var info = body.result;
		console.log("");
		console.log("SessionToken is: "+info.sessionToken);
		console.log("");
		code = "SUCCESS";
		
		//TODO: SET SESSION TOKEN HERE
	  }
	  else{
		console.log("error : " + error);
		console.log("JSON resonse body is: " + JSON.stringify(response));
		console.log("");
		console.log("");
		console.log("JSON resonse body is: " + JSON.stringify(response.body));
		console.log("");
		console.log("");
		console.log("");
		console.log("JSON request body was : " + JSON.stringify(response.request.body));
		console.log("");
		console.log("");
		console.log("");
		console.log("");
		console.log("JSON request was : " + JSON.stringify(response.request));
		code = "ERROR";
	  }
	}
/********************************************************************
END OF Register New User
*********************************************************************/


//POST CALLBACK
  
/********************************************************************
Asynchronous Webservice Call to Validate Pelican Account for Terminal
*********************************************************************/

function myTest(){}

// Takes credentials and return SessionToken or null
function LoginUser(uname, pass){
	//JSON Package for LoginUser Call
	var requestData = {
		user: {
			principal: uname,
		},
		password:pass, 
		remote_address:REMOTE_ADD
	};	
	

	//Actual Call 
	request({
		url:URL_LOGINUSER,
		method:'POST',
		json:requestData,
		headers: {
			'channel':'webServices',
		},
	},LoginUser_callback);	

}

function LoginUser_callback(error, response, body) {
		var info = body.result;
		var code="";
	
	
	//if no errors detected and login successful return SessionToken
	  if (!error && response.statusCode == 200) {
	  
		//Login Credentials successful
		var info = body.result;
		console.log("");
		console.log("SessionToken is: "+info.sessionToken);
		console.log("");
		code = "SUCCESS";
		
		//TODO: SET SESSION TOKEN HERE
	  }
	  else{
		console.log("error : " + error);
		console.log("JSON resonse body is: " + JSON.stringify(response));
		console.log("");
		console.log("");
		console.log("JSON resonse body is: " + JSON.stringify(response.body));
		console.log("");
		console.log("");
		console.log("");
		console.log("JSON request body was : " + JSON.stringify(response.request.body));
		console.log("");
		console.log("");
		console.log("");
		console.log("");
		console.log("JSON request was : " + JSON.stringify(response.request));
		code = "ERROR";
	  }
	  
		return {
			"code":code,
			"error":error,
			"result":info
		};
	  
  }

/********************************************************************
END OF Asynchronous Webservice Call to Validate Pelican Account for Terminal
*********************************************************************/



/**************************************************************************
CONNECT TO DATABASE SERVER
**************************************************************************/
firebase.initializeApp({
	 serviceAccount: "./fastpass.json", 
	 databaseURL : 'https://project-2789726364960147758.firebaseio.com'
 });
 var db = firebase.database();


 
/**************************************************************************
LISTEN TO DATABASE SERVER
**************************************************************************/

var val;
var mTerminalRef = db.ref("/terminals");
var mCompanyRef = db.ref("/companies");
var mUserRef = db.ref("/users");
var myTerminal  = null;

/*****************************************************************************
LISTEN FOR ADDITION OF A COMPANY
*****************************************************************************/
//Listens and is called once for each new Company Added
mCompanyRef.on("child_added",function(snapshot,prevChildKey){
	var newCompany = snapshot.val();
	var pathIsAuthorized = newCompany.key + "/isAuthorized" ;


	console.log("New Company Detected (stringify): '"+ JSON.stringify(newCompany)+"'");
	console.log("New Company Detected (key): '"+newCompany.key+"'");
	console.log("");
	console.log("Checking Company.isAuthorized: '"+newCompany.isAuthorized+"'");
	if(newCompany.isAuthorized == false){
			console.log("setting newCompany.isAuthorized: '"+newCompany.isAuthorized+"'");
			CompanyAuth(newCompany.username, newCompany.password,newCompany);
	}

});

function CompanyAuth(uname,  pass, myCompany){

	mCompany = myCompany;
	console.log("** Binding myCompany:" + myCompany);
	console.log("** uname:" + uname);
	console.log("** pass:" + pass);
	CompanyAuth_callback.bind({mCompany : myCompany});

	//JSON Package for LoginUser Call
	var requestData = {
		user: {
			principal: uname,
		},
		password:pass, 
		remote_address:REMOTE_ADD
	};	
	

	//Actual Call 
	request({
		url:URL_LOGINUSER,
		method:'POST',
		json:requestData,
		headers: {
			'channel':'webServices',
		},
	},CompanyAuth_callback);	

}


function CompanyAuth_callback(error, response, body) {
		console.log("-------------------------------------------------------------------");
		console.log("this.myCompany is: '"+mCompany+"'");
		console.log("this.myCompany is: '"+JSON.stringify(mCompany)+"'");
		console.log("body is: '"+body+"'");
		console.log("error is: '"+error+"'");
		console.log("error is: '"+JSON.stringify(error)+"'");

		var info = body.result;
		var code="";
	
	
	//if no errors detected and login successful return SessionToken
	  if (!error && response.statusCode == 200) {
	  
		//Login Credentials successful
		var info = body.result;
		console.log("Login Successful");
		
		console.log("Setting IsAuthorized on Company with key: "+ mCompany.key);
		mCompanyRef.child(mCompany.key).update({"isAuthorized":true});
		mCompany.isAuthorized = true;
		console.log("new value for newCompany.isAuthorized: '"+mCompany.isAuthorized+"'");
				
		//SETTING THIS VARIABLE SHOULD TRIGGER ANY TERMINALS LISTENING ON THE CLIENT SIDE
	  }
	  else{
		console.log("error : " + error);
		console.log("JSON resonse body is: " + JSON.stringify(response));
		console.log("");
		console.log("");
		console.log("JSON resonse body is: " + JSON.stringify(response.body));
		console.log("");
		console.log("");
		console.log("");
		console.log("JSON request body was : " + JSON.stringify(response.request.body));
		console.log("");
		console.log("");
		console.log("");
		console.log("");
		console.log("JSON request was : " + JSON.stringify(response.request));
		code = "ERROR";
	  }
	  
		return {
			"code":code,
			"error":error,
			"result":info
		};
	  
  }

/*****************************************************************************
END OF LISTENING FOR ADDITION OF A COMPANY
*****************************************************************************/



/*****************************************************************************
LISTEN FOR ADDITION OF A TERMINAL
*****************************************************************************/

//Listens and is called once for each new Terminal Added
mTerminalRef.on("child_added",function(snapshot,prevChildKey){
	var newTerminal = snapshot.val();
	var pathIsAuthorized = newTerminal.key + "/isAuthorized" ;


	console.log("New Terminal Detected (stringify): '"+ JSON.stringify(newTerminal)+"'");
	console.log("New Terminal Detected: '"+newTerminal._id+"'");
	console.log("Checking newTerminal.isAuthorized: '"+newTerminal.isAuthorized+"'");
	if(newTerminal.isAuthorized == false){
			console.log("setting newTerminal.isAuthorized: '"+newTerminal.isAuthorized+"'");
			CompanyAuth(newTerminal._principal, newTerminal._password,newTerminal);
	}

});



function TerminalAuth(uname,  pass, myTerminal){

	mTerm = myTerminal;
	console.log("** Binding mTerm:" + mTerm);
	console.log("** uname:" + uname);
	console.log("** pass:" + pass);
	TerminalAuth_callback.bind({mTerm : myTerminal});

	//JSON Package for LoginUser Call
	var requestData = {
		user: {
			principal: uname,
		},
		password:pass, 
		remote_address:REMOTE_ADD
	};	
	

	//Actual Call 
	request({
		url:URL_LOGINUSER,
		method:'POST',
		json:requestData,
		headers: {
			'channel':'webServices',
		},
	},TerminalAuth_callback);	

}

function TerminalAuth_callback(error, response, body) {
		console.log("*****************************************************");
		console.log("this.mTerm is: '"+JSON.stringify(mTerm)+"'");
		console.log("body is: '"+body+"'");
		console.log("error is: '"+error+"'");
		console.log("error is: '"+JSON.stringify(error)+"'");

		var info = body.result;
		var code="";
	
	
	//if no errors detected and login successful return SessionToken
	  if (!error && response.statusCode == 200) {
	  
		//Login Credentials successful
		var info = body.result;
		console.log("Login Successful");
		
		console.log("Setting IsAuthorized on Terminal with id: "+ mTerm._id);
		mTerminalRef.child(mTerm._id).update({"isAuthorized":true});
		mTerm.isAuthorized = true;
		console.log("new value for newTerminal.isAuthorized: '"+mTerm.isAuthorized+"'");
				
		//SETTING THIS VARIABLE SHOULD TRIGGER ANY TERMINALS LISTENING ON THE CLIENT SIDE
	  }
	  else{
		console.log("error : " + error);
		console.log("JSON resonse body is: " + JSON.stringify(response));
		console.log("");
		console.log("");
		console.log("JSON resonse body is: " + JSON.stringify(response.body));
		console.log("");
		console.log("");
		console.log("");
		console.log("JSON request body was : " + JSON.stringify(response.request.body));
		console.log("");
		console.log("");
		console.log("");
		console.log("");
		console.log("JSON request was : " + JSON.stringify(response.request));
		code = "ERROR";
	  }
	  
		return {
			"code":code,
			"error":error,
			"result":info
		};
	  
  }

 /*****************************************************************************
END OF LISTEN FOR ADDITION OF A TERMINAL
*****************************************************************************/






var rdata = null;

/*****************************************************************************
LISTEN FOR ACTIVATION OF MERCHANT
*****************************************************************************/
	function Test(requestData){
		var op = requestData.operator;
		
		var req = request({
			url: "https://admin:THEpassw0rd@communities.cyclos.org/FastPass/web-rpc/operatorService",
			method:'POST',
			json:true,
			body: op,
			headers: {
				'channel':'webServices',
			},
		},function(error, response, body){
			console.log(" >>>>>>>>>>>>>> requestData.operator: "+ JSON.stringify(op));
			console.log(" >>>>>>>>>>>>>> ");
			console.log(" >>>>>>>>>>>>>> Response: "+ JSON.stringify(response));
			console.log(" >>>>>>>>>>>>>> ");
			console.log(" >>>>>>>>>>>>>> error: "+ JSON.stringify(error));
			console.log(" >>>>>>>>>>>>>> ");
			console.log(" >>>>>>>>>>>>>> body: "+ JSON.stringify(body));
		});
		
		req.on("error", function(){
			console.log("-------------------------------------------------------");
			console.log("ERROR CALLED");
			console.log("-------------------------------------------------------");
		});
	
	}
	

	function CreateAccount(requestData){
		console.log("Creating Account Now ...with Data: '"+util.inspect(requestData,false,null)+"'");
		console.log("To URL: "+ URL_NEWUSER );
		console.log("Sending Data: "+requestData);
		rdata = requestData;
	
		//SETUP ajax post to Pelican Server
		var req = request({
			url:URL_NEWUSER, //url to new user creation api
			method:'POST',
			json:true,
			headers: {
				'channel':'webServices',
			},
			body:requestData,
		},newuser_callback);
		
		req.on("error", function(){
			console.log("-------------------------------------------------------");
			console.log("ERROR CALLED");
			console.log("-------------------------------------------------------");
		});
	}
	
	

	function newuser_callback(error, response, body){
		var requestData = rdata;
		console.log("Request Data"+JSON.stringify(requestData));
		console.log("rData"+JSON.stringify(rdata));
		
		console.log("PelicanServer body"+JSON.stringify(body));
		console.log("Creating Account Callback");
		console.log("PelicanServer status: "+response.statusCode);
		console.log("PelicanServer body"+JSON.stringify(body));
		console.log("PelicanServer error: "+error);
		console.log("PelicanServer result: "+body.result);
		
		//If validation error occured
		if(response.statusCode == "422" ){
			console.log("Terminating Request with validation errors");
			res.writeHead(response.statusCode, { 'Content-Type': 'application/json' });  
			res.end(JSON.stringify(body), "utf-8");
			return;
			
		}
		
		
		//get operators
		var jsonOperators = JSON.parse(rdata.operators);
		
		
		//for each operator in list install
			for(var i =0; i <jsonOperators.length; i++){
				var name = "";
				var username = "";
				var pin =  "";
				var email =  "";
				
				
		
			if(!jsonOperators.hasOwnProperty('name') || jsonOperators.hasOwnProperty('username') || jsonOperators.hasOwnProperty('pin') || jsonOperators.hasOwnProperty('email')){
				name = jsonOperators[i].name;
				username = jsonOperators[i].username;
				pin =  jsonOperators[i].pin;
				email =  jsonOperators[i].email;
				var link = URL_NEWOPERATOR(requestData.username,requestData.passwords[0].value);

				console.log("Creating operator from link: '"+link+"'; '"+requestData.username+"' with password: '"+requestData.password+"'");
				//SETUP ajax post to Pelican Server
				var req = request({
					url: link, //url to new user creation api
					method:'POST',
					json:true,
					headers: {
						'channel':'webServices',
					},
					body:requestData,
				},newoperator_callback);
				
				req.on("error", function(){
					console.log("-------------------------------------------------------");
					console.log("ERROR CALLED");
					console.log("-------------------------------------------------------");
				});

				
				
			}

			
			
		}		
		
        res.writeHead(response.statusCode, { 'Content-Type': 'application/json' });  
        res.end(JSON.stringify(body), "utf-8");
	}
			

	function newoperator_callback(error, response, body){
		var requestData = rdata.operators;
		console.log(">>>>>>>>> OPERATOR CREATION <<<<<<<<<<<<<<");
		console.log("Request Data"+JSON.stringify(requestData));
		//console.log("rData"+JSON.stringify(rdata));
		
		console.log("PelicanServer body"+JSON.stringify(body));
		console.log("Creating Account Callback");
		console.log("PelicanServer status: "+response.statusCode);
		console.log("PelicanServer body"+JSON.stringify(body));
		console.log("PelicanServer error: "+error);
		console.log("PelicanServer result: "+body.result);
		
		//If validation error occured
		if(response.statusCode == "422" ){
			console.log("Terminating Request with validation errors");
			//res.writeHead(response.statusCode, { 'Content-Type': 'application/json' });  
			//res.end(JSON.stringify(body), "utf-8");
			return;
			
		}
	}
			
			
		
		//res.body = body;
		//res.status(response.statusCode);
		//endWrite();
			


/*****************************************************************************
END LISTEN FOR ACTIVATION OF SMART CARD
*****************************************************************************/






/*********************************************
END Variables
********************************************
*/


//var req = require('request');
//var res = require('response');


	
	//payer_id should come from a previous screen
	//var payer_id = "testUser001";
	

	function generatePaymentJson(firstname, lastname, card_number, card_expire_month, card_expire_year, card_cvv2, billing_line1, billing_city, billing_state, billing_postal, billing_country, transaction_amount_total, transaction_amount_currency, transaction_amount_details_subtotal,  transaction_amount_details_tax, transaction_amount_details_shipping, transaction_description){
		console.log("Setting Card for: '"+firstname+"'");
		
				var create_payment_json = {
			"intent": "sale",
			"payer": {
				"payment_method": "credit_card",
				"funding_instruments": [{
					"credit_card": {
						"type": "visa",
						"number": card_number,
						"expire_month": card_expire_month,
						"expire_year": card_expire_year,
						"cvv2": card_cvv2,
						"first_name": firstname,
						"last_name": lastname,
						"billing_address": {
							"line1": billing_line1,
							"city": billing_city,
							"state": billing_state,
							"postal_code": billing_postal,
							"country_code": billing_country
						}
					}
				}]
			},
			"transactions": [{
				"amount": {
					"total": "7",
					"currency": "USD",
					"details": {
						"subtotal": "5",
						"tax": "1",
						"shipping": "1"
					}
				},
				"description": "This is the payment transaction description."
			}]
		};
		return create_payment_json;
	}

	var res;
	var req;
	
	app.all('*',function(req,res,next){
		winston.info('*************Setting Headers: ',{"":""});
	
		// Set CORS headers
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Request-Method', '*');
		res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
		res.setHeader('Access-Control-Allow-Headers', req.hostname);
		//res.writeHead(200);
		winston.info('************* Headers Set ',{"":""});

		//res.write("<H1>Hello World!</H1>");
		//res.write("<hr style=\"width:100%;\" />");
		//res.write("<br /><H3> ~ Hello From All Routes <H3/><br />");
		next();	
	});	


	app.get('/',function(req,res,next){
		res.write("<br /><H3> ~ Hello From Get Route <H3/><br />");
		res.end();		
		next();
	});
	
	
	//SEARCH USERS
	app.get('/users',function(req,res,next){

	console.log("User Search>>> Started")
	var str = req.url;
	
	console.log("User Search>> extracting criteria from: '"+str+"'");
	var n = str.lastIndexOf('?');

	var data = str.substring(n + 1);
	console.log("User Search>> extracted data is: '"+data+"'");
	
	
	var body =  FindUser(data,res);  //RegisterUser(data);
	//console.log("User Search >> Results > body is:"+JSON.stringify(body));
		
	});
	
	
	//Register a basic fastpast pass holder
	app.post('/users/registeruser', function(req,res,next){
		var body =  RegisterUser(req.body);
		console.log("body is:"+JSON.stringify(body));
		res.write("<br /><H3> Body is: <H3/><br />"+JSON.stringify(body)+"<HR/>");
		res.end();	
	});
	
	
	//Perform a fastpass transaction
	app.post('/transaction/topup', function(req,res,next){
		console.log("*** Transaction body is:"+JSON.stringify(req.body));
		topup(req.body,res);
	});
	
	
	
	app.post('/Test',function(req,res,next){
		console.log(">>>> Test Called ");
		Test(req.body);
		console.log(">>>> Test Ended ");
	});
	
	app.post('/CreateAccount', function(req1,res1,next1){
		req_body = req1.body;

		console.log("in CreateAccount Post Call");
		console.log("req_body is: '" + req_body.name+" '");
		console.log("2. JSON IS: '"+ JSON.stringify(req_body)+"'");
			
		res = res1;
		req = req1;
		vals = CreateAccount(req_body);
	});

	
	function endWrite(){
	
	
		console.log("ending response with statusCode: "+ res.statusCode);
		console.log("ending response with body: " + res.body);
		res.end();		
	}
	
	app.get('/users',function(req,res,next){
		res.write("<br /><H3> Getting Users <H3/><br />");
		res.end();		
		next();
	});
	
	
	
	app.post('/paypal/direct_payment',function(req,res,next){
		
		app.use(bodyParser.json);
		console.log("paypal/direct_payment called with value: '"+ JSON.stringify(req.body)+"'");
		req_body = req.body;
		
		
		var payer_id = req_body.card.payer_id;
		var card_type = req_body.card.type;
		var  card_number = req_body.card.number;
		var  card_expire_month = req_body.card.expire_month;
		var  card_expire_year = req_body.card.expire_year;
		var card_first_name = req_body.card.first_name;
		var  card_last_name= req_body.card.last_name;
		
		var  card_cvv2 = req_body.card.card_cvv2;
		var  card_line1 = req_body.card.line1;
		var  card_city = req_body.card.city;
		var  card_state = req_body.card.state;
		
		var transaction_amount = req_body.transaction.amount
		var transaction_currency = req_body.transaction.currency
		var transaction_subtotal = req_body.transaction.subtotal
		var transaction_tax = req_body.transaction.tax
		var transaction_description = req_body.transaction.transaction_description
		

		// STORE CARD TO VAULT
		var Card = paypal.generateCCardJson(payer_id,card_type,card_number, card_expire_month, card_expire_year,card_first_name,card_last_name);
		paypal.createCard(Card).then(function(Token){
			return new Promise(function(fullfill,reject){
			 console.log("**** ATTEMPTING TO SAVE TOKEN IN DATABASE");
			 console.log("**** TOKEN IS: "+JSON.stringify(Token));
		
			try{
				mUserRef.child( Token.payer_id+"/tokens/" + Token.id).set(Token);
			}catch(ex){
				 console.log("**** ERROR SAVING USER TOKEN");
				reject(ex);
			}
			console.log("**** USER TOKEN SAVED SUCCESSFULLY !");
			fullfill();
			});
		});
		
		
		
		
		//CHARGE CARD WITH AMOUNT
		
		
		res.write("<br /><H3> Getting Paypal <H3/><br />");
		res.end();		
		next();
	});
	
	
	app.get('/paypal/',function(req,res,next){

		res.write("<br /><H3> Getting Paypal <H3/><br />");
		res.write("<br /><H3> Recieved Value:  <H3/>'<b>"+req.body+"</b>'<br />");
		res.end();		
		next();
	});
	
		
	app.listen(server_port,server_ip_address, function() {
	

        console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), server_ip_address, server_port);
});