
// --------------------------------------------
//  Code to own the WebSocket object constructor
//  Code snippet comes compliments of Rob W 
//  http://stackoverflow.com/questions/31181651/inspecting-websocket-frames-in-an-undetectable-way/31182643#31182643
// -------------------------------------------- 

if(document.domain == "st.chatango.com") {

(function() {
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
        
        if( data.match( /^bm:/gi ) ) {  // catch chatango messages only 
            
            if( cc.settings.powerSwitch == "on" ) { // this thing on?
                cc.processFrame(data);
                if( cc.getData().length < 2800) {
                    data = cc.getData();                    
                }
            }
        } else if (data.match(/^blogout/gi)) {
            // user logged out. 
            setTimeout(function(){
                cc.loadSettings();
                cc.updateForm();
                var findLoginContainer = setInterval(function() {
                    if ( $(".sdlg-main-cbdr-cpbg").length > 0 ) {                    
                        newLoginDetection();
                        clearInterval(findLoginContainer);                    
                    }
                }, 500); 
            },500);
        }

        // ----------------------------------------------------------
        return wsSend(this, arguments);
    };
})(); }

var readyStateCheckInterval = setInterval(function() {
    if (document.readyState === "complete" && window.jQuery) {
        clearInterval(readyStateCheckInterval);
        
        // ----------------------------------------------------------
        // This part of the script triggers when page is done loading
        // ----------------------------------------------------------        
      
        cc = new CC();

        if ( !document.cookie.match(/id\.chatango\.com/gi) ) {

            var findLoginContainer = setInterval(function() {
                if ( $(".sdlg-main-cbdr-cpbg").length > 0 ) {
                    newLoginDetection();
                    clearInterval(findLoginContainer);                    
                }
            }, 500);
        }
        // ----------------------------------------------------------

    }
}, 10);

function CC() {
    // properties
    this.msg = {
        raw : "",
        header : "",
        userMessage : "",
        blendString : "",
        words :     [],
        toggles:     [], // toggle types
        tWords:     [], // toggled words
        lines:      [], // array of line info, words[], toggles[], colorCodes[], styled[], twords[]        
        colorCodes: [],        
        styled: ""
    };
    this.settings = {
        powerSwitch: "on",
        messageColors: [ "#FF0000","#00FF00","#00FFFF","#0000FF","#FF0000","#00FF00","#00FFFF","#0000FF"], //,"#FF0000","#00FF00","#00FFFF","#0000FF","#FF0000","#00FF00" ],
        lengthMode: "full",  // length modes: full*, word, fixed
        effectMode: "RGB", // interpolate through RGB, HSV, longest path, soft or hard random
        blendName: "off",
        atNameColor: "",
        atNameColorToggle: "off",
        urlColor: "",
        urlColorToggle: "off",
        usernameColor: "",
        userFontSize: "",
        userFontFace: "",
        fixedLength: 7
    };
    this.elements = {
        addCols : "",
        subCols : "",
        ccButton : document.createElement("div"),
        ui : document.createElement("div"),
        iconImg : document.createElement("img"),
        colorControls : document.createElement("div"),
        ccForm : document.createElement("form"),
        colPickContainer: document.createElement("div"),
        fixedLengthInput: document.createElement("input"),
        colorPickers: [],
        lengthModeSelect : document.createElement("select"),
        offButton : document.createElement("button"),
        blendNameToggle: document.createElement("input"),
        atNameColorToggle: document.createElement("input"),
        urlColorToggle: document.createElement("input"),
        atNameColorPicker: document.createElement("input"),
        urlColorPicker: document.createElement("input")
    };

    // methods
    this.processFrame = processFrame;
    this.saveSettings = saveSettings;
    this.loadSettings = loadSettings;
    this.updateForm = updateForm;
    this.getData = getData;
    this.createPowerSwitch = createPowerSwitch;
    this.createColorPickers = createColorPickers;
    this.createLengthModeSelect = createLengthModeSelect;
    this.createFixedLengthInput = createFixedLengthInput; 
    this.createBlendNameToggle = createBlendNameToggle; 
    this.createAtNameColorPicker = createAtNameColorPicker; 
    this.createUrlColorPicker = createUrlColorPicker; 
    this.createSettingsForm = createSettingsForm;
    this.createUI = createUI;
    this.initSpectrum = initSpectrum;
    this.toggleWords = toggleWords;
    this.prepareToggles = prepareToggles;

    // effect algorithms
    this.applyColors = applyColors;
    // this.linear = linear;
    this.blendFull = blendFull;
    this.blendFixed = blendFixed;
    this.blendWords = blendWords;
    this.matrix = matrix;
    this.ice = ice;

    this.htmlEscape = htmlEscape;
    this.htmlUnescape = htmlUnescape;
    this.rgb2hex = rgb2hex;
    this.hex2rgb = hex2rgb;

    var styleBarReady = setInterval(function() {  // wait for stylebar to be visible
        if ( document.getElementById("style-bar") != null && window.jQuery) {
            
            arguments[0].createUI();
            arguments[0].createSettingsForm();        
            clearInterval(styleBarReady);
        }
    }, 500, this);

    // generator code
    this.loadSettings();


    $("#input-field").click(function() {
       /// for later
    });

}

