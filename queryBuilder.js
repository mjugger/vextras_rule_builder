var queryBuilder = (function(){

	//main entry point of app.
	function constructor(props){
		if(!(this instanceof constructor)) {
           throw 'queryBuilder must be constructed with new.';
        }
	}

	//method works in conjunction with the contructor to build app
	constructor.prototype.assembler = function(){}

	//default proporties of this app
	constructor.prototype.proporties = {}

	//retrieves json configuration file
	constructor.prototype.fetchJson = function(){}

	//exposes the constructor to the global environment
	return constructor;
})();