var fs = require('fs');
if (!fs.existsSync) {
  fs.existsSync = require('path').existsSync;
}
var handlebars = require("handlebars");
azure=null;
if (fs.existsSync('./../../lib/azure.js')) {
  azure = require('./../../lib/azure');
} else {
  azure = require('azure');
}

var request = require('request');

var portCounter = 9000;

//var fse = require('fs-extra');
var rd  = require('read-dir-files');
var _ = require('underscore');
var qs = require('qs');

var formidable = require('formidable');

Desktop.prototype.answer = function(req,res) {
	
	req.query = qs.parse(req.link.query);
	
	var path = req.link.pathname;
    
	switch( true ) {

	 case  /\/classifieds\/view\/.+/g.test(path)      : this.view(req,res); break;
     case  /\/classifieds/g.test(path) : this.list(req,res); break;
	 case  /\/post-ad/g.test(path) : this.post(req,res); break;
     case  /\/post-classified/g.test(path) : this.submit(req,res); break;
	 
     default : //console.log(req.link.path);
	 // request('http://localhost:' + portCounter + req.link.path,function(err,reqres,body){
	  // if(!err) res.end(body);
	 //  else { // console.log('came here  ',path); 
	//	 buffet_d.notFound(req,res); }	
	//  });
	  redirect("http://www.dingg.org" ,res );
	// reqs.on('error',function(e){
	//	console.log('came here'); 
		// buffet_d.notFound(req,res); 
	 
	// })
	// return;
	 // buffet_d.notFound(req,res); 
		
	}
	
	return;
	
	
};

var TableQuery = azure.TableQuery;
var TableService = azure.TableService;


wrtieService = '';
imageContainer = '';
readQuery = ''; 
list_count = 20;  
table_name = 'object';
nextLink = '/';
itemQuery = '';

var dateObj = new Date();

resultTemplate = '<div class ';
itemTemplate = '';


partials = rd.readSync('./public/partials/desktop/','utf-8');
_.each(partials,function(value,key){
	//console.log(value);
	//if ( key === 'DESKTOP_CLASSIFIED_LIST_VIEW') console.log(value);
	if(/.+{{.+}}.+/g.test(value)) { 
	partials[key] = handlebars.compile(value); 
    }
	
});

//j_static  = fse.readJsonSync('./static/static.json');

j_static = eval('(' +  fs.readFileSync('./static/static.json') + ')'); 


wrtieService = azure.createTableService(j_static.storage_write.key,j_static.storage_write.value);
tableService = azure.createTableService(j_static.testkey.key,j_static.testkey.value);
imageService = azure.createBlobService(j_static.storage_image.key,j_static.storage_image.value)

//console.log(partials.DESKTOP_CLASSIFIED_LIST_VIEW);
resultTemplate = partials.DESKTOP_CLASSIFIED_LIST_VIEW;
itemTemplate   = partials.DESKTOP_CLASSIFIED_ITEM_VIEW;
j_static.WRITE_KEY = Number(j_static.WRITE_KEY);
imageContainer = j_static.WRITE_IMAGE_CONTAINER;
table_name   = j_static.TABLE_NAME;

if(j_static.LIST_COUNT)
list_count = j_static.LIST_COUNT;

j_static['ALL_CITIES_BY_NAME'] = {};
	_.each(j_static.ALL_CITIES,function(key,value){
		j_static['ALL_CITIES_BY_NAME'][key.toLowerCase()] = value;
	});

handlebars.registerHelper('adImg', function() {

  if ( this['d:u4'] !== '0') 
	  var result = '<img src="' + j_static.IMG_CDN_URL + this['d:imgContainer'] + '/' + this['d:PartitionKey'] + '-' + this['d:RowKey'] + '-1.jpg" style="height:75px" width="80"/>';
	  else 
     var result = '<img src="'+ j_static.DEFAULT_LIST_IMG +'" style="height:75px" width="80"/> ';
  return result;

});



handlebars.registerHelper('itemImageThumbnails', function() {

var imgCounter = 0;
images = [];
var Container = this['d:imgContainer'];
var pK = this['d:PartitionKey'];
var rK = this['d:RowKey'];

if ( this['d:u4']._ ) {
	this['d:u4'] = this['d:u4']._;
}
//console.log(this['d:u4'])

if ( this['d:u4'] !== '0' ) {

for(i=0; i < this['d:u4'] ; i++)  {
	images.push(j_static.IMG_CDN_URL + Container + '/' + pK + '-' + rK + '-' + (i+1) + '.jpg');
}
return partials.itemImageThumbnails(images);
}
else 
return ' ';

});


