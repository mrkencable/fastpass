var async = require('async');
var request = require("request");
var http = require('http');
const util = require('util')
//var winston = require('winston');
var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var path = require('path');

var app = express();
var dbPath = "https://couchdb.cloudno.de/fastpass"; //"http://127.0.0.1:5984/fastpass";
var follow = require('follow');
var fastPassdb = require('nano')(dbPath);



follow({ db: dbPath, include_docs: true }, function (error, change) {
    if (!error) {
        var doc = change.doc;
        console.log("Change Detected: " + change.id + ": " + JSON.stringify(doc));

        //if the transaction is not posted 
        if (!doc.posted) {
            var results = Transfer(doc)     // post transaction to backoffice and get transaction response information.
                .then((results) => {
                    console.log(">>>>>>>> RESULTS FROM TRANSFER: " + JSON.stringify(results));
                    switch (results.response.statusCode.toString().trim()) {
                        case "201": //on success

                            console.log(">>>>>>>> Updating DB DOCS WITH TRANSACTION INFO: ");
                            doc2 = doc;

                            console.log(">>>>>>>> BACKOFFICE RESULTS ARE: '"+ JSON.stringify(results)+"'");
                            doc2["posted"] = results.body.date.toString(); //updated the datetime posted to backoffice
                            doc2["transactionNumber"] = results.body.transactionNumber.toString(); //tie in the back office transaction number

                            console.log(">>>>>>>> REPLACING WITH NEW DOC: " + JSON.stringify(doc2));

                            //update the database
                            fastPassdb.insert(doc2, function (err, body) {
                                if (!err) {
                                    console.log("fastpass Mobile Record updated with Post data");
                                }
                                else {
                                    console.log("error: " + JSON.stringify(err));
                                }
                            });
                            console.log(">>>>>>>> Updating DB DOCS WITH TRANSACTION INFO COMPLTED:  ");
                            break;

                        case "": //insufficient funds
                            //update the db account status to insufficent funds
                            //update the database
                            break;


                        default: //error in processing
                            //update the db account status to insufficent funds
                            //update the database
                            break;
                    }
                }).catch((err) => {
                    console.log("************ error transferring data:" + JSON.stringify(err));
                }); 
        }
    }
    else {
        console.log("Serious errror: " + JSON.stringify(error));
    }
})


app.use(cors());
app.use(bodyParser.json());       // to support JSON-encoded bodies

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));


app.set('port', process.env.PORT || 8181);
//app.use(express.cookieParser('your secret here'));
//app.use(express.session());

var router = express.Route;

REMOTE_ADD = "";



require('dns').lookup(require('os').hostname(), function (err, add, fam) {
    REMOTE_ADD = add;
    console.log('addr: ' + add);
})


/*********************************************
Variables
*********************************************/

var username = "admin";
var password = "THEpassw0rd";
var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1"




function get_AuthRoot(username, password) {
    //var root_url =  "http://"+username+":"+password+"@localhost:8080/cyclos/pelican/web-rpc/";
    var root_url = "https://" + username + ":" + password + "@communities.cyclos.org/FastPass/";
    return root_url;
}


function URL_PAYMENT(uname) {
    return get_AuthRoot(username, password) + "api/" + uname + "/payments"
}



async function Transfer(data) {
    return new Promise(function (resolve, reject) { 

        console.log("Transaction Data is: '" + JSON.stringify(data) + "'");
        console.log(" ");
        console.log(" ");

        // response variables
        var body = [];
        var balBody = [];
        var jbalBody = {};
        var resp1 = {};


        //request variables
        var fromUser = "'" + data.subject;
        var toUser = "'" + data.to._id; //"mrkencable@gmail.com";
        var type = data.type; //"memberaccount.userpayment"; // function constant
        var scheduling = data.scheduling; // "direct";
        var amount = data.amount;
        var description = data.description; // "something";
        var currency = data.currency; //"XCD"


        //data spoofing    
        var d = {
            "amount": amount,
            "description": description,
            "currency": currency,
            "type": type,
            "subject": toUser,
            "scheduling": scheduling
        };

        console.log("Sending POST Data to URL: '" + URL_PAYMENT(fromUser) + "'");
        console.log(" ");
        console.log(" ");

        console.log("Sending Data to  Backoffice: '" + JSON.stringify(d) + "'");
        console.log(" ");
        console.log(" ");

        var req = request({
            url: URL_PAYMENT(fromUser), //url to payments api
            method: 'POST',
            json: true,
            headers: {
                'channel': 'webServices',
            },
            body: d,
        });


        //server has responded
        req.on("response", function (resp) {
            resp1 = resp;
            console.log("-------------------------------------------------------");
            console.log(" <<START>> Transfer()=>resp: '" + JSON.stringify(resp));
            console.log("-------------------------------------------------------");
        });

        //get data from the response
        req.on('data', function (chunk) {
            body.push(chunk);

            //end of data
        }).on('end', function (resp) {
            body = Buffer.concat(body).toString();
            console.log("-------------------------------------------------------");
            console.log(" <<END>> Transfer()=>resp:");
            console.log("-------------------------------------------------------");
            console.log(JSON.stringify(body));

            var msg = "";
            msg = body;
            body = JSON.parse(body);

            if (resp1.statusCode >= 200 && resp1.statusCode <= 299) {
                console.log("SUCCESS Transfer()=>resp: " + resp1.statusCode);
                resolve({ "response": resp1, "body": body });
            }
            else {
                reject({ "response": resp1, "body": body });
            }
        });
    });

}; // end of transfer function



app.get("/", function (req, res) {
    console.log(">>>>> Welcome to the root of the matter");
    res.setHeader('Content-Type', 'application/json');
    res.body = "{'test' : 'me'}";
     res.send({ 'test': 'testy' });
});


//if post made to Testy
app.get("/testy", function (req, res) {
    console.log(">>>>> Testy logged");
    res.body = "{'test' : 'me'}";
    res.end();
});


//Post made to transfer
app.post("/transfer", function (req, res) {
    //console.log(">>>>> Got request " + JSON.parse(req.body.data));
    //console.log(">>>>> Body: "+ JSON.stringify(req.body));
    var data = JSON.parse(req.body.data);
    Transfer(data, res);
});


//listen for traffic
app.listen(server_port, server_ip_address, function () {
    console.log('%s: Node server started on %s:%d ...',
        Date(Date.now()), server_ip_address, server_port);


 
    //Transfer({}, this.res);
});


