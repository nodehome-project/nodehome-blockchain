module.exports = {
  "channel_id": "nhchannel", 
  "orderers": [
    {
      "orderer_url": "grpc://orderer1.4intel.net:7050", 
      "orderer_name": "orderer1.4intel.net", 
      "admin_id": "ordererAdmin"
    }
  ], 
  "chaincode_id": "ecchain", 
  "peers": [
    {
      "event_url": "grpc://peer0.org1.4intel.net:7053", 
      "peer_localmspid": "Org1MSP", 
      "enabled": true, 
      "peer_url": "grpc://peer0.org1.4intel.net:7051", 
      "admin_id": "peerorg1Admin", 
      "peer_name": "peer0.org1.4intel.net", 
      "peer_mspconfigpath": "/host/crypto-config/peerOrganizations/org1.4intel.net/users/Admin@org1.4intel.net/msp", 
      "peer_address": "peer0.org1.4intel.net:7051"
    }
  ], 
  "wallet_path": "../gateway-creds"
}