handlebars = require("handlebars");
var _ = require("underscore");
// change to configuration later.


DOMAIN_NAME   = process.argv[2];

APP_KEY       = process.argv[3];

APP_VALUE     = process.argv[4];


if (!DOMAIN_NAME) {
		DOMAIN_NAME = 'localhost.com';
}

var fs = require('fs');
if (!fs.existsSync) {
  fs.existsSync = require('path').existsSync;
}


var fst = require('fs-tools');

//temp
//justclk_pages['index_section_links'] = fs.readFileSync("./views/index_section_link.tpl", "utf8");
//justclk_pages['index_phone'] = fs.readFileSync("./views/index.tpl", "utf8");
//justclk_pages['index_tablet'] = fs.readFileSync("./views/index.tpl", "utf8");

String.prototype.initCap = function () {
    return this.toLowerCase().replace(/(?:^|\s)[a-z]/g, function (m) {
        return m.toUpperCase();
    });
};

azure=null;

if (fs.existsSync('./../../lib/azure.js')) {
  azure = require('./../../lib/azure');
} else {
  azure = require('azure');
}

var TableQuery = azure.TableQuery;



parts = ['DESKTOP_CLASSIFIED_ITEM_VIEW','FILES','LAYOUTS','PAGES','SECTIONS','STATIC','TEMPLATES'];


//var config = azure.createTableService(APP_KEY,APP_VALUE);


//config.createTableIfNotExists("METADATA", function (res, created) { console.log('created') });


handlebars.registerHelper('trimSpace', function(value) {
	//console.log(value);
  return value.replace(/\s/g,'');
});


handlebars.registerHelper('domain_name', function(value) {
	//console.log(value);
	console.log(DOMAIN_NAME);
  return DOMAIN_NAME;
});

handlebars.registerHelper('initCap', function(value) {
	//console.log(value);
  return value.initCap();
});


module.exports = Boot;

justclk_updated = {};
justclk_static  = {};

function Boot(db,table) {

    this.config = azure.createTableService(db.key,db.value);

	this.justclk_sections = {};
	this.justclk_pages    = {};
	this.justclk_layouts  = {};
	this.justclk_routes   = {};
	this.justclk_tempaltes = {};

	this.justclk_updated_secitions = {};
	this.justclk_updated_pages     = {};
	this.justclk_updated_layouts   = {};
	this.justclk_compiled_templates = {};
	
};

//'justclkMetadata'

