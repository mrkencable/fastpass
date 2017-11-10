var winston = require('winston');
var paypal = require('paypal-rest-sdk');


//configure
paypal.configure({
	'mode': 'sandbox',
	'client_id' : 'AaUwIfilkQOrO61KWVBCpMbsf3rcSD-TkulMXurdUCVqiy2tFDcZCgTXW6r5fq3r4Qz_EOgz326iEmoV',
	'client_secret': 'EH9-zWPwCZ4GiN9GFrl1EjlPGD5js0jbAu_FKim1pxX1RyJfrPhyaVRbb4T-he4totPnnt5sF7iTVjV_',
	'headers' : {
	'custom': 'header'
	}
});


var generateCCardJson = function(payer_id, cardType, cardNumber, cardExpMonth, cardExpYear, first_name, last_name){

	var json = {
      "payer_id": payer_id,
      "type": cardType.toLowerCase().trim(),
      "number": cardNumber,
      "expire_month": cardExpMonth,
      "expire_year": cardExpYear,
      "first_name": first_name,
      "last_name": last_name
    };
	
    console.log("generateCCardJson will return: '"+JSON.stringify(json)+"'");
	return json;
};



//STORE CREDIT CARD DATA IN A VAULT
var storeCreditCard = function(card_data){

return new Promise(function(fullfill, reject){
	console.log("Saving Credit Card");
	paypal.creditCard.create(card_data,function(error,credit_card){
		if(error){
			console.log("Paypal.CreditCard.create >> Error: "+ JSON.stringify(error.response));
			console.log(error);
			reject(error);
		}
			console.log("Paypal.CreditCard.create Ended Successfully");
			console.log(JSON.stringify(credit_card));
			fullfill(credit_card);
	});
})
};




//STORE CARD DATA IN VAULT
var savePayment = function(saved_card_json){
	paypal.payment.create(saved_card_json, function (error, payment) {
		if (error) {
			throw error;
		} else {
			console.log("Create Payment Response");
			console.log(payment);
		}
	});
};
	
	
	
// MAKE A DIRECT CARD PAYMENT	
var directPayment = function(create_payment_json){
	paypal.payment.create(create_payment_json, function (error, payment) {
		if (error) {
			throw error;
		} else {
			console.log("Create Payment Response");
			console.log(payment);
		}
	});
};

	

module.exports.generateCCardJson = generateCCardJson;
module.exports.createCard = storeCreditCard;
module.exports.create_payment_json = directPayment;

	


/********************************************************************
*  HELPER METHODS
*********************************************************************/	
	    //GET TYPE OF CREDIT CARD FROM CARD NUMBER
		function GetCardType(number)
		{
			// visa
			var re = new RegExp("^4");
			if (number.match(re) != null)
				return "visa";

			// Mastercard
			re = new RegExp("^5[1-5]");
			if (number.match(re) != null)
				return "mastercard";

			// AMEX
			re = new RegExp("^3[47]");
			if (number.match(re) != null)
				return "amex";

			// Discover
			re = new RegExp("^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]|64[4-9])|65)");
			if (number.match(re) != null)
				return "discover";

			// Diners
			re = new RegExp("^36");
			if (number.match(re) != null)
				return "diners";

			// Diners - Carte Blanche
			re = new RegExp("^30[0-5]");
			if (number.match(re) != null)
				return "diners - carte blanche";

			// JCB
			re = new RegExp("^35(2[89]|[3-8][0-9])");
			if (number.match(re) != null)
				return "jcb";

			// Visa Electron
			re = new RegExp("^(4026|417500|4508|4844|491(3|7))");
			if (number.match(re) != null)
				return "visa electron";

			return "";
		}