handlebars.registerHelper('adLink', function(parent) {
  // console.log(this);
    var result = j_static.adViewRoute ; 
    
	if ( typeof this['d:a3'] != 'object' )
    if(this['d:a3']) {
	   result = result + (this['d:a3'].replace(/[^a-zA-Z0-9]+/g,'-')).replace(/^-+|-+$/g,'');
	}
    result = result +  '?key=' + this['d:PartitionKey'] + '&id=' + this['d:RowKey'];

  return result;

});




function Desktop(){
	this.test = true;
};


module.exports = Desktop;


Desktop.prototype.list   = function(req,res) {
	
	var PartitionKey=j_static.defaultPartitionKey;
	var city= 'C001';
	var key = '10000-101'
	var bar = {};
	
	console.log('came here',key);

	if( req.subdomains[0] && 
	j_static['ALL_CITIES_BY_NAME'][req.subdomains[0].toLowerCase()]
    ) req['city'] = j_static['ALL_CITIES_BY_NAME'][req.subdomains[0].toLowerCase()];
	else { redirect("/all-india-cities" + '?referrer=' + req.url  ,res ); return }; 
	

	city = req['city'];
      	console.log('after city',city);
	
	if ( req.query.key )
	key = req.query.key;

	var nP = req.query.nP;
	var nR = req.query.nR;
	
	if(!key) {
		key = j_static.defaultKey
	}
	else if (key && ! j_static.validKeys[key])
	{ 
		console.log('came here',key);
		notifyRedirect('/',j_static.MESSAGES.desktop_error,res);
		return;
	}


	PartitionKey = city + '-' + key;
	
	console.log('after pk',PartitionKey);
	
	if(!PartitionKey)
	PartitionKey = 'C001-10000-101';

	bar['CATEGORY']  =  j_static.CLASSIFIED_LIST_BY_KEY[key];
	bar['CITY']      = j_static.ALL_CITIES[city].initCap();
	bar['resultPrevLink'] = get(req,'referer');
	
	//console.log(req.headers);
	
  //      console.log('before resp');
	

	var hidden = '<input type="hidden" value="' + key + '" id="pageId"/>';
	
	res.writeHead(200, {"Context-Type": "text/html"});
	res.write(partials['DESKTOP_CLASSIFIED_RESULT_BEGIN']);
	res.write(partials['DESKTOP_SIDEBAR_1']);
	res.write(hidden);

	res.write(partials.DESKTOP_RESULT_BAR(bar));

	//var query = TableQuery.select('PartitionKey','RowKey','a3','a5','u4','d1','options','imgContainer').from('object').whereKeys(PartitionKey).top(20);


	readQuery = TableQuery.select(j_static.ATTR_LIST).from(table_name).whereKeys(PartitionKey).top(list_count);

//console.log(readQuery);
	if ( nP && nR ){
		readQuery = readQuery.whereNextKeys(nP,nR);
	}



	tableService.queryEntitiesNew(readQuery, function(error,b,c){
	//wrtieService.queryEntitiesNew(readQuery, function(error,b,c){
		if(!error && b) {
	//	console.log('===========b',b,error,c);	
		res.write(b);
		if ( c ) {
		bar['resultNextLink'] = (req.url.split('&'))[0] + c;
		nextLink = bar['resultNextLink'];
	    }
	    else{
		  bar['resultNextLink'] = '#';
		}
		res.write(partials.DESKTOP_RESULT_FOOTER(bar));
		res.write(partials['DESKTOP_CLASSIFIED_RESULT_END']);
		res.end();
	    }
	    else {
			//res.write(partials['DESKTOP_CLASSIFIED_NORESULTS']);
			res.write(partials['DESKTOP_CLASSIFIED_RESULT_END']);
			res.end();
		 }
		 return;
	});
	
	
}


