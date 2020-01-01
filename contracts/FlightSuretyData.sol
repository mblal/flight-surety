pragma solidity >=0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

     // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;


    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    struct Airline {
        address companyAddress;
        bool isActive;
    }
    mapping(uint8 => Airline) airlinesBis;

    mapping(address => bool) airlines;

    uint8 airlineCount = 0;

    mapping(address => bool) authorizedCallers;

    struct Flight {
        bytes32 id;
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airline;
    }
    mapping(uint8 => Flight) private flights;

    uint8 flightsCount = 0;

    enum _Status
    {
        able,  // 0
        unable //1
    }

    struct Insurance {
        uint256 amount;
        address passenger;
        bytes32 flight;
        _Status status;
        bool isValid;
    }

    mapping(bytes32 => Insurance) insurances;

    mapping(address => uint256) balance;
    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                )
                                public
    {
        contractOwner = msg.sender;
        airlines[msg.sender] = true;
        airlinesBis[airlineCount] = Airline({
            companyAddress: msg.sender,
            isActive: false
        });

        airlineCount ++;
        //flightsCount = 0;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational()
                            public
                            view
                            returns(bool)
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus
                            (
                                bool mode
                            )
                            external
                            requireContractOwner
    {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function registerAirline
                            (
                                address newAirline
                            )
                            external
    {
        airlines[newAirline] = true;
        airlinesBis[airlineCount] = Airline({
            companyAddress: newAirline,
            isActive: false
        });

        airlineCount ++;
    }

    function getAirlines() external view returns(address[]) {
        address[] memory result = new address[](airlineCount);
        for(uint8 i = 0; i < airlineCount; i++){
            result[i] = airlinesBis[i].companyAddress;
        }
        return result;
    }

    function isRegisteredAirline(address newAirline) external view returns(bool){
        return  airlines[newAirline];
    }
   /**
    * @dev Buy insurance for a flight
    *
    */
    function buy
                            (
                                bytes32 flight, address passenger, uint256 amount
                            )
                            external
                            payable
    {
        insurances[flight] = Insurance({
            amount: amount,
            passenger: passenger,
            flight: flight,
            status: _Status.able,
            isValid: true
        });
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                    address passenger
                                )
                                external
    {
        require(balance[passenger] > 0, "You do not have enough money to initiate a withdraw.");
        uint256 prev = balance[passenger];
        balance[passenger] = 0;
        passenger.transfer(prev);
    }

    /**
     *  @dev Transfers eligible payout funds to insuree.
     *
    */

    function pay
                            (
                                address airline, string flight, uint256 timestamp
                            )
                            external
    {
        bytes32 flightKey;
        flightKey = getFlightKey(airline, flight, timestamp);
        address passenger = insurances[flightKey].passenger;
        uint256 payedAmount = insurances[flightKey].amount;
        uint amountToRefund = SafeMath.mul(payedAmount, 1);
        balance[passenger] += amountToRefund;
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund
                            (
                                address airline
                            )
                            external
                            payable
    {
        airlinesBis[1].isActive = true;
    }

    function registerFlight(string flight, uint256 timestamp, address airline) external returns(bytes32, uint8, uint256, address){

        bytes32 flightKey = getFlightKey(airline, flight, timestamp);

        flights[flightsCount] = Flight ({
            id: flightKey,
            isRegistered: true,
            statusCode: STATUS_CODE_ON_TIME,
            updatedTimestamp: timestamp,
            airline: airline
        });
        flightsCount++;
        return (flightKey, flights[flightsCount - 1].statusCode, flights[flightsCount - 1].updatedTimestamp,
            flights[flightsCount - 1].airline);
    }
    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    function getRegisteredFlights() external view returns(bytes32[] memory, uint8[] memory,uint256[] memory, address[] memory){
            bytes32[] memory flightsKeys = new bytes32[](flightsCount);
            uint8[] memory flightsStatus = new uint8[](flightsCount);
            uint256[] memory flightsTimestamp = new uint256[](flightsCount);
            address[] memory flightsAirlines = new address[](flightsCount);

            for(uint8 i = 0; i < flightsCount; i++) {
                    flightsKeys[i] = flights[i].id;
                    flightsStatus[i] = flights[i].statusCode;
                    flightsTimestamp[i] = flights[i].updatedTimestamp;
                    flightsAirlines[i] = flights[i].airline;
            }
            return (flightsKeys, flightsStatus, flightsTimestamp, flightsAirlines);
    }

    function hasInsurance(address airline, string flight, uint256 timestampe) external view returns (bool) {
        bytes32 flightKey = getFlightKey(airline, flight, timestampe);
        return insurances[flightKey].isValid;
    }
    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    /*function()
                            external
                            payable
    {
        fund(airline);
    }*/

    function authorizeCaller(address authorizedContract) public requireContractOwner{
        authorizedCallers[authorizedContract] = true;
    }
}

