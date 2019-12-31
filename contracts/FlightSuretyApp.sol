pragma solidity >=0.4.25;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

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

    address private contractOwner;          // Account used to deploy contract

    // Data contract
    FlightSuretyData flightSuretyData;

        //  Multiparty consensus threshold
    uint256 private constant CONSENSUS_THRESHOLD = 50;

    // Nubmer airlines threshold to trigger contract smartness
    uint256 private constant NB_AIRLINE_THRESHOLD = 4;

    uint256 _votes = 0;

    mapping(address => address[]) votersForAirline;
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
         // Modify to call data contract's status
        require(true, "Contract is currently not operational");
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
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    constructor
                                (
                                    address dataContractAddress
                                )
                                public
    {
        contractOwner = msg.sender;
        flightSuretyData = FlightSuretyData(dataContractAddress);
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational()
                            public
                            pure
                            returns(bool)
    {
        return true;  // Modify to call data contract's status
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/


   /**
    * @dev Add an airline to the registration queue
    *
    */
    function registerAirline
                            (
                                address airline
                            )
                            external
                            returns(bool success, uint256 votes)
    {
        require(flightSuretyData.isRegisteredAirline(msg.sender), "You are not allowed to add an Airline company");
        require(!flightSuretyData.isRegisteredAirline(airline), "This airline is already registered");


        uint256 airlinesCount = flightSuretyData.getAirlines().length;

        if (airlinesCount < NB_AIRLINE_THRESHOLD){
            flightSuretyData.registerAirline(airline);
        } else {

            bool isIN = false;

            //if (votersForAirline[0xa9B1b6F2129EaCf56A1DfBf1265F56F6b81ca49f].length == 0){
            //      votersForAirline[0xa9B1b6F2129EaCf56A1DfBf1265F56F6b81ca49f] = new address[](0);
            //}

            for(uint c = 0; c < votersForAirline[airline].length; c++){
                if (votersForAirline[airline][c] == msg.sender){
                    isIN = true;
                    break;
                }
            }
            require(!isIN, "The voter has already voted for this airline.");

            votersForAirline[airline].push(msg.sender);
        }

        if (votersForAirline[airline].length.div(NB_AIRLINE_THRESHOLD).mul(100) >= CONSENSUS_THRESHOLD){
             flightSuretyData.registerAirline(airline);
             votersForAirline[airline] = new address[](0);
        }
        // If airline is registered airline
        return (success, votersForAirline[airline].length);
    }

    function getAirlinesList() public view returns(address[]){
        return flightSuretyData.getAirlines();
    }
   /**
    * @dev Register a future flight for insuring.
    *
    */
    function registerFlight
                                (
                                    string flight,
                                    uint256 timestamp
                                )
                                external returns(uint8, uint8, uint256, address)
    {
        (bytes32 _key, uint8 _statusCode, uint256 _timestamp, address _airline) = flightSuretyData.registerFlight(flight, timestamp, msg.sender);
        emit FlightRegistered(_key, _statusCode, _timestamp, _airline);
    }

    function flightsList() public view returns(bytes32[] memory, uint8[] memory,uint256[] memory, address[] memory) {
        return flightSuretyData.getRegisteredFlights();
    }
   /**
    * @dev Called after oracle has updated flight status
    *
    */
    function processFlightStatus
                                (
                                    address airline,
                                    string memory flight,
                                    uint256 timestamp,
                                    uint8 statusCode
                                )
                                internal
    {
        if (statusCode == 20) {
           require(flightSuretyData.hasInsurance(airline, flight, timestamp), "You do not have insurance on this flight");
           flightSuretyData.pay(airline, flight, timestamp);
        }
        //flightSuretyData.pay(msg.sender);
        // Check if the sender has bought the insurrance for this flight (the sender or all people who buy the insurrance for the flight)
        // refund the sender or all people who bought the insurrance.
    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus
                        (
                            address airline,
                            string flight,
                            uint256 timestamp
                        )
                        external
    {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key] = ResponseInfo({
                                                requester: msg.sender,
                                                isOpen: true
                                            });

        emit OracleRequest(index, airline, flight, timestamp);
    }

    function fund
                            (
                            )
                            public
                            payable
    {
        require(flightSuretyData.isRegisteredAirline(msg.sender), "You aren't registered yet");
        require(msg.value > 10 ether, "Fund is unsufficient");
        flightSuretyData.fund.value(msg.value)(msg.sender);

    }

    function buy(bytes32 flightKey) public payable{

        require(msg.value >= 0, "You have to pay an amount up to 1 Eth");
        require(msg.value <= 1 ether, "The maximum amount you are authorized to pay is up to 1 Eth");

        flightSuretyData.buy.value(msg.value)(flightKey, msg.sender, msg.value);
    }

    function hasInsurance(address airline, string flight, uint256 timestamp) public view returns(bool){
        return flightSuretyData.hasInsurance(airline, flight, timestamp);
    }
// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 1;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    event AirlineAdded();
    // Event fired each time an oracle submits a response
    event FlightRegistered(bytes32 _flightKey, uint8 _statusCode, uint256 _timestamp, address _airline);

    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle
                            (
                            )
                            external
                            payable
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
    }

    function getMyIndexes
                            (
                            )
                            view
                            external
                            returns(uint8[3])
    {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }




    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
                        (
                            uint8 index,
                            address airline,
                            string flight,
                            uint256 timestamp,
                            uint8 statusCode
                        )
                        external
    {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) ||
                                                    (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            oracleResponses[key].isOpen = false;

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
                            (
                                address account
                            )
                            internal
                            returns(uint8[3])
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);
        
        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
                            (
                                address account
                            )
                            internal
                            returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion

}
contract FlightSuretyData
{
    function registerAirline(address newAirline) external;
    function getAirlines() public view returns(address[] memory);
    function isRegisteredAirline(address newAirline) external view returns(bool);
    function fund(address airline) external payable;
    function registerFlight(string flight, uint256 timestamp, address airline) external returns(bytes32, uint8, uint256, address);
    function getRegisteredFlights() external view returns(bytes32[] memory, uint8[] memory,uint256[] memory, address[] memory);
    function buy(bytes32 flight, address passenger, uint256 amount) external payable;
    function pay(address airline, string flight, uint256 timestamp) external;
    function hasInsurance(address airline, string flight, uint256 timestamp) external view returns (bool);
}
