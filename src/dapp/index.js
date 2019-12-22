
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });
    

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
            let flight = DOM.elid('flight-number').value;
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







