// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });

chrome.extension.onMessageExternal.addListener(
	function(request, sender, sendResponse) {
		
		if( request.greeting !== undefined ) { // page loaded			 			
			chrome.pageAction.show(sender.tab.id);
			sendResponse({ ceLoad : "true" });		
		} else if( request.chMsg !== undefined ) { // user sent message 
			
			////////////////
			// console.dir(request.chMsg);
			var om = new outgoingMsg( request.chMsg );
			console.log(om.styledMsg);
			sendResponse({ styledMsg : "~" + om.styledMsg });
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
			if(request.changeSetting.match("messageColors")) {
				settings.messageColors[request.changeSetting.substring(13)] = request.value;
			} else if( request.changeSetting == "add"){
				settings.messageColors.push(request.value) ;
			} else if( request.changeSetting == "sub"){
				settings.messageColors.pop();
			} else {
				settings[request.changeSetting] = request.value;
			}
			sendResponse({ result: "true"});
		} else if ( request.getSettings !== undefined ) {
			sendResponse({ settings: settings.toString()});
		}
	});

window.onload = function() {
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

var settings = {  // set to default values
    
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
    fixedLength: 7,
    resolution: 1,
    msgMaxLength: 2900,

    // following values pulled from existing chatango settings 
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
		    lengthMode: settings.lengthMode,
		    effectMode: settings.effectMode,
		    blendName: settings.blendName,
		    atNameColor: settings.atNameColor,
		    atNameColorToggle: settings.atNameColorToggle,
		    urlColor: settings.urlColor,
		    urlColorToggle: settings.urlColorToggle,
		    fixedLength: settings.fixedLength
    	});
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

        if( rx.nameColorTag.test(str) ) {        	
            settings.usernameColor = rx.find("nameColorTag", str);
        } 
        if( settings.blendName = true ) {
        	settings.usernameColor = "<n"+settings.messageColors[0].substring(1)+"/>";
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
            	if(settings.atNameColorToggle=="on"){
                	toggledWord = "<f x"+ settings.userFontSize + settings.atNameColor.substring(1) + "=\""+ settings.userFontFace +"\">"
                				+ styleOpen 
								+ toggledWord
								+ styleClose + fontClose;
                } else {
                	toggledWord = styleOpen 
								+ toggledWord
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

            	if(settings.urlColorToggle=="on"){
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

    this.calculateResolution = function(str) {
    	if(settings.lengthMode != "full") {
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
	    var blendWords = str.split(" ");
	    
	    var fnColorCodes = [];
	    for( var wi = 0; wi < blendWords.length; wi++ ) {
	        for( var ci = 0; ci < blendWords[wi].length; ci++) {
	            var intP = ci/blendWords[wi].length;
	            if( ci == blendWords[wi].length-1 ) { intP = 1; }
	            fnColorCodes.push( rgb2hex( intFunc( intP )));
	        }
	        fnColorCodes.push("");
	    }
	    return fnColorCodes;
	};

	this.blendFixed = function(str) {
	    var c = settings.messageColors;
	    var intFunc = d3.interpolateRgbBasis(c);
	      
	    var fnColorCodes = [];
	    // Todo: calculate length based on pixel width.  wrap each character in correctly styled span and use width 
	    
	    var ti = "";
	    var tlength = 0;

	    while(1) {
	    	for( var fi = 0; fi < settings.fixedLength; fi++) {
	    		// repeat fixed length loop until there are enough color codes
	    		if( fnColorCodes.length == str.length ) {
	    			return fnColorCodes;
	    		}

	    		// account for toggled word lengths

	    		ti = this.toggles.checkIndex( fnColorCodes.length );
	        	if( ti > -1 ) { 
	        		// todo: youtube video thumb width
	        		// todo: image thumb width 
	        		if(this.toggles.type[ti] == emoji ) {
	        			tlength = 1; // todo: pixel width of emoji
	        		} else {
	        			tlength = this.toggles.word[ti].length;	
	        		}
	        		fi += ( tlength % settings.fixedLength );

	        		if( fi >= settings.fixedLength ) {
	        			fi =- settings.fixedLength;
	        		} 
	        	}
	            var intP = fi/settings.fixedLength;
	            if( fi == settings.fixedLength-1 ) { intP = 1; }
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
		    		&& ( /^<?[^f x].+<\/f>$/.test(this.toggles.word[toggleIndex]) ) ) {
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
		            colorCodes = this.blendFixed( this.lines.str[li] );
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
	            colorCodes = this.blendFixed(blendString);
	            break;
	        case "word" : 
	            colorCodes = this.blendWords(blendString);
	            break;
    	}

        this.styledMsg = this.header + settings.usernameColor + this.applyColors(blendString, colorCodes) + "\r\n";
    }
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
