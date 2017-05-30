if(document.domain == "st.chatango.com") {
var cc;
var readyStateCheckInterval = setInterval(function() {
    if (document.readyState === "complete" && window.jQuery) {
        clearInterval(readyStateCheckInterval);        
        // ----------------------------------------------------------
        // This part of the script triggers when page is done loading
        // ----------------------------------------------------------
        for (var key in localStorage) {

            // migration of settings 
            if( /^ccSettings/.test( key )) {
                var un;
                un = key.match(/^ccSettings\.(.+)/)[1];
                var oldSettings;
                oldSettings = JSON.parse( localStorage[key] );

                message = JSON.stringify({
                    powerSwitch: oldSettings.ccPower == "on" ? true : false,
                    messageColors: oldSettings.ccMessageColors,
                    lengthMode: oldSettings.ccLengthMode || "full",
                    effectMode: oldSettings.ccEffectMode || "RGB",
                    blendName: oldSettings.ccBlendName == "on" ? true : false,
                    atNameColor: oldSettings.ccAtNameColor,
                    atNameColorToggle: oldSettings.ccAtNameToggle == "on" ? true : false,
                    urlColor: oldSettings.ccUrlColor,
                    urlColorToggle: oldSettings.ccUrlToggle == "on" ? true : false,
                    fixedLength: 400
                });
                
                chrome.runtime.sendMessage(rtid,{migrateUser: un, migrateSettings: message  }, function(response) {
                    console.log("Migrated User " + un);
                });

            }
            localStorage.removeItem(key);
        }
        
        chrome.runtime.sendMessage(rtid,{loadSuccess: "true"}, function(response) {
            
        });
        cc = new ceComm();
    }
}, 10); }

function ceComm() {
    // Method Definitions
    this.catcherInit = function() {
        var OrigWebSocket = window.WebSocket;   
        var callWebSocket = OrigWebSocket.apply.bind(OrigWebSocket);
        var wsAddListener = OrigWebSocket.prototype.addEventListener;
        wsAddListener = wsAddListener.call.bind(wsAddListener);
        window.WebSocket = function WebSocket(url, protocols) {
            var ws;
            if (!(this instanceof WebSocket)) {
                // Called without 'new' (browsers will throw an error).
                ws = callWebSocket(this, arguments);
            } else if (arguments.length === 1) {
                ws = new OrigWebSocket(url);
            } else if (arguments.length >= 2) {
                ws = new OrigWebSocket(url, protocols);
            } else { // No arguments (browsers will throw an error)
                ws = new OrigWebSocket();
            }
            wsAddListener(ws, 'message', function(event) {                
                // ----------------------------------------------------------
                // If anything needs to be done to received data, do it here
                // ----------------------------------------------------------                
                if( event.data.match(/^msglexceeded:/) ) {
                    var msgCallback = function(response) {
                        // callback                     
                    };
                    chrome.runtime.sendMessage( rtid,{msgMaxLength: event.data.substring(13)}, msgCallback );
                }
            });
            return ws;
        }.bind();
        window.WebSocket.prototype = OrigWebSocket.prototype;
        window.WebSocket.prototype.constructor = window.WebSocket;
        var wsSend = OrigWebSocket.prototype.send;
        wsSend = wsSend.apply.bind(wsSend);               
        OrigWebSocket.prototype.send = function(data) {
            // ----------------------------------------------------------
            // Process data before it is sent to the webSocket data
            // ----------------------------------------------------------
            if( data.charAt(0) == "~") { // check for processed string flag from msgCallback()
                data = data.substring(1);                
                return wsSend(this, arguments);
            } else if( data.match( /^bm:/ ) ) {  // catch chatango messages               
                var msgCallback = function(response) {
                    this.send(response.styledMsg); // recursive function call with new processed string flagged with ~
                };
                chrome.runtime.sendMessage( rtid,{chMsg: data}, msgCallback.bind(this) );
            } else {
                return wsSend(this, arguments); 
            }
            // ----------------------------------------------------------            
        };
    }
    this.catcherInit();
}
    // $("#input-field").click(function() {
    //    /// for later
    // });