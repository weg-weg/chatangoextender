// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });

chrome.extension.onMessageExternal.addListener(
	function(request, sender, sendResponse) {		
		if ( request.loadSuccess !== undefined ) {
			chrome.pageAction.show(sender.tab.id);
			sendResponse({ result: "true"});
		} else if( request.chMsg !== undefined ) { // user sent message 			
			////////////////
			// console.dir(request.chMsg);
			var om = new outgoingMsg( request.chMsg );
			var response = om.styledMsg;
			if(response.length > settings.msgMaxLength) {
				response = request.chMsg;
			}
			sendResponse({ styledMsg : "~" + response });
			////////////////

		} else if ( request.msgMaxLength !== undefined ) {
			settings.msgMaxLength = request.msgMaxLength;
		} else if ( request.chLogOut !== undefined ) { // user logged out, load new settings 

		} 	
	}
);
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if ( request.changeSetting !== undefined ) {  // change setting message
			if(request.changeSetting.match(/^messageColors/)) {
				settings.messageColors[parseInt(request.changeSetting.substring(13))-1] = request.value;
			} else if( request.changeSetting == "add"){
				settings.messageColors.push(request.value) ;
			} else if( request.changeSetting == "sub"){
				settings.messageColors.pop();
			} else {
				console.log("Setting Changed : " + request.changeSetting);
				console.dir(request.value);
				settings[request.changeSetting] = request.value;
				console.dir(settings);				
			}
			sendResponse({ result: "true"});
			settings.save( settings.username );
		} else if ( request.getSettings !== undefined ) {			
			sendResponse({ settings: settings.toString()});
		}
	}
);

