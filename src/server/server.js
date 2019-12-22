require('babel-polyfill');
import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

  // Watch contract events
  const STATUS_CODE_UNKNOWN = 0;
  const STATUS_CODE_ON_TIME = 10;
  const STATUS_CODE_LATE_AIRLINE = 20;
  const STATUS_CODE_LATE_WEATHER = 30;
  const STATUS_CODE_LATE_TECHNICAL = 40;
  const STATUS_CODE_LATE_OTHER = 50;
  let oracles = [];

(async () => {
  console.log(':::::::::::::::::::::::::Start regestring Oracles:::::::::::::::::::::::::');
  const TEST_ORACLES_COUNT = 10;
 
  let accounts = await web3.eth.getAccounts();
  let fee = await flightSuretyApp.methods.REGISTRATION_FEE().call();
  console.log(fee);
  console.log(accounts);

  for(let i = 0; i < TEST_ORACLES_COUNT; i++) {
      await flightSuretyApp.methods.registerOracle().send({from: accounts[i], value: fee, gas: 3000000});
      let resultIndexes = await flightSuretyApp.methods.getMyIndexes().call({from: accounts[i]});
      console.log(`${accounts[i]} : ${resultIndexes[0]}, ${resultIndexes[1]}, ${resultIndexes[2]}`);
      oracles.push({
        address: accounts[i],
        indexes: resultIndexes
    });
  }
  console.log(':::::::::::::::::::::::::End registration::::::::::::::::::::::::::::::::::');

})();
  

flightSuretyApp.events.OracleRequest({
    fromBlock: 0
  }, async function (error, event) {
    if (error) console.log(error)
    console.log(event)
    console.log(event.returnValues.index);

    let index = event.returnValues.index;
    let airline = event.returnValues.airline;
    let flight = event.returnValues.flight;
    let timestamp = event.returnValues.timestamp;
    let statusCode = STATUS_CODE_LATE_AIRLINE;
    
    oracles.forEach((oracle) => {
        oracle.indexes.forEach((index) => {
            if (index !== event.returnValues.index){
              return;
            }
            flightSuretyApp.methods.submitOracleResponse(index, airline, flight, timestamp, statusCode).send({from: oracle.address, gas: 555555});
        });
    });
    
});

flightSuretyApp.events.OracleReport({}, function (error, event){
  if (error) console.log(error);
  console.log(event);
});

flightSuretyApp.events.FlightStatusInfo({}, function (error, event){
  if (error) console.log(error);
  console.log('It is OK');
});

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;


