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
        this.flights = {};
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
                console.log('------------------------------Ethereum event--------------------------------');
                console.log(event);
                console.log('------------------------------End Ethereum event--------------------------------');
               console.log(event.returnValues);
               var uiEvent = document.createEvent('Event');

                // Nomme l'événement 'build'.
                uiEvent.initEvent('statusEvent', true, true);
                uiEvent.__proto__.dataResult = event.returnValues;
                document.dispatchEvent(uiEvent);
            });

            this.flightSuretyApp.events.FlightRegistered({
                fromBlock: 0
            },(error, event) => {
                console.log(event.returnValues);

                var uiRegisterFlightEvent = document.createEvent('Event');

                // Nomme l'événement 'build'.
                uiRegisterFlightEvent.initEvent('RegisterFlightEvent', true, true);
                uiRegisterFlightEvent.__proto__.dataResult = event.returnValues;
                document.dispatchEvent(uiRegisterFlightEvent);
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
            airline: this.flights[flight].airline,
            flight: flight,
            timestamp: this.flights[flight].timestamp
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
        let flightObject  = {id: flight, airline: self.airlines[index], timestamp: Math.floor(Date.now() / 1000)};
        this.flights[flight] = flightObject;
        console.log(this.flights);
        self.flightSuretyApp.methods
            .registerFlight(flight, flightObject.timestamp)
            .send({from: self.airlines[index], gas: 300000}, callback);
    }
    getFlights(callback) {
        let self = this;
        self.flightSuretyApp.methods
            .flightsList()
            .call({from: self.owner}, callback);
    }
    buyInsurance(flightKey, callback) {
        console.log(this.owner);
        const walletValue = web3.toWei(1, "ether");
        this.flightSuretyApp.methods
            .buy(flightKey)
            .send({from: this.owner, value: walletValue, gas: 3000000}, callback);
    }
    withdraw(callback) {
        console.log('--------------withdraw--------------------');
        this.flightSuretyApp.methods
            .withdraw()
            .send({from: this.owner}, callback);
    }
}