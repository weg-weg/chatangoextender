
var readyStateCheckInterval = setInterval(function() {
    if (document.readyState === "complete" && window.jQuery) {
        clearInterval(readyStateCheckInterval);        
        // ----------------------------------------------------------
        // This part of the script triggers when page is done loading
        // ----------------------------------------------------------        
        $(function() {
            $(".colorPicker").minicolors({
                control: $(this).attr('data-control') || 'hue',
                defaultValue: $(this).attr('data-defaultValue') || '',
                format: $(this).attr('data-format') || 'hex',                
                letterCase: $(this).attr('data-letterCase') || 'lowercase',
                opacity: $(this).attr('data-opacity'),
                position: $(this).attr('data-position') || 'bottom right',
                swatches: $(this).attr('data-swatches') ? $(this).attr('data-swatches').split('|') : [],
                change: function(hex, opacity) {
                  var log;
                  try {
                    log = hex ? hex : 'transparent';
                    if( opacity ) log += ', ' + opacity;
                    console.log(log);
                  } catch(e) {}
                },
                theme: 'default'
            });
        });

    }   // ----------------------------------------------------------
}, 10);