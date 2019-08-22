'use strict';
// nautil.js
/*
* Copyright 4intel Corp All Rights Reserved
*/
var fs = require('fs-extra');
var hfc = require('fabric-client');
var path = require('path');
var util = require('util');
var config = require('../config/config');

var exports = module.exports = {};

exports.escape = function escape (str) {
    if (typeof(str)!="string") return val;
    return str      
        .replace(/[\\]/g, '\\\\')
        .replace(/[\/]/g, '\\/')
        .replace(/[\b]/g, '\\b')
        .replace(/[\f]/g, '\\f')
        .replace(/[\n]/g, '\\n')
        .replace(/[\r]/g, '\\r')
        .replace(/[\t]/g, '\\t')
        .replace(/[\"]/g, '\\"')
        .replace(/\\'/g, "\\'"); 
}

exports.toUTF8Array = function toUTF8Array(str) {
    var utf8 = [];
    for (var i=0; i < str.length; i++) {
        var charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
            utf8.push(0xc0 | (charcode >> 6), 
                      0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
            utf8.push(0xe0 | (charcode >> 12), 
                      0x80 | ((charcode>>6) & 0x3f), 
                      0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
            i++;
            // UTF-16 encodes 0x10000-0x10FFFF by
            // subtracting 0x10000 and splitting the
            // 20 bits of 0x0-0xFFFFF into two halves
            charcode = 0x10000 + (((charcode & 0x3ff)<<10)
                      | (str.charCodeAt(i) & 0x3ff));
            utf8.push(0xf0 | (charcode >>18), 
                      0x80 | ((charcode>>12) & 0x3f), 
                      0x80 | ((charcode>>6) & 0x3f), 
                      0x80 | (charcode & 0x3f));
        }
    }
    return utf8;
}

exports.getOrgAdmin = function(client, orgNum) {
	var keyPath = path.join(__dirname, util.format('../backend-artifacts/crypto-config/peerOrganizations/org%s.%s/users/Admin@org%s.%s/msp/keystore', orgNum, config.domain, orgNum, config.domain));
	var keyPEM = Buffer.from(readAllFiles(keyPath)[0]).toString();
	var certPath = path.join(__dirname, util.format('../backend-artifacts/crypto-config/peerOrganizations/org%s.%s/users/Admin@org%s.%s/msp/signcerts', orgNum, config.domain, orgNum, config.domain));
	var certPEM = readAllFiles(certPath)[0];

	return Promise.resolve(client.createUser({
		username: 'org'+orgNum+'Admin',
		mspid: 'Org'+orgNum+'MSP',
		cryptoContent: {
			privateKeyPEM: keyPEM.toString(),
			signedCertPEM: certPEM.toString()
		}
	}));
}

function readAllFiles(dir) {
	var files = fs.readdirSync(dir);
	var certs = [];
	files.forEach((file_name) => {
		let file_path = path.join(dir,file_name);
		let data = fs.readFileSync(file_path);
		certs.push(data);
	});
	return certs;
}
