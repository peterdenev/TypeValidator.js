(function (root, factory) { // UMD from https://github.com/umdjs/umd/blob/master/returnExports.js
    if(typeof define === 'function' && define.amd) {
        define('TypeValidator', [], factory);
    }else if (typeof exports === 'object') {
        module.exports = factory();
    } else { // Browser globals
        root.TypeValidator = factory();
    }
}(this, function () {
    
    function merge_options(obj1,obj2){
        var obj3 = {};
        for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
        for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
        return obj3;
    }

    function TypeValidator(config){
        var _config = {
            'check_level': 2,
            'stop_level' : 1,
            'return_level' : 1,
        }       

        this.setConfig = function(new_config){
            for(var attrname in new_config){ _config[attrname] = new_config[attrname]; }
        }

        this.setConfig(config);

        this.getConfig = function(){ return config; }

        this.primitivesCheckHandler = function(args, type_key , type_val, err_msgs, $config){
            if(typeof args[type_key]!=type_val){
                err_msgs[type_key] = this.genMsg(args, type_key,
                     false, type_val, false, typeof args[type_key]);
            }
        }

        this.objectsCheckHandler = function(args, type_key, type_val, err_msgs, $config){   
            //ZNOW check
            if(typeof args[type_key]==='function' && typeof args[type_key]['instanceOf'] === 'function'){
                if(!args[type_key].instanceOf(type_val) && type_val!=Object){
                    err_msgs[type_key] = this.genMsg(args, type_key,
                         true, type_val.constructorName, true, args[type_key].class.constructorName)
                }
            }else{ // normal check
                if(!(args[type_key] instanceof type_val)){
                    err_msgs[type_key] = this.genMsg(args, type_key,
                         true, type_val.name, true,
                         ( typeof args[type_key]=='object' ? args[type_key].constructor.name : type_val.name )
                    )
                }
            }
        }

        this.mixedCheckHandler = function(args, type_key, type_val, err_msgs, $config){
            err_msgs[type_key] = this.genMsg(args, type_key,
                 typeof type_val=='function',
                 ( typeof type_val=='function' ? type_val.name : type_val ),
                 typeof args[type_key]=='object',
                 ( typeof args[type_key]=='object' ? args[type_key].constructor.name : typeof args[type_key] )
            );
        }

        this.genMsg = function(args, arg_i, must_be_instance, must_be_name, given_instance, given_name){
            return 'TypeValidator: Arg '+(parseInt(arg_i)+1)+this.getArgsFuncName(args)+
                ' must be '+(must_be_instance ? 'an instance of ': '') + must_be_name+
                ', but '+(given_instance ? 'an instance of ': '') + given_name+' given!';
        }

        this.default_primitivesCheckHandler = this.primitivesCheckHandler;
        this.default_objectsCheckHandler = this.objectsCheckHandler;
        this.default_mixedCheckHandler = this.mixedCheckHandler;

        this.getArgsFuncName = function(args) {
            return typeof args.callee !== 'undefined' ? ' for '+args.callee.name : '';
        }
        
        this.check = function (args, types, options){
            types = Array.isArray(types) ? types : [types]; 
            args = typeof args.callee != 'undefined' ? args : [args];
            var $config = merge_options(_config, options);
            var isOK = true;
            var err_msgs = []; // or {}

            if($config['check_level']>0){
                for(var type_key in types){
                    var type_val = types[type_key]; 
                    if(type_val && args.length>=type_key && typeof args[type_key] !== 'undefined' && args[type_key] !== null){
                        arg_type = typeof args[type_key]; // toLower ?
                        
                        //expect primitive
                        if(arg_type!='object' && arg_type!='function' && typeof type_val == 'string'){ // ignore case ?
                            this.primitivesCheckHandler(args, type_key, type_val, err_msgs, $config);

                        //expect instenace
                        }else if((arg_type=='object' || arg_type=='function') && typeof type_val=='function'){ // ignore case ?
                            this.objectsCheckHandler(args, type_key, type_val, err_msgs, $config);

                        // mixed object and primitive
                        }else{ //object|function -> string; any(-object-function) -> function; any -> object
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

        this.getValue = function(arg, type, default_val, options){
            return this.check(arg, type ,options)===true ? arg : default_val;           
        }

        this.set = function(arg, type, context, target, options){
            if(this.check(arg, type ,options)===true){
                context[target] = arg;          
            }
        }

        this.func = function(types, func, context){
            var that = this;
            context = typeof context != 'undefined' ? context : this;
            return function(){
                that.check(arguments,types);
                return func.apply(context, arguments);
            }
        }
    }
    return TypeValidator;
}));