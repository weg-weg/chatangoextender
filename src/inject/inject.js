if(document.domain == "st.chatango.com") {

	// inject runtime id of extension for message passing
	var ei = document.createElement('script'); 
	ei.textContent = "var rtid = \"" + chrome.runtime.id + "\";";	
	(document.head||document.documentElement).appendChild(ei);
	ei.remove();

	// jquery for future updates
	var jq = document.createElement('script');	
	jq.src = chrome.extension.getURL('js/jquery.min.js');
	jq.onload = function () {		
		this.remove();
	};
	(document.head || document.documentElement).appendChild(jq);

	// for message passing to the websocket object
	var s = document.createElement('script');
	s.src = chrome.extension.getURL('js/cc.js');
	s.onload = function() {
	    this.remove();
	};
	(document.head || document.documentElement).appendChild(s);


}

