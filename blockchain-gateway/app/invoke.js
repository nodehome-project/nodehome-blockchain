'use strict';
/*
* Copyright goldblock Corp All Rights Reserved
*/

var hfc = require('fabric-client');
var path = require('path');
var util = require('util');
var sprintf = require("sprintf-js").sprintf
var config = require('../config/config');
var nautil = require('./nautil');

module.exports = function(chaincode_name, func_name, peer_num, func_args, fnCallback) {
	var peer_idx=0
	if (peer_num != undefined && peer_num != null && peer_num.length > 0){
		peer_idx = parseInt(peer_num);
	}
	else if (process.env.pm_id != undefined && process.env.pm_id != null){
		peer_idx = parseInt(process.env.pm_id % config.peers.length)
	}
	if (config.peers[peer_idx].enabled != undefined && !config.peers[peer_idx].enabled){
		for (peer_idx = 0; peer_idx < config.peers.length; peer_idx++){
			if (config.peers[peer_idx].enabled){
				break;
			}
		}
	}
	invokeChaincodePeers(chaincode_name, func_name, func_args, peer_idx, fnCallback);
}

var invokeChaincodePeers = function(chaincode_name, func_name, func_args, peer_num, fnCallback){
	invoke_chaincode(chaincode_name, func_name, func_args, peer_num, function(invoke_res){
		var json_res = JSON.parse(invoke_res);
		json_res.npid = sprintf("%02d",peer_num);
		invoke_res = JSON.stringify(json_res)
		fnCallback(invoke_res);
	});
}

