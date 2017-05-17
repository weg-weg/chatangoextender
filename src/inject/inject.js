chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);

		// ----------------------------------------------------------
		// This part of the script triggers when page is done loading

		
		// ----------------------------------------------------------

	}
	}, 10);
});

if(document.domain == "st.chatango.com") {

	// var icon = chrome.extension.getURL("icons/icon16.png");
	var di = document.createElement('script');
	di.textContent = "var ccicon = \"" + chrome.extension.getURL("icons/icon16.png") + "\";";	
	(document.head||document.documentElement).appendChild(di);
	di.remove();

	var ei = document.createElement('script');
	ei.textContent = "var rtid = \"" + chrome.runtime.id + "\";";	
	(document.head||document.documentElement).appendChild(ei);
	ei.remove();
	
	
	var jq = document.createElement('script');	
	jq.src = chrome.extension.getURL('js/jquery.min.js');
	jq.onload = function () {		
		this.remove();
	};
	(document.head || document.documentElement).appendChild(jq);

	var dtc = document.createElement('script');	
	dtc.src = "https://d3js.org/d3-color.v1.min.js";
	dtc.onload = function () {
		this.remove();
	};
	(document.head || document.documentElement).appendChild(dtc);

	var dti = document.createElement('script');    
	dti.src = "https://d3js.org/d3-interpolate.v1.min.js";
	dti.onload = function () {
		this.remove();
	};	
	(document.head || document.documentElement).appendChild(dti);

	var spec = document.createElement('script');	
	spec.src = chrome.extension.getURL('js/spectrum.js');
	spec.onload = function () {
		this.remove();
	};
	(document.head || document.documentElement).appendChild(spec);

	var sps = document.createElement('link');	
	sps.setAttribute("rel","stylesheet");
	sps.setAttribute("href", chrome.extension.getURL('js/spectrum.css'));
	(document.head || document.documentElement).appendChild(sps);
	sps.remove();

	var s = document.createElement('script');
	s.src = chrome.extension.getURL('js/cc.js');
	s.onload = function() {
	    this.remove();
	};
	(document.head || document.documentElement).appendChild(s);


}

