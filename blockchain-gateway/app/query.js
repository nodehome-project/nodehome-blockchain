'use strict';
/*
* Copyright ABC CO. All Rights Reserved
*/

var cmd=require('node-cmd');
var hfc = require('fabric-client');
var path = require('path');
var util = require('util');
var fs = require('fs');

var sprintf = require("sprintf-js").sprintf
var config = require('../config/config');
var nautil = require('./nautil');

module.exports = function(chaincode_name, func_name, peer_num, func_args, fnCallback) {
	var peer_idx=0
	if (peer_num != undefined && peer_num != null && peer_num.length > 0){
		peer_idx = parseInt(peer_num);
	}
	else if (process.env.pm_id != undefined && process.env.pm_id != null) {
		peer_idx = parseInt(process.env.pm_id % config.peers.length)
	}
	if (config.peers[peer_idx].enabled != undefined && !config.peers[peer_idx].enabled){
		for (peer_idx = 0; peer_idx < config.peers.length; peer_idx++){
			if (config.peers[peer_idx].enabled){
				break;
			}
		}
	}
	queryChaincodePeers(chaincode_name, func_name, func_args, peer_idx, fnCallback);
}

var queryChaincodePeers = function(chaincode_name, func_name, func_args, peer_num, fnCallback){
	query_chaincode(chaincode_name, func_name, func_args, peer_num, function(query_res){
		var json_res = JSON.parse(query_res);
		json_res.npid = sprintf("%02d",peer_num);
		query_res = JSON.stringify(json_res);
		fnCallback(query_res);
	});
}

function query_chaincode(chaincode_name, func_name, func_args, peer_num, fnCallback) {

	var crypto_suite=null;
	var peer = null;
	var client = new hfc();

	// setup the fabric network
	var channel = client.newChannel(config.channel_id);
	if(config.tls == true){
		const data = fs.readFileSync(path.join(__dirname, config.peers[peer_num].tls_cacerts));
		peer = client.newPeer(config.peers[peer_num].peer_url,{'pem': Buffer.from(data).toString()});
	} else {
		peer = client.newPeer(config.peers[peer_num].peer_url);
	}
	channel.addPeer(peer);

	//
	var store_path = path.join(__dirname, config.wallet_path);
	console.log('Store path:'+store_path);
	var tx_id = null;
	func_args.unshift(func_name);

	// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
	hfc.newDefaultKeyValueStore({ path: store_path
	}).then((state_store) => {
		// assign the store to the fabric client
		client.setStateStore(state_store);
		crypto_suite = hfc.newCryptoSuite();
		// use the same location for the state store (where the users' certificate are kept)
		// and the crypto store (where the users' keys are kept)
		var crypto_store = hfc.newCryptoKeyStore({path: store_path});
		crypto_suite.setCryptoKeyStore(crypto_store);
		client.setCryptoSuite(crypto_suite);

		// get the enrolled user from persistence, this user will sign all requests
		return client.getUserContext(config.peers[peer_num].admin_id, true);
	}).then((user_from_store) => {
		if (user_from_store == null) {
			var arr = config.peers[peer_num].peer_name.split('.')
			return nautil.getOrgAdmin(client, arr[1].substring(3))
			.then((peer_admin)=>{
				return channel.queryInfo(0);
			});
		} else if (user_from_store && user_from_store.isEnrolled()) {
			console.log('Successfully loaded user1 from persistence');
			return channel.queryInfo(0);
		} else {
			throw new Error('Failed to get user1.... run registerUser.js');
		}
	}).then((blockchainInfo) => {
		var strBlockNum = sprintf("%d",blockchainInfo['height']['low']-1);
		var strPeerNum = sprintf("%d",peer_num);
		var byteBlockNum = nautil.toUTF8Array(strBlockNum);
		var bytePeerNum = nautil.toUTF8Array(strPeerNum);
	    const request = {
	        chaincodeId: chaincode_name,
	        fcn: "query",
			args: func_args,
			transientMap: { 'block_num': byteBlockNum, 'peer_num': bytePeerNum }
		};
		// send the query proposal to the peer
		return channel.queryByChaincode(request);
	}).then((query_responses) => {
		console.log("Query has completed, checking results");
		// query_responses could have more than one  results if there multiple peers were used as targets
		if (query_responses && query_responses.length == 1) {
			var query_result = query_responses[0].toString();
			if (query_responses[0] instanceof Error) {
				console.error("error from query = ", query_responses[0]);
				fnCallback(util.format('{"ec":-2,"ref":"%s"}', nautil.escape(query_responses[0].toString())));
			} else {
				console.log("Response is ", query_result);
				fnCallback(query_result);
			}
		} else {
			console.log("No payloads were returned from query");
			fnCallback('{"ec":-2,"ref":"No payloads were returned from query."}');
		}
	}).catch((err) => {
		console.error('Failed to query successfully :: ' + err);
		fnCallback(util.format('{"ec":-2,"ref":"%s"}', nautil.escape(err.toString())));
	});
}
