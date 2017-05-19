if(document.domain == "st.chatango.com") {
var newData = ""; // global for now
var msgSocket;

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
                //msglexceeded:850

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
            if( data.charAt(0) == "~") { // check for processed string from msgCallback
                data = data.substring(1);
                console.dir(data);
                return wsSend(this, arguments);

            } else if( data.match( /^bm:/gi ) ) {  // catch chatango messages
               
                var msgCallback = function(response) {
                    newData = response.styledMsg;
                    this.send(newData); // recursive function call with new processed string
                };
                chrome.runtime.sendMessage( rtid,{chMsg: data}, msgCallback.bind(this) );

            } else if (data.match(/^blogout/gi)) {  // user logged out                 
                chrome.runtime.sendMessage(rtid,{chLogOut: "1"}, function(response) {
                    
                });
                return wsSend(this, arguments); 
            } else {
                return wsSend(this, arguments); 
            }

            // ----------------------------------------------------------
            
        };
    }


    // Constructor Code 
    this.catcherInit();
}

var readyStateCheckInterval = setInterval(function() {
    if (document.readyState === "complete" && window.jQuery) {
        clearInterval(readyStateCheckInterval);
        
        // ----------------------------------------------------------
        // This part of the script triggers when page is done loading
        // ----------------------------------------------------------        
       
        chrome.runtime.sendMessage(rtid,{greeting: "hello"}, function(response) {
            console.dir(response);
        });
        cc = new ceComm();

        // if ( !document.cookie.match(/id\.chatango\.com/gi) ) {

        // }
        // ----------------------------------------------------------

    }
}, 10); }





    // $("#input-field").click(function() {
    //    /// for later
    // });


function saveSettings() {
    
    var settings = {
        ccSettingsVersion: 1,
        ccPower: this.settings.powerSwitch,
        ccMessageColors: this.settings.messageColors,
        ccEffectMode: this.settings.effectMode,
        ccLengthMode: this.settings.lengthMode,
        ccFixedLength: this.settings.fixedLength,
        ccAtNameColor: this.settings.atNameColor,
        ccAtNameToggle: this.settings.atNameColorToggle,
        ccUrlColor: this.settings.urlColor,
        ccUrlToggle: this.settings.urlColorToggle,
        ccBlendName: this.settings.blendName
    }

    var idMatch = document.cookie.match(/id\.chatango\.com=([^;]+)/gi);
    if(idMatch !== null) {
        var username = idMatch[0].substring(idMatch[0].indexOf("=")+1);        
    } else {
        var username = "anon";
    }
    localStorage.setItem("ccSettings."+username,JSON.stringify(settings));
}

