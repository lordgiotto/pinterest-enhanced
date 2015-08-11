//////////////////////////////////////////////
//				   CONTSNTS 				//
//////////////////////////////////////////////

var LAST_VERSION = "1.5.1"

var defaults = {
	"pin_grid" : "ON",
	"pin_grid_fixed" : "ON",
	"pin_grid_height" : "400",
	"pin_grid_scroll" : "ON",
	"pin_grid_center" : "ON",
	"pin_grid_notify" : "ON",
	"pin_grid_desc" : "ON",
	"pin_grid_extra" : "ON",
	"pin_grid_version" : "NONE"
}

//////////////////////////////////////////////
//				    HELPERS 				//
//////////////////////////////////////////////

function toggleStatus() {
	var status = localStorage["pin_grid"];
	localStorage["pin_grid"] = (status == "ON") ? "OFF" : "ON";	
}

function getOption(name) {
	var option = localStorage[name];
	if (option) {
		return option;
	} else {
		console.log(name);
		localStorage[name] = defaults[name];
		return localStorage[name];
	}
}

function getHeight() {
	return getOption('pin_grid_height') - 50;
}

//////////////////////////////////////////////
//				   Messages 				//
//////////////////////////////////////////////

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.method == "getHeight") {
		sendResponse({ status : getHeight() });
	} else if (request.method == "activedExtra") {
		sendResponse({status : getOption('pin_grid_extra') == 'ON' })
	} else {
		sendResponse({});
	}
});

//////////////////////////////////////////////
//					  MAIN  				//
//////////////////////////////////////////////

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if ((tab.url && tab.url.match("[\S]*\.pinterest\.com").length != 0 )) {
		var actived = getOption('pin_grid') == "ON";
		var fixed = getOption('pin_grid_fixed') == "ON";
		var height = getHeight()
		var scroll = getOption('pin_grid_scroll') == "ON";
		var center = getOption('pin_grid_center') == "ON";
		var hide_desc = getOption('pin_grid_desc') == "ON";
		var extra = getOption('pin_grid_extra') == "ON";
		if (changeInfo.status == "loading") {


	        if ( actived ){
	        	if( fixed ){
		        	chrome.tabs.insertCSS(tab.id, {file : "css/pinGrid.css", runAt: "document_start"});
		        	chrome.tabs.insertCSS(tab.id, {code : ".pinWrapper, .UserNews, .SearchScopeSelector .gridItem, .FeedUsers .UserBase.gridItem { height: " + height  + "px !important; }", runAt: "document_start"});
		        	if (scroll) {
		        		chrome.tabs.insertCSS(tab.id, {code : "@-webkit-keyframes slideAll { 0% { transform: translateY(-" + height + "px); top: " + height + "px; } 100% { transform: translateY(-100%); top: " + height + "px; } }", runAt: "document_start"});
		        	};
		        	if (center) {
		        		chrome.tabs.insertCSS(tab.id, {code : ".item.ext_smaller .Pin.summary .pinImageWrapper .pinImg { position: absolute; top: 0; bottom: 0; margin: auto; height: auto; }", runAt: "document_start"});
		        	};
		        	if (hide_desc) {
		        		chrome.tabs.insertCSS(tab.id, {code : ".Pin.summary .pinWrapper .pinMeta { transform: translateY(100%); } .Pin.summary .pinWrapper .pinMeta:hover { transform: translateY(0); } .Pin.summary .pinWrapper .pinMeta:after { display: block !important;}", runAt: "document_start"});
		        	};
	        	}
	        	if ( extra ) {
		        	chrome.tabs.insertCSS(tab.id, {file : "css/extraDownload.css", runAt: "document_start"});
	        	};
	        	chrome.pageAction.setIcon({tabId: tabId, path:"img/iconON.png"});
	        	chrome.pageAction.setTitle({tabId: tabId, title:chrome.i18n.getMessage("ON")});
	        } else {
	        	chrome.pageAction.setIcon({tabId: tabId, path:"img/iconOFF.png"});
	        	chrome.pageAction.setTitle({tabId: tabId, title:chrome.i18n.getMessage("OFF")});
	        };
	        chrome.pageAction.show(tabId);
		} else if (changeInfo.status == "complete") {
			window.addEventListener("storage",function(e) {
				chrome.tabs.reload(tab.id);
			},true);

			if ( actived ) {
        		chrome.tabs.executeScript(tab.id, { file: "js/inject.js", runAt: "document_start"});
        	}

		};
    }
});


chrome.pageAction.onClicked.addListener(function(tab) {
	if (getOption('pin_grid') == "ON") {
		chrome.tabs.create({url: "options.html"});
	} else {
		toggleStatus();
		chrome.tabs.reload(tab.id);
	}
});



//////////////////////////////////////////////
//				 Version Check 				//
//////////////////////////////////////////////

function checkUpdated() {
	if ( getOption('pin_grid_notify') == "OFF" ) {
		console.log('Notify Disabled: set last version!')
		localStorage['pin_grid_version'] = LAST_VERSION;
	};
	return getOption('pin_grid_version') != LAST_VERSION;
}

if ( checkUpdated() ) {
	var notifyOption = {
		type : "basic",
		iconUrl : "img/icon.png",
		title : "Pinterest Enhanced Updated - " + LAST_VERSION,
		message : "New version of Pinterest Enhanced installed. ",
		buttons : [ {title : "See what's new!"}, {title : "Discard"} ],
		isClickable : false
	};

	chrome.notifications.create("", notifyOption, function(id) {});

	chrome.notifications.onButtonClicked.addListener(function(id, button) {
		if (button == 0 ) {
			chrome.tabs.create({url: "options.html#changelog"});
			localStorage['pin_grid_version'] = LAST_VERSION;
		} else if ( button == 1) {}; {
			chrome.notifications.clear(id, function(id) {} );
			localStorage['pin_grid_version'] = LAST_VERSION;
		}
	})
};
