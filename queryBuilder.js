var queryBuilder = (function(){

	//main entry point of app.
	function constructor(props){
		if(!(this instanceof constructor)) {
           throw 'queryBuilder must be constructed with new.';
        }

        if(props){

        	if(props.configFile){
        		this.fetchJson(configFile);
        		return true;
        	}else{
        		this.assignProps(props);
        	}

        }
        this.assembler();
	}

	//method works in conjunction with the contructor to build app
	constructor.prototype.assembler = function(){
		this.fetchJson();
	}

	//default properties of this app
	constructor.prototype.properties = {}

	//assigns new properties to the "properties" object.
	constructor.prototype.assignProperties = function(){}

	//retrieves json configuration file
	constructor.prototype.fetchJson = function(){
		console.log('json called');
	}

	//exposes the constructor to the global environment
	return constructor;
})();