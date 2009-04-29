{
	"translatorID":"c159dcfe-8a53-4301-a499-30f6549c340d",
	"translatorType":4,
	"label":"DOI",
	"creator":"Simon Kornblith",
	"target":null,
	"minVersion":"1.0.10",
	"maxVersion":"",
	"priority":300,
	"inRepository":true,
	"lastUpdated":"2009-04-07 15:48:00"
}

//var DOIre = /(doi:)?\s*(10\.[\w.]+\/[^\/\s]+)/ig;
var DOIre = /doi:\s*(10\.[\w.]+\/[^\/\s]+)/ig;

var items = {};
var selectArray = {};

function detectWeb(doc, url) {
	var m1 = DOIre.exec(doc.documentElement.textContent);
	var m2 = DOIre.exec(doc.documentElement.textContent);
	if(m1 && m2) {
		return "multiple";
	} else if(m1) {
		return "journalArticle";
	}
}

function retrieveNextDOI(DOIs, doc) {
	if(DOIs.length) {
		// retrieve DOI
		var DOI = DOIs.shift();
		var translate = Zotero.loadTranslator("search");
		translate.setTranslator("11645bd1-0420-45c1-badb-53fb41eeb753");
		var item = {"itemType":"journalArticle", "DOI":DOI};
		translate.setSearch(item);
		// don't save when item is done
		translate.setHandler("itemDone", function(translate, item) {
			item.repository = "CrossRef";
			items[DOI] = item;
			selectArray[DOI] = item.title;
		});
		translate.setHandler("done", function(translate) {
			retrieveNextDOI(DOIs, doc);
		});
		translate.translate();
	} else {
		// all DOIs retrieved now
		// check to see if there is more than one DOI
		var numDOIs = 0;
		for(var DOI in selectArray) {
			numDOIs++;
			if(numDOIs == 2) break;
		}
		if(numDOIs == 0) {
			throw "DOI Translator: could not find DOI";
		} else if(numDOIs == 1) {
			// do we want to add URL of the page?
			items[DOI].url = doc.location.href;
			items[DOI].attachments = [{document:doc}];
			items[DOI].complete();
		} else {
			selectArray = Zotero.selectItems(selectArray);
			for(var DOI in selectArray) {
				items[DOI].complete();
			}
		}
		Zotero.done();
	}
}

function doWeb(doc, url) {
	// build a list of DOIs
	DOIre.lastMatch = 0;
	DOIs = [];
	while((m = DOIre.exec(doc.documentElement.textContent))) {
		var DOI = m[1];
		if(DOI.substr(-1) == ")" && DOI.indexOf("(") == -1) {
			DOI = DOI.substr(0, DOI.length-1);
		}
		DOIs.push(DOI);
	}
	
	// retrieve full items asynchronously
	Zotero.wait();
	retrieveNextDOI(DOIs, doc);
}