 
 
 function Terminal(jsonTerminal) {

    this._ID = jsonTerminal._ID;
    this._principal = jsonTerminal._principal;
    this._password = jsonTerminal._password;
    this._terminalID = jsonTerminal._terminalID;
	
    this._accounts = jsonTerminal._accounts;
    this._isAuthorized = jsonTerminal._isAuthorized;
}	

    //getter
    Terminal.prototype.ID = function() {return this._ID;}
    Terminal.prototype.principal = function(){return this._principal;}
    Terminal.prototype.password = function(){return this._password;}
    Terminal.prototype.terminalID = function(){return  this._terminalID;}
    Terminal.prototype.accounts = function(){return  this._accounts;}
    Terminal.prototype.isAuthorized = function(){return this._isAuthorized;}

    //setter
    Terminal.prototype.set_ID = function(value){this._ID =value ;}
    Terminal.prototype.set_principal = function(value){this._principal = value;}
    Terminal.prototype.set_password = function(value){this._password = value;}
    Terminal.prototype.set_terminalID = function(value){this._terminalID = value;}
    Terminal.prototype.set_isAuthorized = function(value){this._isAuthorized = value;}

	module.exports = Terminal;