function processFrame(str) {
    // Remove header data 
    // example data string // bm:l6do:0:<nf1f101/><f x1301c1c1=""> user Message Here<br/>Newline Here/n
    this.settings.bold = false;
    this.settings.italics = false;
    this.settings.underline = false;
    this.msg.toggles = [];
    this.msg.tWords = [];
    this.msg.blendString = "";
    this.msg.lines = [];
    this.msg.styled = "";    
    this.msg.raw = str.trim();
    this.msg.header = str.match(/^bm:\w{1,5}:\w{1,5}:/g);       
    this.msg.userMessage = 
            this.htmlUnescape( 
            str.replace(/^bm:\w{1,5}:\w{1,5}:(<n\w{3,6}\/>)?(<f x(\d{2})?(\w{3,6})?="(\w*)?">)?/gi,"")
            .replace(/(\r\n|\n|\r)/gm,"")
            .replace(/<b>|<i>|<u>/gi,"$& ")
            .replace(/<\/b>|<\/i>|<\/u>/gi, " $&") );

    if( this.msg.userMessage.match(/<b>/gi) ) {
        this.settings.bold = true;
        this.msg.userMessage = this.msg.userMessage.replace(/<b>|<\/b>/gi, "");
    } 
    if ( this.msg.userMessage.match(/<i>/gi) ) {
        this.settings.italics = true;
        this.msg.userMessage = this.msg.userMessage.replace(/<i>|<\/i>/gi, "");
    }
    if ( this.msg.userMessage.match(/<u>/gi) ) {
        this.settings.underline = true;
        this.msg.userMessage = this.msg.userMessage.replace(/<u>|<\/u>/gi, "");
    } 
    this.msg.userMessage = this.msg.userMessage.trim();

    ( str.match(/<n\w{3,6}\/>/gi) === null ) ? 
        this.settings.usernameColor = "" : 
        this.settings.usernameColor = str.match(/<n\w{3,6}\/>/gi)[0];
    
    this.settings.userFontSize = "";
    this.settings.userFontFace = ""; 

    if ( str.match(/<f x(\d{2})?(\w{3,6})?="(.*)">/gi) !== null) {
        var fontstr = str.match(/<f x(\d{2})?(\w{3,6})?="(.*)">/gi)[0];
        
        if( fontstr.indexOf("=") == 12 || fontstr.indexOf("=") == 9 || fontstr.indexOf("=") == 6 ) {
            this.settings.userFontSize = fontstr.substr(4,2);
        }

        this.settings.userFontFace = fontstr.substring(fontstr.indexOf("\"")+1,fontstr.length-2);
    }

    this.msg.toggles = this.toggleWords(this.msg.userMessage);    
    this.msg.blendString = this.prepareToggles(this.msg.userMessage, this.msg.toggles);
    

    // multiline detection
    if( this.msg.userMessage.match(/<br\/>/gi) ) {
        var lines = this.msg.userMessage.split("<br/>");
        
        for (var li = 0; li < lines.length; li++) {
            this.msg.tWords = [];
            this.msg.userMessage = lines[li];
            this.msg.toggles = this.toggleWords(this.msg.userMessage);    
            this.msg.blendString = this.prepareToggles(this.msg.userMessage, this.msg.toggles);
            this.applyColors();
            this.msg.lines.push(this.msg.styled);
        }
        this.msg.styled = "";
        for (li = 0; li < this.msg.lines.length; li++) {
            this.msg.styled += this.msg.lines[li];
            if( (li+1) != this.msg.lines.length ) {
                this.msg.styled += "<br/>";
            }
        }
    } else {
        
        this.applyColors();
    }
}

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
    if( !localStorage.getItem("ccSettings."+username) ) {
        
        if(localStorage.ccMessageColors || localStorage.ccPower || localStorage.ccFixedLength || localStorage.ccLengthMode ) {
            console.log("migration");
            var settings = {};
            this.settings.messageColors = JSON.parse(localStorage.ccMessageColors);
            this.settings.powerSwitch = localStorage.ccPower;
            this.settings.fixedLength = localStorage.ccFixedLength;
            this.settings.lengthMode = localStorage.ccLengthMode;
            localStorage.removeItem("ccMessageColors");
            localStorage.removeItem("ccPower");
            localStorage.removeItem("ccFixedLength");
            localStorage.removeItem("ccLengthMode");
            
        }
        this.saveSettings(); 
        return;                
    } else { 
        var settings = JSON.parse(localStorage.getItem("ccSettings."+username));
        this.settings.powerSwitch = settings.ccPower,
        this.settings.messageColors = settings.ccMessageColors,
        this.settings.effectMode = settings.ccEffectMode,
        this.settings.lengthMode = settings.ccLengthMode,
        this.settings.fixedLength = settings.ccFixedLength,
        this.settings.atNameColor = settings.ccAtNameColor,
        this.settings.urlColor = settings.ccUrlColor,
        this.settings.atNameColorToggle = settings.ccAtNameToggle,
        this.settings.urlColorToggle = settings.ccUrlToggle,
        this.settings.blendName = settings.ccBlendName;

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

    console.log(this.settings.atNameColorToggle);
    $(this.elements.atNameColorPicker).spectrum("set",this.settings.atNameColor);
    if( this.settings.atNameColorToggle == "off" && this.elements.atNameColorToggle.checked ) {
        this.elements.atNameColorToggle.checked = false;
    } else if ( this.settings.atNameColorToggle == "on" && !this.elements.atNameColorToggle.checked ) { 
        this.elements.atNameColorToggle.checked = true;
    }
    console.log(this.settings.urlColorToggle);
    $(this.elements.urlColorPicker).spectrum("set",this.settings.urlColor);
    if( this.settings.urlColorToggle == "off" && this.elements.urlColorToggle.checked ) {
        this.elements.urlColorToggle.checked = false;
    } else if ( this.settings.urlColorToggle == "on" && !this.elements.urlColorToggle.checked ) { 
        this.elements.urlColorToggle.checked = true;
    }


}

