// app/routes.js

var invoke_cp = require('./invoke.js');
var query_cp = require('./query.js');
var util = require('util');

module.exports = function(app) {
	// =====================================
	// Coinpool Query ==================
	// =====================================
	app.post('/chaincode_query', function(req, res) {
		var req_time = Date.now();
		var chaincode_name='ecchain'
		console.log("req.body:", req.body);
		if (req.body.chaincode != undefined && req.body.chaincode != null && req.body.chaincode != ""){
			chaincode_name=req.body.chaincode
		}
		if (req.body.query_type == "query"){
			try {
				query_cp(chaincode_name, req.body.func_name, req.body.npid, req.body.func_args, function(query_res){
					var json_res = JSON.parse(query_res);
					json_res.na_startTime = req_time;
					json_res.na_endTime = Date.now();
					json_res.na_elapsedTime = Date.now() - req_time;
					query_res = JSON.stringify(json_res)
					console.log("response : ", query_res)
					res.end(query_res);
				});
			}
			catch(err) {
				res.end(util.format('{"ec":-2,"ref":"%s"}', err));
			}
		}
		else{
			try {
				invoke_cp(chaincode_name, req.body.func_name, req.body.npid, req.body.func_args, function(query_res){
					var json_res = JSON.parse(query_res);
					json_res.na_startTime = req_time;
					json_res.na_endTime = Date.now();
					json_res.na_elapsedTime = Date.now() - req_time;
					query_res = JSON.stringify(json_res)
					console.log("response : ", query_res)
					res.end(query_res);
				});
			}
			catch(err) {
				res.end(util.format('{"ec":-2,"ref":"%s"}', err));
			}
		}
	});
};
