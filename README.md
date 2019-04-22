Prerequisites
--------------------------------------------
* Ubuntu version 16.04 64bit or greater
* Docker version 17.06.2-ce or greater
* Docker-compose version 1.14.0 or greater

Running local blockchain network
--------------------------------------------

<pre>
cd nodehome-blochain
./nodehome-blockchain.sh start
</pre>

Stopping local blockchain network
--------------------------------------------

<pre>
cd nodehome-blochain
./nodehome-blockchain.sh stop
</pre>

Query to blockchain network
--------------------------------------------

'''
> curl --header "Content-Type: application/json" --request POST --data '{"chaincode":"ecchain","query_type":"query","func_args":["PID","10000"],"func_name":"version"}' http://127.0.0.1:8050/chaincode_query
> {"ec":0,"pid":"PID","value":{"ver":"0.3.8"},"ref":"OK"}
'''

Base wallets
--------------------------------------------

* Coin Wallet
  * Private key : ZypE7BH4rhZjWYKdhQVAs8A7eF6RcMAyE58J6UbSbvxCPF9Ew5yo
  * Mnemonic key : manual draft immune tooth captain change tape snap tourist super wheat kid
  * Public key : ZqowmmTX8XPP1RqeHBQGxJ6oTXC1T5q3TntPB6Tjw91dU9FBLcKF
* Manager 300 Keys
  * Private key : Zs2Dg54Y8TGt9QBPCDLTERmXYfKW2HePktB3rxb4bRNWid8sXFXA
  * Mnemonic key : season shift bag ethics deal employ clip fall frown anxiety praise model 
  * Public key : ZqpimDv3RAk1Gm51g8AZkqaxBJqR4HnRvBwQtjWCR2ZC3TZKmo1Q
* Fee Wallet
  * Private key : ZrykPgYtkDEWQpBZAD7bcFC8Tez4XF7SduhgxcUxABypKC5HYmMr
  * Mnemonic key : thing armor wing thing trick famous index whip barrel region broken first 
  * Public key : ZqrK48fj4LcQiwDR3rkRaHdL1W6xgBk6knZzExumNU5E3zbhxQpp