function words() {
    return this.msg.wData.words;
}

function getData() {    
    return this.msg.header +this.msg.styled + "\n"; 
}

function createPowerSwitch() {
    var offButton = $(this.elements.offButton)
        .css({
            "margin": "3px",
            "background-color" : (this.settings.powerSwitch == "on") ? "#00ff00" : "#ff0000"            
        })
        .attr( "value", (this.settings.powerSwitch == "on") ? "on" : "off" )
        .html( "\u23FC" )
        .on("click",null,{ ccObj: this}, function(e) {
            
            if(this.value == "on") {
                $(e.target).css("background-color", "#ff0000").attr("value", "off");
                e.data.ccObj.settings.powerSwitch = "off";                
            } else {
                e.data.ccObj.settings.powerSwitch = "on";
                $(e.target).css("background-color", "#00ff00").attr("value", "on");                
            }
            e.data.ccObj.saveSettings();  
        } )
        .appendTo(this.elements.ui);
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

function createLengthModeSelect() {
    var uif = $(this.elements.ccForm);
    var selectWrapper = $(document.createElement("div"));
    var modeControlContainer = $( document.createElement("div") )
        .attr("id", "modeControlContainer")
        .css( {
            "margin" : "0 0 0 0",
            "padding" : "0 0 0 0" } )
        .html("Length Mode<br/>")
        .appendTo(uif);

    selectWrapper
        .attr("id", "modeSelectWrapper" )
        .css( {
            "display" : "inline", 
            "margin"  : "2px 0 5px 0",
            "border-width" : "3px" })
        .appendTo(modeControlContainer);
    var lengthModeSelect = $(this.elements.lengthModeSelect)
        .attr("name","modeSelection")
        .append($("<option>").attr("value","full").text("Full"))
        .append($("<option>").attr("value","fixed").text("Fixed"))
        .append($("<option>").attr("value","word").text("Word"))
        .on("change",{ccObj: this}, function(e) {
            e.data.ccObj.settings.lengthMode = this.value;
            if ( this.value == "fixed" ) {
                $(e.data.ccObj.elements.fixedLengthInput).show();
            } else { 
                $(e.data.ccObj.elements.fixedLengthInput).hide();
            }
            e.data.ccObj.saveSettings();
        } )
        .val(this.settings.lengthMode)
        .appendTo(selectWrapper);
}

function createFixedLengthInput (fixedLength) {
    var modeControlContainer = $("#modeControlContainer");
    var fixedLengthInput = $(this.elements.fixedLengthInput)
        .attr({
            "name" : "fixedLengthInput",
            "type" : "text",
            "id"   : "FLI",
            "size" : "4",
            "value": fixedLength })
        .css({ 
            "display" : "inline",
            "margin" : "0 0 0 4px" })
        .on("change",{ccObj : this}, function(e) {
            var length = parseInt(this.value);
            if( length > 1000 ) { length = 1000; }
            else if( length < 2 ) { length = 2}
            e.data.ccObj.settings.fixedLength = length;
            e.data.ccObj.saveSettings();
        })
        .appendTo(modeControlContainer);
    fixedLengthInput.ForceNumericOnly();

    if(this.settings.lengthMode != "fixed") { fixedLengthInput.hide(); }
}

function createBlendNameToggle() {
    var toggleContainer = $("<div>")
    .attr("id","bntWrapper")    
    .appendTo(this.elements.ccForm);

    $(this.elements.blendNameToggle)
    .attr("type","checkbox")
    .on("click",{ccObj:this}, function(e){
        e.data.ccObj.elements.blendNameToggle.checked ?
            e.data.ccObj.settings.blendName = "on" :
            e.data.ccObj.settings.blendName = "off" ;

        e.data.ccObj.saveSettings();
    })
    .appendTo(toggleContainer);

    toggleContainer.append("<span> Blend Username</span>");   

    this.settings.blendName == "on" ? 
        this.elements.blendNameToggle.checked = true: 
        this.elements.blendNameToggle.checked = false;
}

function createAtNameColorPicker() {

    var atColWrapper = $(document.createElement("div")).attr("id","atColWrapper").appendTo(this.elements.ccForm);
    $(this.elements.atNameColorToggle)
    .attr("type","checkbox")
    .on("click",{ccObj:this}, function(e){
        e.data.ccObj.elements.atNameColorToggle.checked ?
            e.data.ccObj.settings.atNameColorToggle = "on" :
            e.data.ccObj.settings.atNameColorToggle = "off" ;

            e.data.ccObj.saveSettings();
    })
    .appendTo(atColWrapper);
    this.settings.atNameColorToggle == "on" ? 
        this.elements.atNameColorToggle.checked = true: 
        this.elements.atNameColorToggle.checked = false;

    var colPicker = $(this.elements.atNameColorPicker)
    .attr( {
        "id" : "atC",
        "class" : "picker",
        "type" : "color",
        "name" : "atC",
        "value" : this.settings.atNameColor } )    
    .appendTo(atColWrapper)
    .spectrum( {
        className: "fullPicker",
        replacerClassName: "spPicker",
        appendTo : atColWrapper,
        preferredFormat: "hex",
        selectionPalette: [],
        palette: [
            ["#000","#444","#666","#999","#ccc","#eee","#f3f3f3","#fff"],
            ["#f00","#f90","#ff0","#0f0","#0ff","#00f","#90f","#f0f"],
            ["#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#cfe2f3","#d9d2e9","#ead1dc"],
            ["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd"],
            ["#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0"],
            ["#c00","#e69138","#f1c232","#6aa84f","#45818e","#3d85c6","#674ea7","#a64d79"],
            ["#900","#b45f06","#bf9000","#38761d","#134f5c","#0b5394","#351c75","#741b47"],
            ["#600","#783f04","#7f6000","#274e13","#0c343d","#073763","#20124d","#4c1130"]
        ],
        showPalette: true,
        showInitial: true,
        showInput: true,
        maxSelectionSize: 8,
        localStorageKey: "ccPalette",
        clickoutFiresChange: false,
        change: function(color) {
            //event.target.parent().css("background-color", color) ;           
            cc.settings.atNameColor = color.toHexString();
            cc.saveSettings();
            }
    });

    atColWrapper.append("@Name Color");
    $(".fullPicker").css("max-width","250px");
    $(".spPicker").css( {
        "max-width" : "15px",
        "max-height" : "15px",
        "margin" : "5px",
        "padding" : "0",
        "border-color" : "rgb(30,30,30)" 
    });
    
}
function createUrlColorPicker() {
    var urlColWrapper = $(document.createElement("div")).attr("id","urlColWrapper").appendTo(this.elements.ccForm);
    $(this.elements.urlColorToggle)
    .attr("type","checkbox")
    .on("click",{ccObj:this}, function(e){

        e.data.ccObj.elements.urlColorToggle.checked ?
            e.data.ccObj.settings.urlColorToggle = "on" :
            e.data.ccObj.settings.urlColorToggle = "off" ;

            e.data.ccObj.saveSettings();
    })
    .appendTo(urlColWrapper);
    this.settings.urlColorToggle == "on" ? 
        this.elements.urlColorToggle.checked = true: 
        this.elements.urlColorToggle.checked = false;

    var colPicker = $(this.elements.urlColorPicker)
    .attr( {
        "id" : "urlC",
        "class" : "picker",
        "type" : "color",
        "name" : "urlC",
        "value" : this.settings.urlColor } )        
    .appendTo(urlColWrapper)
    .spectrum( {
        className: "fullPicker",
        replacerClassName: "spPicker",
        appendTo : urlColWrapper,
        preferredFormat: "hex",
        selectionPalette: [],
        palette: [
            ["#000","#444","#666","#999","#ccc","#eee","#f3f3f3","#fff"],
            ["#f00","#f90","#ff0","#0f0","#0ff","#00f","#90f","#f0f"],
            ["#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#cfe2f3","#d9d2e9","#ead1dc"],
            ["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd"],
            ["#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0"],
            ["#c00","#e69138","#f1c232","#6aa84f","#45818e","#3d85c6","#674ea7","#a64d79"],
            ["#900","#b45f06","#bf9000","#38761d","#134f5c","#0b5394","#351c75","#741b47"],
            ["#600","#783f04","#7f6000","#274e13","#0c343d","#073763","#20124d","#4c1130"]
        ],
        showPalette: true,
        showInitial: true,
        showInput: true,
        maxSelectionSize: 8,
        localStorageKey: "ccPalette",
        clickoutFiresChange: false,
        change: function(color) {
            //event.target.parent().css("background-color", color) ;           
            cc.settings.urlColor = color.toHexString();
            cc.saveSettings();
            }
    });

    urlColWrapper.append("URL Color");
    $(".fullPicker").css("max-width","250px");
    $(".spPicker").css( {
        "max-width" : "15px",
        "max-height" : "15px",
        "margin" : "5px",
        "padding" : "0",
        "border-color" : "rgb(30,30,30)" 
    });
}

function createSettingsForm() {
    this.createPowerSwitch();
    this.createColorPickers();
    this.createLengthModeSelect();
    this.createFixedLengthInput(this.settings.fixedLength);
    this.createBlendNameToggle();
    this.createAtNameColorPicker();
    this.createUrlColorPicker();
   
} // end of createSettingsForm method

function createUI() {    
    $(this.elements.iconImg).attr("src",ccicon);
    $(this.elements.ccButton)
    .attr({
        "class":"icon",
        "id" : "ccbutton" })
    .append(this.elements.iconImg)
    .on("click",{ccObj:this},function(e){
        e.data.ccObj.elements.ui.style.display = "block"; 
        $(document.body)
        .on("click",{ccObj: e.data.ccObj}, function(ev) {            
            if (!ev.data.ccObj.elements.ui.contains(ev.target) && !ev.data.ccObj.elements.ccButton.contains(ev.target) ) {            
                ev.data.ccObj.elements.ui.style.display = "none";  
                $(this).off("click");
            }   // inject a button into chatango style bar
        });
    });


      
    var sb = document.getElementById("style-bar");            
    sb.insertBefore(this.elements.ccButton, sb.firstChild); 
    $(this.elements.ui)
    .attr("id","ccUi")
    .css({
        "background-color": "rgba(255,255,255,.9)",
        "width" : "200px",
        "height" : "300px",
        "border" : "1px solid #000" , 
        "border-radius" : "15px" , 
        "padding" : "0 10px 0 10px" , 
        "margin" : "0",
        "box-shadow": "2px 2px 3px #121212",
        "position" : "fixed",
        "bottom" : "140px",
        "right" : "120px",
        "display" : "none"
    });

    // adjust position for tiny iframes
    if(window.innerWidth < 500) { 
        $(this.elements.ui).css("right","20px");
    }
    if(window.innerHeight < 500) {
        $(this.elements.ui).css("bottom","70px");        
    }
    $("#OW").append(this.elements.ui);
}

function initSpectrum(input, wrapper) {
    input.spectrum( {
        className: "fullPicker",
        replacerClassName: "spPicker",
        appendTo : wrapper,
        preferredFormat: "hex",
        selectionPalette: [],
        palette: [
            ["#000","#444","#666","#999","#ccc","#eee","#f3f3f3","#fff"],
            ["#f00","#f90","#ff0","#0f0","#0ff","#00f","#90f","#f0f"],
            ["#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#cfe2f3","#d9d2e9","#ead1dc"],
            ["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd"],
            ["#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0"],
            ["#c00","#e69138","#f1c232","#6aa84f","#45818e","#3d85c6","#674ea7","#a64d79"],
            ["#900","#b45f06","#bf9000","#38761d","#134f5c","#0b5394","#351c75","#741b47"],
            ["#600","#783f04","#7f6000","#274e13","#0c343d","#073763","#20124d","#4c1130"]
        ],
        showPalette: true,
        showInitial: true,
        showInput: true,
        maxSelectionSize: 8,
        localStorageKey: "ccPalette",
        clickoutFiresChange: false,
        change: function(color) {
            //event.target.parent().css("background-color", color) ;           
            if( $(event.target).closest(".cWrapper")[0] ) {                
                cc.settings.messageColors[$(event.target).closest(".cWrapper")[0].id.substr(2,$(event.target).closest(".cWrapper")[0].id.length-2)] = color.toHexString();
                cc.saveSettings();

            }
        }
    });
}

function htmlEscape(str) {
    
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

}

function htmlUnescape(str){
    return str
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

function rgb2hex(rgb){
    rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    return (rgb && rgb.length === 4) ? "#" +
        ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
}

function hex2rgb(hex,opacity) {
    hex = hex.replace('#','');
    r = parseInt(hex.substring(0,2), 16);
    g = parseInt(hex.substring(2,4), 16);
    b = parseInt(hex.substring(4,6), 16);

    result = 'rgba('+r+','+g+','+b+','+opacity+')';
    return result;
}


function toggleWords(str) {
    var words, toggles, emoticons;
    
    words = str.split(" ");
    toggles = [];
    emoticons = [   ":)", ":(", ":|", ":D", "*lol*", ":@",
                    ":P", ":x", ":o", ";(", ";)", "8)", 
                    "(:", "*pukes*", "zzzz", "*h*", "*hb*", "*blush*", 
                    "*waves*", "~V", "o_o)", "_shhh", "*bored*", "*burger*", 
                    "*rolleyes*", "*stop*", "*star*", "[~]", "(=)", "{b)", 
                    "(~)", "(o_o", "_hmmm", "~p", "~dd", "~d", 
                    ":*", "=_=", "(o_o)", "-O_O-", "*:)", "0:)", 
                    "]:)", "x_x", "*bball*", "*soccer*", "(o)", "*chocdonut*", 
                    "*$*", "*warning*", "*cat*", "*dog*", "*monkey*", "*panda*", 
                    "*vampire*", "*werewolf*", "*ghost*", "*skull*", "*zombie*", "*mummy*", 
                    "*troll*", "*stripes*", "*sun*", "*rain*", "}|", "><>", 
                    "8|8", "*snow*", "*poop*" 
                ];

    for( i = 0; i < words.length; i++ ) {
            
        if( words[i].substr(0,1) == "@" ) {
            toggles.push("atName");
            if( words[i].charAt(words[i].length-1) == ":") {
                var strIndex = str.indexOf(words[i]);
                var exp = /([`])(?:(?=(\\?))\2.)*?\1/g; // match chatango quoted strings
                // get number of words in the >> @name: `quoted string` << section
                var qLength = str.substr(strIndex,str.length-strIndex).match(exp)[0].split(" ").length;
                
                // push atname toggle for each word then iterate 
                for(var qi=0; qi<qLength; qi++) {
                    toggles.push("atName");
                }
                i += qLength;                
            }
            continue;
        } else if( words[i].match(/(http|https):\/\//ig) ) {
            toggles.push("url");
            continue;
        } else {
            
            for( e = 0; e < emoticons.length; e++) {
                if( words[i].match(emoticons[e].replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") )) {
                    toggles.push("emoticon");
                    break;
                }
            }

            if( toggles[i] == "emoticon" ) { continue; }
        }

        toggles.push(false);
    }
   
    return toggles ;
}

function prepareToggles(str, toggles) {
    var preparedStr, words;
    preparedStr = "";
    words = str.split(" ");

    for( i = 0; i < words.length; i++ ) {
        if ( toggles[i] == "atName") {            
            this.msg.tWords[i] = words[i];
            preparedStr += "~ ";
        } else if ( toggles[i] == "url" ) {
            this.msg.tWords[i] = words[i];
            preparedStr += "~ ";
        } else if ( toggles[i] == "emoticon" ) {
            if(words[i] == "><>") {
                words[i] = "&gt;&lt;&gt;"
                if(i == words.length-1) { words[i] += " "; }
            }
            this.msg.tWords[i] = words[i];
            preparedStr += "~ ";
        } else {
            preparedStr += words[i] + " ";
        }
    }

    return preparedStr.trim();
}

function blendWords(str) {
    var c = this.settings.messageColors;
    var intFunc = d3.interpolateRgbBasis(c);
    var blendWords = this.msg.blendString.split(" ");
    
    var fnColorCodes = [];
    for( var wi = 0; wi < blendWords.length; wi++ ) {
        for( var ci = 0; ci < blendWords[wi].length; ci++) {
            var intP = ci/blendWords[wi].length;
            if( ci == blendWords[wi].length-1 ) { intP = 1; }
            fnColorCodes.push( this.rgb2hex( intFunc( intP )));
        }
        fnColorCodes.push("");
    }
    this.msg.colorCodes = fnColorCodes;
}

function blendFixed(str) {
    var c = this.settings.messageColors;
    var intFunc = d3.interpolateRgbBasis(c);
    var blendString = this.msg.blendString;    
    var fnColorCodes = [];
    var loops = Math.ceil( blendString.length/this.settings.fixedLength );

    for( var ci = 0; ci < loops; ci++ ) {
        for( var fi = 0; fi < this.settings.fixedLength; fi++) {
            var intP = fi/this.settings.fixedLength;
            if( fi == this.settings.fixedLength-1 ) { intP = 1; }
            fnColorCodes.push( this.rgb2hex( intFunc( intP )));
            if(fnColorCodes.length == blendString.length ) { break; }
        }
    }
    
    this.msg.colorCodes = fnColorCodes;
}

function blendFull(str) {

    var c = this.settings.messageColors;
    var intFunc = d3.interpolateRgbBasis(c);
    var blendString = this.msg.blendString;

    var fnColorCodes = [];

    for( var ci = 0; ci < blendString.length; ci++ ) {
        var intP = ci/blendString.length;
        if( ci == blendString.length-1 ) { intP = 1; }
        fnColorCodes.push( this.rgb2hex(intFunc( intP )) );
    } 
    this.msg.colorCodes = fnColorCodes;  
}


function applyColors() {
    // if mode is full then do this...
    switch(this.settings.lengthMode) {
        case "full" : 
            this.blendFull();
            break;
        case "fixed" :
            this.blendFixed();
            break;
        case "word" : 
            this.blendWords();
            break;
    }
    
    // if words then this
    // this.blendWords();
    // this.blendFixed();

    //  space out style tags for better processing 
    //  also removes redundant spaces
    var msg = this.msg.blendString
    var words = msg.split(" ");
    var wi = 0;    
    var nmsg = "";
    var previousColor = "";
    var colorCode = "";
    var styleOpen = "";
    var styleClose = "</f>";

    if(this.settings.bold) {
        styleOpen += "<b>";
        styleClose = "</b>"+styleClose;
    }
    if(this.settings.italics) {
        styleOpen += "<i>";
        styleClose = "</i>"+styleClose;
    }
    if(this.settings.underline) {
        styleOpen += "<u>";
        styleClose = "</u>"+styleClose;
    }

    for( var bi = 0; bi < msg.length ; bi++ ) {

        if (( this.msg.colorCodes[bi] == previousColor ) ) {
            colorCode = "";            
        } else { 
            colorCode = "<f x"+ this.settings.userFontSize + this.msg.colorCodes[bi].substr(1,6) + "=\""+ this.settings.userFontFace +"\">";
        }
        if ( bi == msg.length-1 ) {
            // last char
        }              
        if( msg.charAt(bi) == " ") { // next word on spaces            
            wi++;
            this.settings.underline ?
                nmsg += styleOpen + " " + styleClose :             
                nmsg += " ";
        } else if ( this.msg.toggles[wi] == "atName" ) {
            if(this.settings.atNameColorToggle=="on"){
                colorCode = "<f x"+ this.settings.userFontSize + this.settings.atNameColor.substring(1) + "=\""+ this.settings.userFontFace +"\">";
            }
            if ( this.msg.toggles[wi-1] == "atName" ) {
                nmsg += this.msg.tWords[wi];
            } else {
                nmsg += colorCode + this.msg.tWords[wi];
            }
        } else if( this.msg.toggles[wi] == "url"  ) {
            if(this.settings.urlColorToggle=="on"){
                colorCode = "<f x"+ this.settings.userFontSize + this.settings.urlColor.substring(1) + "=\""+ this.settings.userFontFace +"\">";
            }           
            nmsg += colorCode + styleOpen + this.msg.tWords[wi] + styleClose;

        } else if( this.msg.tWords[wi] == "*stripes*" ) {
            // special coloring for blank *stripes*
            if (bi == 0) {
                nmsg += "*stripes*?"
                    + this.msg.colorCodes[bi] + ","
                    + this.msg.colorCodes[bi+1] + ":-90:1";
            } else if (bi == (this.msg.blendString.length-1)) {

                nmsg += "*stripes*?"
                + this.msg.colorCodes[bi-1] + ","
                + this.msg.colorCodes[bi] + ":-90:1";
            } else {
                nmsg += "*stripes*?"
                + this.msg.colorCodes[bi-1] + ","
                + this.msg.colorCodes[bi] + ","
                + this.msg.colorCodes[bi+1] + ":-90:1";
            }
        } else if( this.msg.toggles[wi] == "emoticon" ) {
           // skip emoticon coloring
           nmsg += this.msg.tWords[wi];

        } else if(msg.codePointAt(bi) > 65536 ) {
            // if( previousColor === "") {
            //     nmsg += "<f x"+ this.settings.userFontSize + this.msg.colorCodes[bi].substr(1,6) + "=\"\">";
            // }
            nmsg += colorCode + String.fromCodePoint(msg.codePointAt(bi));
            bi++;            
        } else {                         
            nmsg += colorCode + styleOpen + this.htmlEscape(msg.charAt(bi)) + styleClose;
        }
        previousColor = this.msg.colorCodes[bi];
    }
    var userNameColor = "";
    this.settings.blendName == "on" ?
        userNameColor = "<n"+this.msg.colorCodes[0].substring(1)+"/>": this.settings.userNameColor;
    this.msg.styled = userNameColor + nmsg;
    
}


function matrix() {

}    

function ice() {

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

        $("#LOGIN").click( newLoginDetection );

    } else {
        // jQuery is not loaded        
    }
}

// utility functions 
var called = false;
function newLoginDetection() {      
    // This function fires when the login panel is brought up
    if( called ) {
        return;
    }
    called = true;
    var loginCheck = setInterval(function() {
        /*var nIdMatch = document.cookie.match(/id\.chatango\.com=([^;]+)/gi);
        if(nIdMatch !== null) {
            // if a cookie is set then a new login has been done
            
            cc.loadSettings();
            cc.updateForm();
            clearInterval(loginCheck);
        } else */

        if( $("#buttons-wrapper").length == 0 ) {
            // the panel closed, so load user settings
            setTimeout(function(){
                cc.loadSettings();
                cc.updateForm();
            },500);
            clearInterval(loginCheck);
            called = false;
        } else {
            //console.log("no cookie but panel is open");

        }
    }, 1000);
}
