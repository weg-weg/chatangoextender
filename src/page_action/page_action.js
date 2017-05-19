var settings = {
    messageColors: [ "#FF0000","#FFFF00","#00FF00","#00FFFF","#0000FF", "#FF0000","#FFFF00","#00FF00","#00FFFF","#0000FF"],
    //                 //"#FF0000","#FFFF00","#00FF00","#00FFFF","#0000FF","#FF0000","#FFFF00","#00FF00","#00FFFF","#0000FF" ]
    // lengthMode: "word"
}

var readyStateCheckInterval = setInterval(function() {
    if (document.readyState === "complete" && window.jQuery) {
        clearInterval(readyStateCheckInterval);        
        // ----------------------------------------------------------
        // This part of the script triggers when page is done loading
        // ----------------------------------------------------------
        getSettings();
    }   // ----------------------------------------------------------

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
}, 10);

function changeSetting(setting, value) {
    settings[setting] = value;
    chrome.runtime.sendMessage({
        changeSetting : setting,
        newValue: value
    }, function(response) {
        // do somethign with response maybe? meh
    });
}

function getSettings() {
    chrome.runtime.sendMessage({getSettings: true}, function(response) {
        settings = JSON.parse(response.settings);
        initForm();
    });
}

function initForm() {
    $(function() { // init form
        //currently unused

        $("#previewContainer").css("display","none");            
        $("#blendModeContainer").css("display","none");

        $(".colorPickerContainer").each( function(i,el){                
            if(i < settings.messageColors.length) {
                $(el).find(".colorPicker").attr("value",settings.messageColors[i]);
                $(el).show(); //css("display","inline-block");
            } else if( $(el).parents("#colorControlsContainer").length > 0 ) {
                $(el).hide(); //css("display","none");
            }
        });

        $("#add").click(function() {
            console.log("hmm");                
            if(settings.messageColors.length == 19) { 
                $("#add").css("visibility","hidden");
            } else if (settings.messageColors.length == 1) {
                $("#sub").css("visibility","visible");
            }
            settings.messageColors.push("");
            var newPicker = $("#cPicker"+settings.messageColors.length);
            newPicker.parents(".colorPickerContainer").show();
            settings.messageColors[settings.messageColors.length-1] = newPicker.val();
            changeSetting("add", newPicker.val());
        });

        $("#sub").click(function() {
            if(settings.messageColors.length == 2) { 
                $("#sub").css("visibility","hidden");
            } else if (settings.messageColors.length == 20) {
                $("#add").css("visibility","visible");
            }
            var oldPicker = $("#cPicker"+settings.messageColors.length);
            oldPicker.parents(".colorPickerContainer").hide();
            settings.messageColors.pop();
            changeSetting("sub", 1);
        });

        $("#lengthModeSelect").change(function(e) {
            var value = $(e.target).val();
            if(value=="fixed"){
                $("#fixedLengthInput, #fixedLengthTitle").show();
            } else {
                $("#fixedLengthInput, #fixedLengthTitle").hide();
            }
            changeSetting("lengthMode", value);
        }).val(settings.lengthMode);
        if(settings.lengthMode != "fixed") {
            $("#fixedLengthInput, #fixedLengthTitle").hide();
        }

        $("#fixedLengthInput").change(function(e){
            changeSetting("fixedLength", $(e.target).val());
        });

        $("#blendNameToggle").change(function(e){
            changeSetting("blendName", e.target.checked);
        }); 
        if( settings.blendName ) {
             $("#blendNameToggle")[0].checked = true;
        } 

        $("#atNameColorToggle").change(function(e){
            changeSetting("atNameColorToggle", e.target.checked);
        });
        if( settings.atNameColorToggle ) {
             $("#atNameColorToggle")[0].checked = true;
        } 

        $("#urlColorToggle").change(function(e){
            changeSetting("urlColorToggle", e.target.checked);
        });
        if( settings.urlColorToggle ) {
             $("#urlColorToggle")[0].checked = true;
        }

        $("#powerButton").click(function(e){
            if(settings.powerSwitch) {                    
                $(e.target).toggleClass("off");
                $(e.target).toggleClass("on");
                settings.powerSwitch = false;
                changeSetting("powerSwitch", false);
            } else {                   
                $(e.target).toggleClass("off");
                $(e.target).toggleClass("on");
                settings.powerSwitch = true;
                changeSetting("powerSwitch", true);
            }
        })

    })

    $(function() {
        var count = 1;  // event double firing fix

        $(".colorPicker").minicolors({
            control: 'hue',
            defaultValue: '#FF0000',     
            letterCase: 'lowercase',
            position: 'bottom right',
            swatches: [],
            show: function() {
                $(this).closest(".colorPickerContainer").find(".pickerTextInput").attr("value",this.value);
            },
            hide: function() {
                if(count > 1) { count=1; return; } 
                count++;  // prevents jquery double event bug 

                var colorId = $(this).attr("id").substring(7);
                if($(this).parents("#colorControlsContainer") > 0) {
                    changeSetting("messageColors"+colorId, this.value);
                } else if($(this).parents("#atNameColorContainer") > 0) {
                    changeSetting("atNameColor" , this.value);
                } else if($(this).parents("#urlColorContainer") > 0) {
                    changeSetting("urlColor" , this.value);
                }
            },
            change: function(hex,alpha) {
                $(this).parent().find(".pickerTextInput").attr("value",hex);
            }
        });
        $(".minicolors-panel").append(
            $("<input class=\"pickerTextInput\" type=\"text\" length=\"10\">")                
            .change(function(e){
                $(e.target).parent().find(".colorPicker").attr("value")
            }) 
            );
    });
}