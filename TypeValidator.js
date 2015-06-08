(function (root, factory) { // UMD from https://github.com/umdjs/umd/blob/master/returnExports.js
    if(typeof define === 'function' && define.amd) {
        define('TypeValidator', [], factory);
    }else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        // Browser globals
        root.TypeValidator = factory();
    }
}(this, function () {

	/**
	 * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
	 * @param obj1
	 * @param obj2
	 * @returns obj3 a new object based on obj1 and obj2
	 */
	function merge_options(obj1,obj2){
	    var obj3 = {};
	    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
	    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
	    return obj3;
	}


	function TypeValidator(){
		var config = {
			'check_level': 2,			
			'stop_level' : 1,
			'return_level' : 1,
			'nonobject_types' : [
				'boolean',
				'number',			
				'string',
				'symbol',
				'function',
				//'array', 
			]
		}

		this.setConfig = function(new_config){
			for(var attrname in new_config){
				config[attrname] = new_config[attrname];
			}		
		}

		this.getConfig = function(){
			return config;
		}

		this.primitivesCheckHandler = function(args, type_key , type_val, err_msgs, $config){
			if(typeof args[type_key]!=type_val){
				err_msgs[type_key] = 'Invalid argument! '+
					'Arg '+(parseInt(type_key)+1)+this.getArgsFuncName(args)+
					' must be '+type_val+' but it is '+typeof arg;							
			}
		}

		this.objectsCheckHandler = function(args, type_key, type_val, err_msgs, $config){
			if($config['check_level']>1){
				if(!(args[type_key] instanceof type_val)){
					err_msgs[type_key] = 'Invalid argument! '+
						'Arg '+(parseInt(type_key)+1)+this.getArgsFuncName(args)+
						' must be instance of '+type_val.name+' but it is '+args[type_key].constructor.name;
				}
			}
		}

		this.mixedCheckHandler = function(args, type_key, type_val, err_msgs, $config){
			err_msgs[type_key] = 'Invalid argument! '+
				'Arg '+(parseInt(type_key)+1)+this.getArgsFuncName(args)+
				' must be '+
				( typeof type_val=='function' ? type_val.name : type_val )
				+' but it is '+
				( typeof args[type_key]=='object' ? args[type_key].constructor.name : typeof args[type_key] );
		}

		this.defaultPrimitivesCheckHandler = this.primitivesCheckHandler;
		this.defaultObjectsCheckHandler = this.objectsCheckHandler;
		this.defaultMixedCheckHandler = this.mixedCheckHandler;

		this.getArgsFuncName = function(args) {
			return typeof args.callee !== 'undefined' ? ' for '+args.callee.name : '';
		}
		
		this.check = function (args, types, options){
			types = Array.isArray(types) ? types : [types]; 
			args = typeof args.callee != 'undefined' ? args : [args]; 	
			var $config = merge_options(config, options);
			var isOK = true;
			var err_msgs = []; // or {}		

			if($config['check_level']>0){			
				for(var type_key in types){
					var type_val = types[type_key];				
					if(type_val && args.length>=type_key && typeof args[type_key] !== 'undefined' && args[type_key] !== null){
						arg_type = typeof args[type_key]; // toLower ?

						// both primitives
						if($config['nonobject_types'].indexOf(arg_type)!=-1 && $config['nonobject_types'].indexOf(type_val)!=-1){ // ignore case ?
							this.primitivesCheckHandler(args, type_key, type_val, err_msgs, $config);							

						// both objects
						//}else if($config['nonobject_types'].indexOf(arg_type)==-1 && $config['nonobject_types'].indexOf(type_val)==-1){ // ignore case ?
						}else if(arg_type=='object' && typeof type_val=='function'){ // ignore case ?
							this.objectsCheckHandler(args, type_key, type_val, err_msgs, $config);

						// mixed object and primitive
						}else{
							this.mixedCheckHandler(args, type_key, type_val, err_msgs, $config)
						}

						// react
						if(typeof err_msgs[type_key] !== 'undefined'){					
							if($config['stop_level']==1){																					
								console.warn(err_msgs[type_key]);
							}else if($config['stop_level']==2){
								throw new Error(err_msgs[type_key]);						
							}			
							
							isOK = false;								
						}
					}		
				}
			}
			return isOK ? true : 
				$config['return_level']==0 ? false : err_msgs;
		}

	}

	return TypeValidator;

}));
