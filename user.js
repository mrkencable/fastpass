var journey = require('journey');

exports.createRouter = function(){

	return new (journey.Router)(function (map){
	winston.info('journey router: ',{map : map});
				
				map.path(/\/users/, function(){
			//
			//LIST: GET /users lists all uses
			//

			this.get().bind(function (res){
				res.send(501,{},{action: 'list' });
			});
			
			
			//
			//CREATE: POST to /users creates a new user
			//
			this.post().bind(function (res, user){
				res.send(501,{},{action: 'create' });
			});
			
			
			//
			//UPDATE: PUT to /users updates and existing user
			//
			this.put(/\/([\w|\d|\-|\_]+)/).bind(function (res, user){
				res.send(501,{},{action: 'update' });
			});

				
			
			//
			//DELETE: PUT to /users/:id deletes and existing user
			//
			this.del(/\/([\w|\d|\-|\_]+)/).bind(function (res, id){
				res.send(501,{},{action: 'delete' });
			});
		});
		},{strict: false});
	
	};