function loadSettings() {

    var idMatch = document.cookie.match(/id\.chatango\.com=([^;]+)/gi);
    if(idMatch !== null) {
        var username = idMatch[0].substring(idMatch[0].indexOf("=")+1);        
    } else {
        var username = "anon";
    }
    if( !localStorage.getItem("ccSettings."+username) ) { // block executes if there is no settings
        
        // checks for older version of settings and migrates them 
        if(localStorage.ccMessageColors || localStorage.ccPower || localStorage.ccFixedLength || localStorage.ccLengthMode ) {
            console.log("migration");
            var settings = {};
            localStorage.ccMessageColors ? this.settings.messageColors = JSON.parse(localStorage.ccMessageColors) : false;
            localStorage.ccPower ? this.settings.powerSwitch = localStorage.ccPower : false;
            localStorage.ccFixedLength ? this.settings.fixedLength = localStorage.ccFixedLength : false;
            localStorage.ccLengthMode ? this.settings.lengthMode = localStorage.ccLengthMode : false;
            localStorage.removeItem("ccMessageColors");
            localStorage.removeItem("ccPower");
            localStorage.removeItem("ccFixedLength");
            localStorage.removeItem("ccLengthMode");
            
        }

        this.saveSettings(); // create new settings for current user
        return; 

    } else { // block executes if there are settings
        var settings = JSON.parse(localStorage.getItem("ccSettings."+username));
        
        if(settings.ccPower.match(/^(on|off)$/)) {
            this.settings.powerSwitch = settings.ccPower;
        }
        if(Array.isArray(settings.ccMessageColors) && 
            settings.ccMessageColors.reduce(function(isHexRGB, str, i, arr) { 
                if(str.match(/^#[a-fA-F0-9]{3,6}/gi) && isHexRGB) 
                    return true;
                else return false; 
            }),true) {
            this.settings.messageColors = settings.ccMessageColors;
        }
        for (var setting in settings) {
            
            switch(setting) {
                case "ccEffectMode":
                if(settings[setting].match(/^(RGB|HSL|LONGHSL|HCL|LONGHCL|CUBEHELIX|LONGCUBEHELIX|LAB)$/) ){
                    this.settings.effectMode = settings[setting];
                }
                break;
                case "ccLengthMode":
                if(settings[setting].match(/^(full|word|fixed)$/)) {
                    this.settings.lengthMode = settings[setting];
                }
                break;
                case "ccFixedLength":
                if(Number.isInteger(settings[setting]) && settings.ccFixedLength > 0 && settings.ccFixedLength <= 1000) {
                    this.settings.fixedLength = settings[setting];
                }
                break;
                case "ccAtNameColor":
                if(settings[setting].match(/^#[a-fA-F0-9]{3,6}$/)) {
                    this.settings.atNameColor = settings[setting];
                }
                break;               
                case "ccUrlColor":
                if(settings[setting].match(/^#[a-fA-F0-9]{3,6}$/)) {
                    this.settings.urlColor = settings[setting];
                }     
                break;       
                case "ccAtNameToggle":
                if(settings[setting].match(/^(on|off)$/)) {
                    this.settings.atNameColorToggle = settings[setting];
                }     
                break;   
                case "ccUrlToggle":
                if(settings[setting].match(/^(on|off)$/)) {
                    this.settings.urlColorToggle = settings[setting];    
                }
                break;
                case "ccBlendName":
                if(settings[setting].match(/^(on|off)$/)) {
                    this.settings.blendName = settings[setting];
                }
                break;
            }
        }
    } 
}

function updateForm() {
    /*
    this.elements.offButton
    this.elements.colorPickers[]
    fixedLengthInput
    selectMode
    */
    var offButton = $(this.elements.offButton);
    if($("#ccUi").length == 0) { 
        return;
    }
    this.settings.powerSwitch == "on" ? 
    (offButton.val("on") && offButton.css("background-color", "#00ff00")) :
    (offButton.val("off") && offButton.css("background-color", "#ff0000")) ;

    $("#colPickContainer").html("");
    $(this.elements.colorPickers).remove();
    this.elements.colorPickers = [];
    for( var i = 0; i < this.settings.messageColors.length; i++) {
        var colPickWrapper = $(document.createElement("div"));
        var colPicker = $(document.createElement("input"));

        this.elements.colorPickers.push(colPickWrapper);

        colPickWrapper.attr( { "id":"cW"+i, "class":"cWrapper" }).css("display","inline");
        colPicker.attr( {
            "id" : "c"+i,
            "class" : "picker",
            "type" : "color",
            "name" : "c"+i,
            "value" : this.settings.messageColors[i] } )        
        .appendTo(colPickWrapper);

        $("#colPickContainer").append( colPickWrapper );
        this.initSpectrum(colPicker, colPickWrapper);
    }

    $(".fullPicker").css( {
        "width"  : "400px",
        "max-height" : "350px",
        "left" : "-300px" } );        
        
    $(".spPicker").css( {
        "max-width" : "15px",
        "max-height" : "15px",
        "margin" : "5px",
        "padding" : "0",
        "border-color" : "rgb(30,30,30)"
    });

    $(this.elements.fixedLengthInput).val(this.settings.fixedLength);
    $(this.elements.selectMode).val(this.settings.lengthMode);
    if ( this.settings.lengthMode == "fixed" ) { 
        $(this.elements.fixedLengthInput).show(); 
    } else {
        $(this.elements.fixedLengthInput).hide();
    }


    if( this.settings.blendName == "off" && this.elements.blendNameToggle.checked ) {
        this.elements.blendNameToggle.checked = false;
    } else if ( this.settings.blendName == "on" && !this.elements.blendNameToggle.checked ) { 
        this.elements.blendNameToggle.checked = true;
    }

    $(this.elements.atNameColorPicker).spectrum("set",this.settings.atNameColor);
    if( this.settings.atNameColorToggle == "off" && this.elements.atNameColorToggle.checked ) {
        this.elements.atNameColorToggle.checked = false;
    } else if ( this.settings.atNameColorToggle == "on" && !this.elements.atNameColorToggle.checked ) { 
        this.elements.atNameColorToggle.checked = true;
    }
    $(this.elements.urlColorPicker).spectrum("set",this.settings.urlColor);
    if( this.settings.urlColorToggle == "off" && this.elements.urlColorToggle.checked ) {
        this.elements.urlColorToggle.checked = false;
    } else if ( this.settings.urlColorToggle == "on" && !this.elements.urlColorToggle.checked ) { 
        this.elements.urlColorToggle.checked = true;
    }


}



function createColorPickers() {
    var colorControls = $(this.elements.colorControls)
        .attr({
            "id" : "colorControls"
        })
        .css({
            "width" : "100%",
            "padding": "0 0 3px 0",
            "border-width": "0 0 1px 0",
            "border-style": "solid",
            "border-color" : "rgb(150,150,150)"
        });

    var colorTitle = $("<p>")
        .html("Color Selection")
        .css({
            "font-size" : "1em",
            "display" : "inline",
            "margin" : "5px 0 2px 0",
            "padding" : "0"
        })
        .appendTo(this.elements.colorControls);

    var oldColorPickerElements = [];
    var oldColorPickersId = [];
    var oldColors = [];

    // Button to remove a color from the settings
    var subCols = $(document.createElement("div"))
    .attr( "id" , "sub")
    .css( {
        "font-size" : "1.2em",
        "display" : "inline",
        "padding" : "3px",
        "font-weight" : "bold",
        "border-width" : "0 0 3px 0",
        "border-color" : "rgba(0,0,0,1)",
        "margin" : "0 0 3px 0" } )
    .text("-")
    .appendTo(this.elements.colorControls)    

    .on("click",{ccObj:this}, function(e) {  // Function to subtract the color from the settings 
        if( e.data.ccObj.settings.messageColors.length == 2 ) {
            $("#sub").hide();
        } else if( e.data.ccObj.elements.colorPickers.length == 14 ) {
            $("#add").show();
        }
        
        oldColorPickerElements.push( $( e.data.ccObj.elements.colorPickers.pop() ).detach() );
        oldColors.push( e.data.ccObj.settings.messageColors.pop() );
        
        e.data.ccObj.saveSettings();
    } );  // Function End

    var addCols = $(document.createElement("div"))
    .attr("id", "add")
    .css( {
        "font-size" : "1.2em",
        "display" : "inline",
        "padding" : "3px",
        "font-weight" : "bold",
        "line-height" : ".5" } )
    .text("+")
    .appendTo(this.elements.colorControls)
    .on("click",{ccObj:this} , function(e) {
        if( e.data.ccObj.settings.messageColors.length == 1 ){
            $("#sub").show();
        } else if( e.data.ccObj.elements.colorPickers.length == 13 ) {
            $("#add").hide();
        }  
        if( oldColors.length > 0 ) {            
            e.data.ccObj.elements.colorPickers.push( oldColorPickerElements.pop().appendTo(e.data.ccObj.elements.colPickContainer) );
            e.data.ccObj.settings.messageColors.push( oldColors.pop() );
        } else {
            var newI = e.data.ccObj.settings.messageColors.length;
            var newPickWrapper = $(document.createElement("div")).attr( { "id":"cW"+ e.data.ccObj.settings.messageColors.length, "class":"cWrapper"} ).css("display","inline");
            var newPicker = $( document.createElement("input") )
            .attr( {
                "id" : "c"+newI,
                "class" : "picker",
                "type" : "color",
                "name" : "c"+newI,
                "value" : "#00FF00" } )
            // .change( function() {
            //     cc.settings.messageColors[event.target.id.substr(1,event.target.id.length-1)] = event.target.value;
            //     $(event.target.parentElement).css( "background-color", cc.hex2rgb( event.target.value, 1) );
            //     localStorage.ccMessageColors = JSON.stringify(cc.settings.messageColors); } )
            .appendTo(newPickWrapper);
            
            e.data.ccObj.settings.messageColors.push("#00FF00");
            $( e.data.ccObj.elements.colPickContainer ).append( newPickWrapper );
            e.data.ccObj.elements.colorPickers.push( newPickWrapper );
            
            e.data.ccObj.initSpectrum( newPicker , newPickWrapper );
        }
        $(".fullPicker").css("max-width","250px");
        $(".spPicker").css( {
            "max-width" : "15px",
            "max-height" : "15px",
            "margin" : "5px",
            "padding" : "0",
            "border-color" : "rgb(30,30,30)" 
        });
        e.data.ccObj.saveSettings();
    } );

    

    var uif = $(this.elements.ccForm);
    uif.id = "ccForm";    
    this.elements.colorControls.append(this.elements.ccForm);    
    this.elements.ui.append(this.elements.colorControls);

    var colPickContainer = $(document.createElement("div"))
        .attr("id","colPickContainer")
        .css( { 
            "padding" : "0 0 0 0",
            "margin" : "0 0 0 0" } )
        .appendTo(uif);
    this.elements.colPickContainer = colPickContainer;

    var c = this.settings.messageColors;
    for( var ci = 0 ; ci < c.length ; ci++ ) { 
        var colPickWrapper = $(document.createElement("div"));
        var colPicker = $(document.createElement("input"));

        this.elements.colorPickers.push(colPickWrapper);

        colPickWrapper.attr( { "id":"cW"+ci, "class":"cWrapper" }).css("display","inline");
        colPicker.attr( {
            "id" : "c"+ci,
            "class" : "picker",
            "type" : "color",
            "name" : "c"+ci,
            "value" : c[ci] } )        
        .appendTo(colPickWrapper);

        colPickContainer.append( colPickWrapper );
        this.initSpectrum(colPicker, colPickWrapper);
    }
    
    
    $(".fullPicker").css("max-width","250px");
    $(".spPicker").css( {
        "max-width" : "15px",
        "max-height" : "15px",
        "margin" : "5px",
        "padding" : "0",
        "border-color" : "rgb(30,30,30)" 
    });
}




// global var
var cc;
window.onload = function() {
    if (window.jQuery) {  
        // jQuery is loaded

        jQuery.fn.ForceNumericOnly =
        function() {
            return this.each(function()
            {
                $(this).keydown(function(e)
                {
                    var key = e.charCode || e.keyCode || 0;
                    // allow backspace, tab, delete, enter, arrows, numbers and keypad numbers ONLY
                    // home, end, period, and numpad decimal
                    return (
                        key == 8 || 
                        key == 9 ||
                        key == 13 ||
                        key == 46 ||
                        key == 110 ||
                        (key >= 35 && key <= 40) ||
                        (key >= 48 && key <= 57) ||
                        (key >= 96 && key <= 105));
                });
            });
        };
    } else {
        // jQuery is not loaded        
    }
}

