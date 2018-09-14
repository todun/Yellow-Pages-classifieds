function Mobile(){

};
var request = require('request');

var portCounter = 9002;

module.exports = Mobile;

Mobile.prototype.answer = function(req,res) {
	
  request('http://localhost:' + portCounter + req.link.path,function(err,reqres,body){
   if(!err) res.end(body);
   else { // console.log('came here  ',path); 
	 buffet_d.notFound(req,res); }	
  });
  
// reqs.on('error',function(e){
//	console.log('came here'); 
	// buffet_d.notFound(req,res); 
 
// })

};