function invoke_chaincode(chaincode_name, func_name, func_args, peer_num, fnCallback) {

	var invoke_result = "";
	var client = new hfc();

	// setup the fabric network
	var channel = client.newChannel(config.channel_id);
	var peer = client.newPeer(config.peers[peer_num].peer_url);
	channel.addPeer(peer);
	var order = client.newOrderer(config.orderers[0].orderer_url)
	channel.addOrderer(order);

	//
	var store_path = path.join(__dirname, config.wallet_path);
	console.log('Store path:'+store_path);
	var tx_id = null;

	// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
	hfc.newDefaultKeyValueStore({ path: store_path
	}).then((state_store) => {
		// assign the store to the fabric client
		client.setStateStore(state_store);
		var crypto_suite = hfc.newCryptoSuite();
		// use the same location for the state store (where the users' certificate are kept)
		// and the crypto store (where the users' keys are kept)
		var crypto_store = hfc.newCryptoKeyStore({path: store_path});
		crypto_suite.setCryptoKeyStore(crypto_store);
		client.setCryptoSuite(crypto_suite);

		// get the enrolled user from persistence, this user will sign all requests
		return client.getUserContext(config.peers[peer_num].admin_id, true);
	}).then((user_from_store) => {
		if (user_from_store && user_from_store.isEnrolled()) {
			console.log('Successfully loaded user1 from persistence');
		} else {
			throw new Error('Failed to get user1.... run registerUser.js');
		}
		return channel.queryInfo(0);
	}).then((blockchainInfo) => {
		var strBlockNum = sprintf("%d",blockchainInfo['height']['low']-1);
		var strPeerNum = sprintf("%d",peer_num);
		var byteBlockNum = nautil.toUTF8Array(strBlockNum);
		var bytePeerNum = nautil.toUTF8Array(strPeerNum);

		// get a transaction id object based on the current user assigned to fabric client
		tx_id = client.newTransactionID();
		console.log("Assigning transaction_id: ", tx_id._transaction_id);

		// createCar chaincode function - requires 5 args, ex: args: ['CAR12', 'Honda', 'Accord', 'Black', 'Tom'],
		// changeCarOwner chaincode function - requires 2 args , ex: args: ['CAR10', 'Dave'],
		// must send the proposal to endorsing peers
		func_args.unshift(func_name)
	    var request = {
	        //targets: targets,
	        chaincodeId: chaincode_name,
	        fcn: "invoke",
	        args: func_args,
	        chainId: config.channel_id,
	        txId: tx_id,
			transientMap: { 'block_num': byteBlockNum, 'peer_num': bytePeerNum }
	    };

		// send the transaction proposal to the peers
		return channel.sendTransactionProposal(request,300000);
	}).then((results) => {
		var proposalResponses = results[0];
		var proposal = results[1];
		let isProposalGood = false;
		if (proposalResponses && proposalResponses[0].response &&
			proposalResponses[0].response.status === 200) {
				isProposalGood = true;
				console.log('Transaction proposal was good');
			} else {
				console.error('Transaction proposal was bad');
			}
		if (isProposalGood) {
			invoke_result = proposalResponses[0].response.payload;
			console.log(util.format(
				'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
				proposalResponses[0].response.status, nautil.escape(proposalResponses[0].response.message)));

			//var json_res = JSON.parse(invoke_result);
			//if(json_res.ec != 0){
			//	fnCallback(invoke_result);
			//	return;
			//}
			// build up the request for the orderer to have the transaction committed
			var request = {
				proposalResponses: proposalResponses,
				proposal: proposal
			};

			// set the transaction listener and set a timeout of 30 sec
			// if the transaction did not get committed within the timeout period,
			// report a TIMEOUT status
			var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
			var promises = [];

			var sendPromise = channel.sendTransaction(request);
			promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

			// get an eventhub once the fabric client has a user assigned. The user
			// is required bacause the event registration must be signed
			let event_hub = channel.newChannelEventHub(peer);

			// using resolve the promise so that result status may be processed
			// under the then clause rather than having the catch clause process
			// the status
			let txPromise = new Promise((resolve, reject) => {
				let handle = setTimeout(() => {
					event_hub.unregisterTxEvent(transaction_id_string);
					event_hub.disconnect();
					resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
				}, 3000);
				event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
					// this is the callback for transaction event status
					// first some clean up of event listener
					clearTimeout(handle);

					// now let the application know what happened
					var return_status = {event_status : code, tx_id : transaction_id_string};
					if (code !== 'VALID') {
						console.error('The transaction was invalid, code = ' + code);
						resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
					} else {
						console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
						resolve(return_status);
					}
				}, (err) => {
					//this is the callback if something goes wrong with the event registration or processing
					reject(new Error('There was a problem with the eventhub ::'+err));
				},
					{disconnect: true} //disconnect when complete
				);
				event_hub.connect();
			});
			promises.push(txPromise);

			return Promise.all(promises);
		} else {
			console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
			fnCallback('{"ec":-2,"ref":"Failed to send Proposal or receive valid response. Response null or status is not 200."}');
		}
	}).then((results) => {
		console.log('Send transaction promise and event listener promise have completed');
		// check the results in the order the promises were added to the promise all list
		if (results && results[0]) {
			if (results[0].status === 'SUCCESS') {
				console.log('Successfully sent transaction to the orderer.');
			} else {
				console.error('Failed to order the transaction. Error code: ' + results[0].status);
			}
			if (results[1]) {
				if(results[1].event_status === 'VALID') {
					console.log('Successfully committed the change to the ledger by the peer');
			        fnCallback(invoke_result);
				} else {
					console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
					fnCallback(util.format('{"ec":-2,"ref":"Transaction failed to be committed to the ledger due to :: %s" }', nautil.escape(results[1].event_status)));
				}
				return;
			}
		}
		else {
			console.error('Failed to order the transaction. results: ' + results);
			fnCallback('{"ec":-2,"ref":"Invalid results" }');
			return;
		}
	}).catch((err) => {
		console.error('Failed to invoke successfully :: ' + err);
		fnCallback(util.format('{"ec":-2,"ref":"%s" }', nautil.escape(err.toString())));
		return;
	});
}
