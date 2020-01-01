
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {
        var clone = document.cloneNode(true);
       
        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });
        contract.getFlights((error, result) => {
            console.log('-----------------------Flights List----------------------');
            console.log(error, result);
            console.log('-----------------------End Flights List----------------------');

              // Find a <table> element with id="myTable":
               /* var table = document.getElementById("flights-list").getElementsByTagName('tbody')[0];
                var tr = table.rows;
                console.log('-----------------------Node checking--------------------------');
                console.log(tr);
                console.log('-----------------------End Node checking--------------------------');
                table.removeChild(tr);
                for (var index = 0; index < result[0].length; index++) {
                // Create an empty <tr> element and add it to the 1st position of the table:
                var row = table.insertRow(0);

                // Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:
                var cell1 = row.insertCell(0);
                var cell2 = row.insertCell(1);
                var cell3 = row.insertCell(2);
                var cell4 = row.insertCell(3);

                // Add some text to the new cells:
                cell1.innerHTML = result[0][index];
                cell2.innerHTML = result[1][index];
                cell3.innerHTML = result[2][index];
                cell4.innerHTML = result[3][index];
              }
              */
        })

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        })
        
        DOM.elid('register-airline').addEventListener('click', () => {
            let address = DOM.elid('airline-address').value;
            // Write transaction
            contract.registerAirline(address, (error, result) => {
                console.log(result);
            });
        })

        DOM.elid('get-airlines-list').addEventListener('click', () => {
            contract.getAirlines((error, result) => {
                console.log('---------------------Airlines List-------------------------');
                console.log(error, result);
            });
        })

        DOM.elid('airline-fund').addEventListener('click', () => {
            contract.airlineFund((error, result) => {
                console.log('---------------------Funding-------------------------');
                console.log(error, result);
            });
        });

        DOM.elid('register-flight').addEventListener('click', () => {
            let flight = DOM.elid('flight-number-02').value;
            alert(flight);
            contract.registerFlight(flight, (error, result) => {
                console.log('---------------------Register Flight-------------------------');
                console.log(error, result);
            });
        });

        document.addEventListener('statusEvent', function (e) {
            
          console.log('--------------------------------------');
          console.log(DOM.elid('display-wrapper').lastChild.getElementsByClassName('col-sm-8')[0].append(' Status: ' + e.__proto__.dataResult.status));

          console.log('---------------------------------')
          }, false);
        
          
          document.addEventListener('RegisterFlightEvent', function (e) {
            console.log('--------------------------------------');
            console.log(e);
            
            var table = document.getElementById("flights-list").getElementsByTagName('tbody')[0];

            // Create an empty <tr> element and add it to the 1st position of the table:
            var row = table.insertRow(0);

            // Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            var cell3 = row.insertCell(2);
            var cell4 = row.insertCell(3);

            // Add some text to the new cells:
            cell1.innerHTML = e.__proto__.dataResult._index;
            cell2.innerHTML = e.__proto__.dataResult._statusCode;
            cell3.innerHTML = e.__proto__.dataResult._timestamp;
            cell4.innerHTML = e.__proto__.dataResult._airline;
           
            console.log('---------------------------------')
            }, false);
    });
    
    DOM.elid('buy-insurance').addEventListener('click', () => {
        let flightKey = DOM.elid('flight-key').value;
        contract.buyInsurance(flightKey, (error, result) => {
            console.log('---------------------Register Flight-------------------------');
            console.log(error, result);
        });
    });

    DOM.elid('withdraw-fund').addEventListener('click', () => {
        contract.withdraw((error, result) => {
            console.log('---------------------Initiate withdraw-------------------------');
            console.log(error, result);
        });
    });

})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}







