
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it.skip(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it.skip(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it.skip(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it.skip(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it.skip('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];
    let otherAirline = accounts[3];

    // ACT
    //try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.owner});
        await config.flightSuretyApp.registerAirline(otherAirline, {from: config.owner});
    //}
    //catch(e) {
    let output = await config.flightSuretyApp.getAirlinesList.call();

    console.log(output);
    //}
    let result = await config.flightSuretyData.isRegisteredAirline.call(newAirline); 

    // ASSERT
    assert.equal(result, true, "Airline should not be able to register another airline if it hasn't provided funding");

  });

  it('Should be smarter when it accross the threshold', async () => {
    
    // ARRANGE
    let secondAirline = accounts[5];
    let thirdAirline = accounts[6];
    let fourthAirline = accounts[7];
    let fifthAirline = accounts[8];
    let sixthAirline = accounts[9];

    // ACT
    //try {
        await config.flightSuretyApp.registerAirline(secondAirline, {from: config.owner});
        await config.flightSuretyApp.registerAirline(thirdAirline, {from: config.owner});
        await config.flightSuretyApp.registerAirline(fourthAirline, {from: config.owner});
        await config.flightSuretyApp.registerAirline(fifthAirline, {from: config.owner});
        await config.flightSuretyApp.registerAirline(sixthAirline, {from: config.owner});

        // it should become smarter
       
        await config.flightSuretyApp.registerAirline(fifthAirline, {from: secondAirline});
        await config.flightSuretyApp.registerAirline(fifthAirline, {from: thirdAirline});
        await config.flightSuretyApp.registerAirline(fifthAirline, {from: fourthAirline});
    //}
    //catch(e) {
    let output = await config.flightSuretyApp.getAirlinesList.call();
    console.log('-----------------------------------1------------------------------');
    console.log(fifthAirline);
    console.log(output);
    //}
    let result = await config.flightSuretyData.isRegisteredAirline.call(fifthAirline); 
    console.log('---------------------------------------------------');
    console.log(secondAirline);
    console.log(result);

    // ASSERT
    assert.equal(result, true, "Airline should not be able to register another airline if it hasn't provided funding");

  });

  it('should register Oracles using registerOracle function if fees are sufficients', async ()=> {
    
  });
 

});