Boot.prototype = {
	
	getConfiguration : function (PartitionKey, callback) {
	    var query = TableQuery.select().from('justclkMetadata').whereKeys(PartitionKey);
	    this.config.queryEntities(query, callback);
	  },
	  
	  
	createFile : function(buffer,path,name) {
		
		fst.mkdirSync(path);
		fs.writeFileSync(path+name,buffer);
		
	}  ,
	appendFile : function(buffer,path,name) {
		
		fst.mkdirSync(path);
		fs.appendFileSync(path+name,buffer);
		
	}  ,
	
	UpdateComponents : function(callback) {
		var context = this;
	
		
		function fetchMetaData(PartitionKey) {
		
		//	console.log(parts.length);
		   if(parts.length < 0 ) {
			callback();
			return;
	    	} 
		  // console.log(PartitionKey);
		  
		   context.getConfiguration(PartitionKey, function (resp, records) {
			    
			 // console.log(records);
              for ( rec in records) {
	              switch(PartitionKey) {
		           case 'TEMPLATES' :
				   justclk_updated[records[rec].param] 	   = records[rec].value;
		           context.justclk_tempaltes[records[rec].param] = records[rec].value;
				   context.createFile(records[rec].value,'./public/tpl/', records[rec].param+'.tpl' ); 
		           break;
	               case 'STATIC' : // console.log(records[rec].param,records[rec].value);
				  
	               justclk_static[records[rec].RowKey] = eval('(' +  records[rec].value  + ')'); 
	                 
	               break;
	               case 'SECTIONS' :
	                
	               if ( context.justclk_tempaltes[records[rec].value]) { 
				      context.justclk_sections[records[rec].RowKey] = handlebars.compile(context.justclk_tempaltes[records[rec].value]); 
					  context.justclk_updated_secitions[records[rec].RowKey] =  context.justclk_sections[records[rec].RowKey](justclk_static[records[rec].param]);
					  justclk_updated[records[rec].RowKey]  = context.justclk_updated_secitions[records[rec].RowKey];
					  //console.log(context.justclk_tempaltes[records[rec].value,records[rec].param)
			         // console.log(records[rec].param,context.justclk_static[records[rec].param]);
			          }
			     else {
					context.justclk_sections[records[rec].param] = handlebars.compile(records[rec].value); 
					context.justclk_updated_secitions[records[rec].param] =  context.justclk_sections[records[rec].param](justclk_static);
					justclk_updated[records[rec].param]  = context.justclk_updated_secitions[records[rec].param];
		        	}
		          /// console.log(records[rec].param,records[rec].value,context.justclk_static[records[rec].param]);
				  
	               break;
	               case 'PAGES' : //console.log(records[rec].param,records[rec].value);
	                context.justclk_pages[records[rec].param] = handlebars.compile(records[rec].value);
	                context.justclk_updated_pages[records[rec].param] =  context.justclk_pages[records[rec].param](context.justclk_updated_secitions);
					justclk_updated[records[rec].param]  = context.justclk_updated_pages[records[rec].param];
	               break;
	               case 'LAYOUTS' : //console.log(records[rec].param,records[rec].value);
	                 context.justclk_layouts[records[rec].param] = handlebars.compile(records[rec].value); 
                  	var target = _.extend(context.justclk_updated_secitions,context.justclk_updated_pages);
                  //  console.log(target);
				     context.justclk_updated_layouts[records[rec].param]  = context.justclk_layouts[records[rec].param](target);	
					 justclk_updated[records[rec].param]  = context.justclk_updated_layouts[records[rec].param];
				     //context.justclk_updated_layouts[records[rec].param]  = context.justclk_updated_layouts[records[rec].param]();
				    // console.log(justclk_layouts.DESKTOP_LAYOUT);
	                break;
	               case 'FILES' : 
				  // console.log(context.justclk_updated);
				 //  console.log(records[rec].RowKey,records[rec].value);
				  
				   context.justclk_routes[records[rec].RowKey] = eval('(' +  records[rec].value  + ')'); 
				    if (!_.isArray(context.justclk_routes[records[rec].RowKey]) ) {
				   context.justclk_routes[records[rec].RowKey].template = handlebars.compile(context.justclk_routes[records[rec].RowKey].template)(justclk_updated);
				   context.createFile(context.justclk_routes[records[rec].RowKey].template,context.justclk_routes[records[rec].RowKey].path,context.justclk_routes[records[rec].RowKey].name);
			       } else {
					   _.each(context.justclk_routes[records[rec].RowKey],function(value){
						   value.template = handlebars.compile(value.template)(justclk_updated);
					//	   console.log(value.template);
						  context.createFile(value.template,value.path,value.name);
					   });
			       }
 				  context.createFile(JSON.stringify(justclk_static),'./static/', 'static.json' );
				
				    break;
				   default: break;
	               } // end of switch
               

               } // end of for
             console.log('here..',parts.length);
             if(parts.length > 0)
             fetchMetaData(parts.pop()); else { 
	          	callback();
	          console.log('here');
	          return; }

             //else context.callback;
		 
		    // return;
	     	});
		
			
		}
		
		fetchMetaData(parts.pop());
	
	}
}; 



var db = {key:'justclk10009',value : 'zWeELMkmchfvBQAYJv8hpRWPokSj/nn2HHM5pPV/6mt2gh8wCl8Oeql6/y4TG9RXqSxLYvOkMADNFUei5Wo0yA=='};
var table = 'justclkMetadata';
boot = new Boot(db,table);

boot.UpdateComponents(function(){
	console.log('Application installation finished');
})






