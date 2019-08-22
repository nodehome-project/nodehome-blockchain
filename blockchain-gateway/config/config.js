module.exports = {
	"channel_id": "nhchannel",
	"domain": "example.com",
	"orderers": [
		{
			"orderer_url": "grpc://orderer1.example.com:7050",
			"orderer_name": "orderer1.example.com",
			"admin_id": "ordererAdmin",
			"tls_cacerts": "../backend-artifacts/crypto-config/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/ca.crt"
		}
	],
	"peers": [
		{
			"peer_name": "peer0.org1.example.com",
			"event_url": "grpc://peer0.org1.example.com:7053",
			"peer_url": "grpc://peer0.org1.example.com:7051",
			"admin_id": "org1Admin",
			"enabled": true,
			"tls_cacerts": "../backend-artifacts/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
		}
	],
	"tls": false,
	"wallet_path": "../gateway-creds"
}
