import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
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

            callback();
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
        console.log(self.newAirline);
       self.flightSuretyApp.methods
            .registerAirline(airlineAddress)
            .send({from: self.owner, gas: 300000}, callback);
    }

    getAirlines(callback){
        let self = this;
        self.flightSuretyApp.methods
            .getAirlinesList()
            .call({from: self.owner}, callback);
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
}