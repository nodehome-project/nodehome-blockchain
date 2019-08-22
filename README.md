필요 소프트웨어
--------------------------------------------
* Ubuntu version 16.04 64bit 또는 상위버전
* Docker version 17.06.2-ce 또는 상위버전
* Docker-compose version 1.14.0 

Nodehome-Chain 시작
--------------------------------------------

<pre>
cd nodehome-blochain
./nodehome-blockchain.sh start
</pre>

Nodehome-Chain 중지
--------------------------------------------

<pre>
cd nodehome-blochain
./nodehome-blockchain.sh stop
</pre>

Nodehome-Chain 테스트
--------------------------------------------

> curl --header "Content-Type: application/json" --request POST --data '{"chaincode":"ecchain","query_type":"query","func_args":["PID","10000"],"func_name":"version"}' http://127.0.0.1:8050/chaincode_query<br>
> {"ec":0,"pid":"PID","value":{"ver":"0.3.8"},"ref":"OK"}


폴더 구조
--------------------------------------------

<pre>
nodehome-blockchain                 Nodehome-Chain 폴더
├── README.md                    간략한 설명 파일
├── backend-runtime              Nodehome-Chain 데이터 폴더
│   ├── backend-artifacts       Nodehome-Chain Peer 인증서, Genesis Block 파일 등의 폴더
│   ├── blockchain-data         Nodehome-Chain 블록체인 데이터 폴더
│   └── script                  Nodehome-Chain 스크립트 폴더
├── blockchain-gateway           Nodehome-Chain NA 폴더
├── check-blockchain.sh          Nodehome-Chain 테스트 스크립트
├── docker-compose.yml           Docker-Compose 설정 파일
├── nodehome-blockchain.sh       Nodehome-Chain 시작/종료 스크립트
└── wallets                      시스템 지갑 폴더
    ├── prik                     시스템 지갑 개인키 폴더
    ├── pubk                     시스템 지갑 공용키 폴더
    └── seed                     시스템 지갑 Mnemonics 폴더
</pre>

시스템 지갑
--------------------------------------------
* 시스템 지갑은 nodehome-blockchain/wallets 하위에 prik / pubk 폴더에 존재하며 각각의 파일에 대한 설명은 아래와 같습니다.
* Devnet에 자동 발행된 코인을 사용하기 위해서는 'issueWallet.key' 계정으로 부터 코인을 인출해야 합니다.
* Devnet에 신규 서비스 등록을 위해서는 'manService.key' 계정을 사용해서 서비스 등록을 할 수 있습니다.

| 지갑 키 파일    | 설명                 |
|-----------------|----------------------|
| feeWallet.key   | 수수료 지갑          |
| issueWallet.key | 코인 발행 지갑       |
| man100.key      | 100 레벨 관리자 지갑 |
| man200.key      | 200 레벨 관리자 지갑 |
| man300.key      | 300 레벨 관리자 지갑 |
| manService.key  | 서비스 관리자 지갑   |
| pnl1.key        | 패널 멤버 1 지갑     |
| pnl2.key        | 패널 멤버 2 지갑     |
| pnl3.key        | 패널 멤버 3 지갑     |
| root.key        | root 관리자 지갑     |