Desktop.prototype.view   = function(req,res) {
	
	var PartitionKey= req.query.key;
	var RowKey   = req.query.id;
	
	
	res.writeHead(200, {"Context-Type": "text/html"});
	res.write(partials['DESKTOP_CLASSIFIED_RESULT_BEGIN']);
	res.write(partials['DESKTOP_SIDEBAR_1']);

	itemQuery = TableQuery.select().from(table_name).whereKeys(PartitionKey,RowKey).top(1);

	tableService.queryEntitiesItem(itemQuery, function(error,b){
	//wrtieService.queryEntitiesNew(itemQuery, function(error,b,c){
	 //   console.log('came here -------',b);
	    
		b = itemTemplate(b); 
		
		if(!error && b) {
		res.write(b);
	//	res.write(boot.justclk_compiled_templates.DESKTOP_RESULT_FOOTER(bar));
		res.write(partials['DESKTOP_CLASSIFIED_RESULT_END']);
		res.end();
	    }
	    else {
			//res.write(partials['DESKTOP_CLASSIFIED_NORESULTS']);
			res.write(partials['DESKTOP_CLASSIFIED_RESULT_END']);
			res.end();
			
	        }
			return;
	});

	
}


Desktop.prototype.post   = function(req,res) {
	
	var key = '10000-101';
	//console.log(boot.justclk_static.CLASSIFIED_LIST_BY_KEY);
	var category = j_static.CLASSIFIED_LIST_BY_KEY['10000-101'];
	if ( req.query.key && j_static.CLASSIFIED_LIST_BY_KEY[req.query.key]){
		category = j_static.CLASSIFIED_LIST_BY_KEY[req.query.key];
		if ( req.query.key ) key = req.query.key ;
	}

	var writeHeader = {"Context-Type": "text/html"};
	
	var hidden = '<input type="hidden" value="' + key + '" name="key"/>';

	res.writeHead(200, writeHeader);
	res.write(partials['DESKTOP_FORM_LAYOUT_BEGIN']);
	res.write(partials.DESKTOP_AD_FORM_BEGIN);
	res.write(partials['DESKTOP_POST_HEADER'].replace('SELECTED__CATEGORY',category));
	res.write(partials.DESKTOP_BASIC_AD_FORM);
	res.write(hidden);
	if(key && partials['DESKTOP_'+key] )
	res.write(partials['DESKTOP_'+key]);
	res.write(partials.DESKTOP_FORM_CONTACT);
	res.write(partials.DESKTOP_AD_FORM_SUBMIT);
	res.write(partials.DESKTOP_AD_FORM_END);
	res.write(partials['POST_AD_LIST']);
	res.write(partials['DESKTOP_FORM_LAYOUT_END']);
	res.end();		
	
	
}


Desktop.prototype.submit   = function(req,res) {
	
	
	var form = new formidable.IncomingForm();


	var RowKey = j_static.WRITE_KEY - dateObj.getTime();
	var uploadCounter = 0;

	//console.log(RowKey);

	function uploadBlob(uploaded,name,counter){
	
		var fileName = name+'-'+counter+'.jpg';
	
		var options = {
	        contentType: uploaded.type,
	        metadata: { fileName: fileName }
	      };
	
		imageService.createBlockBlobFromFile(imageContainer, fileName, uploaded.path, options, function (error) {
	       ////
	      });
	}

	form.parse(req, function (err, fields, files) {

	if( fields.city && fields.key ) {


	fields['PartitionKey'] = fields.city + '-' + fields.key;
	RowKey = RowKey + '-' + fields['PartitionKey'];
	fields['RowKey'] = RowKey;

	if ( files.image1.name ) {
		uploadCounter += 1;
		uploadBlob(files.image1,RowKey,uploadCounter);
	}
	if ( files.image2.name ) {
		uploadCounter += 1;
		uploadBlob(files.image2,RowKey,uploadCounter);
	}
	if ( files.image3.name ) {
		uploadCounter += 1;
		uploadBlob(files.image3,RowKey,uploadCounter);
	}
	if ( files.image4.name ) {
		uploadCounter += 1;
		uploadBlob(files.image4,RowKey,uploadCounter);
	}
	if ( files.image5.name ) {
		uploadCounter += 1;
		uploadBlob(files.image5,RowKey,uploadCounter);
	}

	fields['u4'] = uploadCounter;
	fields['d1'] = dateObj.toISOString();


	wrtieService.insertEntity(table_name,fields, null,function(error,a,b){
		if(!error){
		   notifyRedirect('/',j_static.MESSAGES.desktop_ad_success,res);
		   return;
			//respond with success
		}else{
			notifyRedirect('/',j_static.MESSAGES.desktop_ad_error,res);
			return;
		}
		
	});

	}
	else {
		notifyRedirect('/',j_static.MESSAGES.desktop_ad_reject,res);
		//update later with invalid form..
	}
	
	});
return;
	
}

