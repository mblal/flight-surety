exports.id=0,exports.modules={"./src/server/server.js":function(e,r,s){"use strict";s.r(r);var o=s("./build/contracts/FlightSuretyApp.json"),t=s("./src/server/config.json"),n=s("web3"),c=s.n(n),a=s("express"),l=s.n(a),u=t.localhost,i=new c.a(new c.a.providers.WebsocketProvider(u.url.replace("http","ws")));i.eth.defaultAccount=i.eth.accounts[0];var p=new i.eth.Contract(o.abi,u.appAddress);console.log("Start regestring Oracles----------------------------\x3e>>"),p.events.OracleRequest({fromBlock:0},(function(e,r){e&&console.log(e),console.log(r)}));var d=l()();d.get("/api",(function(e,r){r.send({message:"An API for use with your Dapp!"})})),r.default=d}};