window.onload = function() {
	// username cookie catching : THE ONLY COOKIE READING CODE IN THE ENTIRE APP IS HERE

	chrome.cookies.get({url:"http://st.chatango.com", name:"id.chatango.com"}, function(cookie) {
		if(cookie) { settings.username = cookie.value.toLowerCase(); }
		settings.load(settings.username);
	});
	chrome.cookies.onChanged.addListener(function (data){
		if(data.cookie.name == "id.chatango.com") {
			if(data.removed) {
				settings.username = "anon";
			} else {
				settings.username = data.cookie.value.toLowerCase();
			}
			settings.load(settings.username);
		}
	});

    if (window.jQuery) {  
        // jQuery is loaded

        jQuery.fn.ForceNumericOnly =
        function() {
            return this.each( function() {
                $(this).keydown( function(e) {
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
        console.log("JQUERY ERROR");      
    }
};

var rx = {
    header: /^bm:\w{1,5}:\w{1,5}:/i,
    nameColorTag: /<n[a-fA-F0-9]{3,6}\/>/i,
    styleTag: /<f x(\d{2})?(\w{3,6})?="(.*)">/i,
    bold: /(<b>)|(<\/b>)/gi,
    italics: /(<i>)|(<\/i>)/gi,
    underline: /(<u>)|(<\/u>)/gi,
    openingTags: /<b>|<i>|<u>/gi,
    closingTags: /<\/b>|<\/i>|<\/u>/gi,
    lineBreak: /<br\/>/gi,
    outerMessageData: /^(bm:\w{1,5}:\w{1,5}:)(<n\w{3,6}\/>)?(<f x(\d{2})?(\w{3,6})?="(\w*)?">)?|(\r\n|\n|\r)/i,
    taggedQuote: /@\w+: ([`])[^`]+([`])/,
    tag: /@\w+/,
    chUrl: /http(s)?:\/\/[^ ]+/i,
    escapeChars: /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/gi,
    find: function(exp, str) { // string to compare and canned expression to use 
		
		if( str.match(this[exp]) != null ) { 
			var nstr = str.match(this[exp])[0];		
            return nstr;
        } else {
            // error handling here 
        } 
    },
    replace: function(exp,str,rstr) {
		if( str.match(this[exp]) != null ) {
			var nstr = str.replace(this[exp], rstr);
            return nstr;
        } else {
            // error handling here 
        } 
    }
};

var settings = {  // default values
    username: "anon", 
    // following settings get saved to storage
    powerSwitch: false,
    messageColors: [ "#FF0000","#FFFF00","#00FF00","#00FFFF","#0000FF","#FF00FF","#FF0000","#FFFF00", "#00FF00", "#00FFFF",
                      "#0000FF","#FF00FF","#FF0000","#FFFF00","#00FF00","#00FFFF","#0000FF","#FF00FF", "#FF0000", "#FFFF00"], //,"#FF0000","#00FF00","#00FFFF","#0000FF","#FF0000","#00FF00" ],
    lengthMode: "full",  // length modes: full*, word, fixed
    effectMode: "RGB", // interpolate through RGB, HSV, longest path, soft or hard random
    blendName: false,
    atNameColor: "#FF0000",
    atNameColorToggle: false,
    urlColor: "#FF0000",
    urlColorToggle: false,    
    fixedLength: 400, // pixels
    resolution: 1,
    // following values are pulled from environment
    msgMaxLength: 2900,
    usernameColor: "",
    userFontSize: "",
    userFontFace: "",
    bold : false,
    italics : false,
    underline : false,
    // reset chatango settings
    reset:  function() {
    	this.usernameColor = "";
    	this.userFontFace = "";
    	this.userFontSize = "";
    	this.bold = false;
    	this.italics = false;
    	this.underline = false;
    },
    // string to pass settings to page action 
    toString: function() {
    	return JSON.stringify({
    		powerSwitch: settings.powerSwitch,
		    messageColors: settings.messageColors,
		    lengthMode: settings.lengthMode || "full",
		    effectMode: settings.effectMode || "RGB",
		    blendName: settings.blendName,
		    atNameColor: settings.atNameColor,
		    atNameColorToggle: settings.atNameColorToggle,
		    urlColor: settings.urlColor,
		    urlColorToggle: settings.urlColorToggle,
		    fixedLength: settings.fixedLength
    	});
    },
    // load from storage based on username
    load: function(username) {
    	var key = "CEsettings."+username;
    	chrome.storage.local.get(key, function(o) {
    		console.dir(o);
    		console.log("LOADED");
    		if( !o[key] ) {
    			settings.save(username);
    			return;
    		}
    		var loaded = JSON.parse(o[key]);
    		settings.powerSwitch = loaded.powerSwitch;
	    	settings.messageColors = loaded.messageColors;
	    	settings.lengthMode = loaded.lengthMode;
	    	settings.effectMode = loaded.effectMode;
	    	settings.blendName = loaded.blendName;
	    	settings.atNameColor = loaded.atNameColor;
	    	settings.atNameColorToggle = loaded.atNameColorToggle;
	    	settings.urlColor = loaded.urlColor;
	    	settings.urlColorToggle = loaded.urlColorToggle;
	    	settings.fixedLength = loaded.fixedLength;
    	});
    },
    // save to storage based on username
    save: function(username) {
    	var obj = {};
    	obj["CEsettings."+username] = this.toString();
    	console.dir(obj);
    	console.log("SAVED");
    	chrome.storage.local.set( obj );
    }
}

function outgoingMsg(str) {
	this.blendString = "";
	this.styledMsg = "";
	this.header = "";

	this.lines = {
        str : [],
        toggles : [],
        colorCodes : []
    };

    this.toggles = {
        type: [], // url, @name, emoticon, customFunction
        word: [], // toggled word
        strIndex: [], // index of toggled word
        callback: [], // optional callback function
        reset: function() {
        	this.type 	  = [];
        	this.word 	  =	[];
        	this.strIndex = [];
        	this.callback = [];
        }, 
        checkIndex: function(i) {  // check if current index needs a toggled string
        	
        	return this.strIndex.findIndex( 
        		function(element) {
        			return element==i;
        		}
        	);
        },
        getLength: function() {
        	return this.word.reduce(function(len,cur,i) { 
        		if(cur == "*stripes* ") {
        			len += 28;
        		} 
        		return len += cur.length;
        	}.bind(this ), 0);
        },
        copy: function() {
        	return jQuery.extend( true, {}, this );
        }
    };
    
    this.processFrame = function(str) { 
    	var userMessage;
    	settings.reset();
        
        this.header = rx.find("header",str);
        if( rx.bold.test(str) ) {
            settings.bold = true;
            str = rx.replace("bold",str,"");
        }
        if( rx.italics.test(str) ) {
            settings.italics = true;
            str = rx.replace("italics",str,"");
        }
        if( rx.underline.test(str) ) {
            settings.underline = true;
            str = rx.replace("underline",str,"");
        }
        userMessage = he.decode( rx.replace("outerMessageData",str,"") ).trim();   

        if( settings.blendName && settings.username != "anon" ) {
        	settings.usernameColor = "<n"+settings.messageColors[0].substring(1)+"/>";
        } else if( rx.nameColorTag.test(str) ) {        	
            settings.usernameColor = rx.find("nameColorTag", str);
        }

        settings.userFontSize = "";
        settings.userFontFace = "";

        if ( rx.styleTag.test(str) ) {
            var fontstr = rx.find("styleTag",str);
            
            if( fontstr.indexOf("=") == 12 || fontstr.indexOf("=") == 9 || fontstr.indexOf("=") == 6 ) {
                settings.userFontSize = fontstr.substr(4,2);
            }
            settings.userFontFace = fontstr.substring(fontstr.indexOf("\"")+1,fontstr.length-2);
        }
        return userMessage;
    };

    this.prepareToggles = function(str) {
        var toggles, emoticons;
        
        toggles = [];
        emoticons = [ ":)", ":(", ":|", ":D", "*lol*", ":@",
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

        var fontClose = "</f>";
	    var styleOpen = "";
	    var styleClose = "";
	    var toggleIndex = "";
	    var toggledWord = "";

	    if(settings.bold) {
	        styleOpen += "<b>";
	        styleClose = "</b>"+styleClose;
	    }
	    if(settings.italics) {
	        styleOpen += "<i>";
	        styleClose = "</i>"+styleClose;
	    }
	    if(settings.underline) {
	        styleOpen += "<u>";
	        styleClose = "</u>"+styleClose;
	    }
	    for( var ci = 0; ci < str.length; ci++ ) {
	    	if( str.charAt(ci) == "@" ) {
	    		toggleIndex = ci;
                toggledWord = str.match(rx.tag)[0];

                if( rx.taggedQuote.test(str) ) {
                    toggledWord = str.match(rx.taggedQuote)[0];
                }

                str = str.replace(toggledWord,"~");
            	if( settings.atNameColorToggle ){
                	toggledWord = "<f x"+ settings.userFontSize + settings.atNameColor.substring(1) + "=\""+ settings.userFontFace +"\">"
                				+ styleOpen
								+ " " + toggledWord + " "
								+ styleClose + fontClose;
                } else {
                	toggledWord = styleOpen 
								+ " " + toggledWord + " "
								+ styleClose + fontClose;
                }
	    		this.toggles.type.push("atName");
	            this.toggles.strIndex.push(toggleIndex);
	            this.toggles.word.push(toggledWord);
	            this.toggles.callback.push(false);

	            continue;

	    	} else if( getWordAt(str,ci).match(/^http(s)?:\/\/.+/i) !== null ) {
	    		toggleIndex = ci;
	    		toggledWord = str.match(rx.chUrl)[0];

	    		str = str.replace(rx.chUrl,"~");

            	if( settings.urlColorToggle ){
	            	toggledWord = 
	            		"<f x"+ settings.userFontSize + settings.urlColor.substring(1) + "=\""+ settings.userFontFace +"\">"
						+ styleOpen 
						+ toggledWord
						+ styleClose + fontClose;

	            } else {
	            	toggledWord = 
	            		styleOpen 
						+ toggledWord
						+ styleClose + fontClose;	
	            }
	            this.toggles.type.push("url");
                this.toggles.strIndex.push( toggleIndex );
                this.toggles.word.push(toggledWord);
                this.toggles.callback.push(false); 

                continue;               
	    	} else {
	    		toggledWord = getWordAt(str,ci);
            	toggleIndex = ci;
            	var ematch;
                for( e = 0; e < emoticons.length; e++) {                	
                	ematch = new RegExp("^" + emoticons[e].replace( rx.escapeChars, "\\$&") );

                    if( toggledWord.match(ematch)) {					
						str = str.replace( toggledWord , "~" );
                        if(toggledWord == "><> ") {
                            toggledWord = "&gt;&lt;&gt; ";
                        }

                        this.toggles.type.push("emoticon");
                        this.toggles.strIndex.push(toggleIndex);
                        this.toggles.word.push(toggledWord);
                        this.toggles.callback.push(false);
                        break;
                    }
                }
                
                if( this.toggles.type[ci] == "emoticon" )  { continue; }
                // else { (ci+toggledWord.length <=) ? ci += toggledWord.length : ;  }

            }

	    }
        return str.trim();

    }; // end of method

    this.calculateResolution = function( str ) {
    	if( settings.lengthMode == "word" ) { // per word blending requires high resolution
    		return;
    	}
    	var tagLength, maxTags, styledLength, styleOpen, styleClose, fontOpen, fontClose, resolution;
    	resolution = 1;

    	styleOpen = "";
    	styleClose = "";
    	fontOpen = "<f x"+ settings.userFontSize + "ffffff" + "=\""+ settings.userFontFace +"\">"; // needed for tag length
	    fontClose = "</f>";

    	if(settings.bold) {
	        styleOpen += "<b>";
	        styleClose = "</b>"+styleClose;
	    }
	    if(settings.italics) {
	        styleOpen += "<i>";
	        styleClose = "</i>"+styleClose;
	    }
	    if(settings.underline) {
	        styleOpen += "<u>";
	        styleClose = "</u>"+styleClose;
	    }
	    tagLength = (fontOpen+styleOpen+styleClose+fontClose).length;
	    styledLength =  this.header.length
	    		+ settings.usernameColor.length
	    		+ str.length
	    		+ ( tagLength * Math.ceil(str.length) )
	    		+ (this.toggles.getLength());

	    if( styledLength > settings.msgMaxLength ) {
	    	console.dir("hmmm");
    		maxTags = Math.ceil( 
	    		( settings.msgMaxLength 
	    		- str.length 
	    		- this.header.length 
	    		- settings.usernameColor.length
	    		- 150) 
	    	/ tagLength );
	    	resolution = Math.ceil( str.length / maxTags );
    	}

    	settings.resolution = resolution;
    }

    this.blendWords = function(str) {
	    var c = settings.messageColors;
	    var intFunc = d3.interpolateRgbBasis(c);
	    var words = str.split(" ");
	    var intP = 0;
	    
	    var fnColorCodes = [];
	    for( var wi = 0; wi < words.length; wi++ ) {
	        for( var ci = 0; ci < words[wi].length; ci++) {	            
	            if(ci == words[wi].length-1) {
	            	intP = 1;
	            } else {
	            	intP = ci/words[wi].length;
	            }
	            fnColorCodes.push( rgb2hex( intFunc( intP )));
	        }
	        fnColorCodes.push("");
	    }
	    return fnColorCodes;
	};

	this.blendFixed = function( blendStr, origStr ) {
	    var c = settings.messageColors;
	    var intFunc = d3.interpolateRgbBasis(c);
	      
	    var fnColorCodes = [];
	    // Todo: calculate length based on pixel width.  wrap each character in correctly styled span and use width 
	    var processedStr = "";
	    var width = 0;
	    var intP = 0;
	    var bi = 0;

	    var ti = "";
	    var tlength = 0;

	    while(1) { // repeat fixed length loop until there are enough color codes
	    	processedStr = "";
	    	for( var fi = 0, width = 0; width <= settings.fixedLength; fi++, bi++) {
	    		if( fnColorCodes.length == blendStr.length ) { 
	    			return fnColorCodes; // return the function immediately when color code array is full
	    			console.log("returned");
	    		}
	    		if(blendStr.charAt(fi) == "~" && this.toggles.checkIndex( fnColorCodes.length ) > -1) {
	    			if(this.toggles.type == "emoticon") {
	    				width = getWidthOfText( processedStr )
	    				+ 30;
	    			} else {
						width = getWidthOfText( processedStr )
						+ ( Math.floor( getWidthOfText(origStr.substring( bi, origStr.indexOf(" ",bi) ))/2) );
	    			}
	    			
	    			processedStr += origStr.substring(bi, origStr.indexOf(" ",bi));
	    			origStr.replace(origStr.substring(bi, origStr.indexOf(" ",bi)), "~");
	    			
	    		} else {
	    			processedStr += blendStr.charAt(fnColorCodes.length);
	    			width = getWidthOfText( processedStr );
	    		}
	      		if(width > settings.fixedLength) {
	      			width = width % settings.fixedLength;
	      		}
	      		if( fnColorCodes.length+1!=blendStr.length && (width+getWidthOfText( blendString.charAt(fi+1) )) > settings.fixedLength ) {
	      			intP = 1;
	      		} else {
	      			intP = width/settings.fixedLength;
	      		}
	      		
	            fnColorCodes.push( rgb2hex( intFunc( intP )));
	        }
	    }
	};

	this.blendFull = function(str) {
	    var c = settings.messageColors;
	    var intFunc = d3.interpolateRgbBasis(c);

	    var fnColorCodes = [];

	    for( var ci = 0; ci < str.length; ci++ ) {
	        var intP = ci/str.length;
	        if( ci == str.length-1 ) { intP = 1; }
	        fnColorCodes.push( rgb2hex(intFunc( intP )) );
	    } 
	    return fnColorCodes;
	};

	this.applyColors = function(str, colorCodes) {
		var nmsg, fontOpen, fontClose, styleOpen, styleClose, resolution, toggleIndex, tagLength, styledLength;
	    
	    nmsg = "";
	    fontOpen = ""; 
	    fontClose = "</f>";
	    styleOpen = "";
	    styleClose = "";
	    toggleIndex = 0;
	    resolution = settings.resolution;

	    for( var si = 0; si < str.length || si == 0; si++ ) {
	    	fontOpen = ""; // blank style tags by default

	    	// process toggled strings into message
	    	toggleIndex = this.toggles.checkIndex(si);
	    	if( str.charAt(si) == "~" && toggleIndex > -1 ) {
	    		if( si > 0 && resolution > 1 && !/<\/[u|i|b|f]>$/.test(str) ) {  // check if last tags are closed out or not
	    			nmsg += styleClose + fontClose;	    			
		    	}
		    	if( (this.toggles.type[toggleIndex] == "atName" || this.toggles.type[toggleIndex] == "url") 
		    		&& ( /<\/f>$/.test(this.toggles.word[toggleIndex]) && !/^<f x/.test(this.toggles.word[toggleIndex]) ) ) {
		    		console.log("url dynamic coloring");
		    		this.toggles.word[toggleIndex] = "<f x"+ settings.userFontSize + colorCodes[si].substring(1) + "=\"" + settings.userFontFace +"\">" + this.toggles.word[toggleIndex];
		    	} else if( /\*stripes\*[^?]?/.test(this.toggles.word[toggleIndex]) ){
		            // special coloring for blank *stripes*
		            if (si == 0) {
		                nmsg += "*stripes*?"
		                    + colorCodes[si] + ","
		                    + colorCodes[si+1] + ":90:1 ";
		            } else if (si == (str.length-1)) {
		                nmsg += "*stripes*?"
		                + colorCodes[si-1] + ","
		                + colorCodes[si] + ":90:1 ";
		            } else {
		                nmsg += "*stripes*?"
		                + colorCodes[si-1] + ","
		                + colorCodes[si] + ","
		                + colorCodes[si+1] + ":90:1 ";
		            }
		            continue;
		        }

		        nmsg += this.toggles.word[ toggleIndex ];
	    		 
    		//  todo emoji support AGAIN
    		//  move emoji support into preparetoggles
    		//  inject codepoints at index
    		//  BROKEN CODE DO NOT USE AS IS
    		//  else if(msg.codePointAt(bi) > 65536 ) { // rudimentary emoji support  
	    	//  	nmsg += colorCode + String.fromCodePoint(msg.codePointAt(bi));
	     	//  }

	     		// reopen color tags if they're not going to be 	    		
	    		if( resolution > 1 && ((si+1) % resolution) != 0 && ( si != str.length-1)  )  {
	    			nmsg += "<f x"+ settings.userFontSize + colorCodes[si].substring(1) + "=\""+ settings.userFontFace +"\">"
							+ styleOpen;
	    		}
	    		continue;
	    	} // end toggled string processing 

	    	if( ((si % resolution) == 0 || ( si == str.length-1 )) ) { // set font tag according to resolution
	    		nmsg += "<f x"+ settings.userFontSize + colorCodes[si].substring(1) + "=\""+ settings.userFontFace +"\">"
	    			+ styleOpen;
	    	} 
	    	nmsg += he.encode( str.charAt(si) );
	    	if( si > 0 && ( ((si+1) % resolution) == 0 || ( si == str.length-1 ) || ( si == str.length-2 && (si+1)%resolution !=0) ) ) { // close tags according to resolution
	    		nmsg += styleClose + fontClose;
	    	} 
	    }
	    return nmsg;
	}
	//////////////////////////
	// constructor code here 
	//////////////////////////
	var blendString, userMessage, colorCodes;

	userMessage = this.processFrame(str);
	this.calculateResolution(userMessage);
	// multiline detection
    if( str.match(rx.lineBreak) !== null ) { 
    	var lines, toggles, colorCodes, styledMsg;
    	lines = userMessage.split("<br/>");

        for (var li = 0; li < lines.length; li++) {
        	
        	this.lines.str.push( this.prepareToggles( lines[li]) );
        	
            this.lines.toggles.push( this.toggles.copy() );            
            if( this.lines.str[li].length <= 1 ) { colorCodes = settings.messageColors }
		    else switch(settings.lengthMode) {
		        case "full" : 
		            colorCodes = this.blendFull( this.lines.str[li] );
		            break;
		        case "fixed" :
		            colorCodes = this.blendFixed( this.lines.str[li] , lines[li]);
		            break;
		        case "word" : 
		            colorCodes = this.blendWords( this.lines.str[li] );
		            break;
	    	}
	    	this.lines.colorCodes.push(colorCodes);
	    	this.toggles.reset();
        }
        styledMsg = this.header + settings.usernameColor;
        for (li = 0; li < this.lines.str.length; li++) {

        	this.toggles = this.lines.toggles[li].copy();
	    	if( li > 0 ) {
	    		styledMsg += " <br/> "; 
	    	}
        	styledMsg += this.applyColors(this.lines.str[li], this.lines.colorCodes[li]);
        }
        styledMsg += "\r\n";
        this.styledMsg = styledMsg;
    } else {
        blendString = this.prepareToggles(userMessage);
        
        if( blendString.length == 1 ) { colorCodes = settings.messageColors }
	    else switch(settings.lengthMode) {
	        case "full" : 
	            colorCodes = this.blendFull(blendString);
	            break;
	        case "fixed" :
	            colorCodes = this.blendFixed(blendString, userMessage);
	            break;
	        case "word" : 
	            colorCodes = this.blendWords(blendString);
	            break;
    	}
        this.styledMsg = this.header + settings.usernameColor + this.applyColors(blendString, colorCodes) + "\r\n";
    }
}

function calculateFontSize(fontSize) {
	defaultSize = 12.8;
	var str  = "";
	switch(fontSize) {		
		case "9": 
		str = (defaultSize * 0.82).toString() + "px";
		break;
		case "10": 
		str = (defaultSize * 0.91).toString() + "px";
		break;
		case "12": 
		str = (defaultSize * 1.09).toString() + "px";
		break;
		case "13": 
		str = (defaultSize * 1.18).toString() + "px";
		break;
		case "14": 
		str = (defaultSize * 1.27).toString() + "px";
		break;
		case "15": 
		str = (defaultSize * 1.36).toString() + "px";
		break;
		case "16": 
		str = (defaultSize * 1.45).toString() + "px";
		break;
		case "17": 
		str = (defaultSize * 1.55).toString() + "px";
		break;
		case "18": 
		str = (defaultSize * 1.64).toString() + "px";
		break;
		case "19": 
		str = (defaultSize * 1.73).toString() + "px";
		break;
		case "20": 
		str = (defaultSize * 1.82).toString() + "px";
		break;
		case "21": 
		str = (defaultSize * 1.91).toString() + "px";
		break;
		case "22": 
		str = (defaultSize * 2).toString() + "px";
		break;		
		default: 
		str = defaultSize.toString() + "px";
		break;
	}
	return str;
}

function getFontFaceName(fontface) {
	
	switch(fontface) {
		case "1":
			return "'Comic Sans', 'Comic Sans MS', sans-serif";
			break;
		case "2":
			return "Georgia, serif"
			break;
		case "3":
			return "'Lucida Handwriting', Zapfino, Chalkduster, cursive";
			break;
		case "4":
			return "Impact, sans-serif"
			break;
		case "5":
			return "Palatino, serif"
			break;
		case "6":
			return "Papyrus, cursive"
			break;
		default: 
			return "Arial, sans-serif";
			break;
	}
}

function getWidthOfText(txt){
	var el = document.getElementById("dummy");
	var fontsize = calculateFontSize(settings.userFontSize);
	var fontname = getFontFaceName(settings.userFontFace);
    if(el.style.fontSize != fontsize) el.style.fontSize = fontsize;
    if(el.style.fontFamily != fontname) el.style.fontFamily = fontname;
    el.innerHTML = txt;
    return el.offsetWidth;    
}

function rgb2hex(rgb){
    rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    return (rgb && rgb.length === 4) ? "#" +
        ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
}

function getWordAt(str, pos) {

    // Perform type conversions.
    str = String(str);
    pos = Number(pos) >>> 0;

    // Search for the word's beginning and end.
    var left = str.slice(0, pos + 1).search(/\S+$/),
        right = str.slice(pos).search(/\s/);

    // The last word in the string is a special case.
    if (right < 0) {
        return str.slice(left);
    }

    // Return the word, using the located bounds to extract it from the string.
    return str.slice(left, right + pos);

}
