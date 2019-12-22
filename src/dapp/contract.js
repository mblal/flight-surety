import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        //this.web3 = new Web3(window.ethereum);
        //window.ethereum.enable(); // get permission to access accounts
        this.web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
        this.newAirline = null;
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
            console.log('---------------------------accts------------------------------')
            console.log(accts)
            this.owner = accts[0];
            this.newAirline = accts[4];
            let counter = 1;
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }
            console.log( this.passengers);
            callback();

            this.flightSuretyApp.events.FlightStatusInfo({
                fromBlock: 0
            }, (error, event) => {
               console.log(event.returnValues);
               var uiEvent = document.createEvent('Event');

                // Nomme l'événement 'build'.
                uiEvent.initEvent('statusEvent', true, true);
                uiEvent.__proto__.dataResult = event.returnValues;
                document.dispatchEvent(uiEvent);
            });
        });

    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    registerAirline(airlineAddress, callback){
        let self = this;
        console.log('--------------The owner-------------------');
        console.log(self.owner)
        console.log('--------------The new Airline-------------------');
        console.log(airlineAddress);
        alert(self.owner);
       self.flightSuretyApp.methods
            .registerAirline(airlineAddress)
            .send({from: self.owner, gas: 300000}, callback);
    }

    getAirlines(callback) {
        let self = this;
        self.flightSuretyApp.methods
            .getAirlinesList()
            .call({from: self.owner}, callback);
    }
    airlineFund(callback) {
        let self = this;
        const walletValue = web3.toWei(11, "ether");
       self.flightSuretyApp.methods
            .fund()
            .send({from: self.owner, gaslimit:21000, value: walletValue}, callback);
    } 
    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }
    registerFlight(flight, callback){
        let self = this;
        let index = Math.floor(Math.random() * 5);
        self.flightSuretyApp.methods
            .registerFlight(flight, Math.floor(Date.now() / 1000))
            .send({from: self.owner /*self.airlines[index]*/, gas: 300000}, callback);
    }
}