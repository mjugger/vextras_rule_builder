(function(){
	"use strict";
	//main entry point of app.
	function constructor(props){
		if(!(this instanceof constructor)) {
			throw 'queryBuilder must be constructed with new.';
		}
		//private properties (uninheritable)
		this.properties = {
			injectSpot:'#injectSite',
			categorySelect:'#categorySelect',
			configFilePath:'configFile.json',
			savedValsFilePath:null,
			startWith:3,//the amount of rules to start with when instantiated.
			configJson:null,//holds the value of the config file once retrieved.
			savedVals:null,//values that were saved to the server in json format.
			saveState:{},//an object for temporarily saving state of added rules and values.
			ruleCache:[],//saves each rule block fo later manipulation
			thirdFields:{}//stores the elements from the json file that the select dropdown switches between
		}
		this.assignProperties(props);
		this.assembler();
	}

	//method works in conjunction with the contructor to build the app
	//while keeping the constructor lightweight and clean.
	constructor.prototype.assembler = function(){
		//saves the scope of "this" from the main app.
		var me = this;

		var category = document.querySelector(this.properties.categorySelect);
		this.properties.currentCategory = category.value.toLowerCase();

		//grabs the el to inject into from the dom and re-assigns it to the injectSpot prop.
		this.properties.injectSpot = document.querySelector(this.properties.injectSpot);

		//retrieve the main field config file.
		this.fetchJson(this.properties.configFilePath,function(data){
			me.properties.configJson = data;
			//retrieve the saved values file.
			if(me.properties.savedValsFilePath){
				me.fetchJson(me.properties.savedValsFilePath,function(data){
					me.properties.savedVals = data;
					//creates the ui.
					me.readSavedValues(me.properties.savedVals.savedValues[me.properties.currentCategory]);
				});
			}else{
				//creates the ui.
				me.startWith();
			}
		});

		this.assignEvents(category,{
			change:function(){
				var catVal = category.value.toLowerCase();
				me.properties.currentCategory = catVal;
				me.removeRuleUi();
				me.buildUi();
			}
		},false);
	}

	//assigns new properties to the "properties" object.
	constructor.prototype.assignProperties = function(props){
		for(var key in props){
			if(key in this.properties){
				this.properties[key] = props[key];
			}else{
				throw 'the property '+key+' is not a property of this app.';
			}
		}
	}

	//retrieves json configuration file
	constructor.prototype.fetchJson = function(path,callback){
		console.log('json called');
		var httpRequest = new XMLHttpRequest();
		httpRequest.onreadystatechange = function() {
			if (httpRequest.readyState === 4) {
				if (httpRequest.status === 200) {
					var data = JSON.parse(httpRequest.responseText);
					console.log('json retrieved',data);
					if (callback){
						callback(data);
					}
				}
			}
		}
		httpRequest.open('GET', path);
		httpRequest.overrideMimeType("application/json");
		httpRequest.send();
	}

	//creates the amount of rules to start with when instantiated.
	constructor.prototype.startWith = function(){
		for (var i = 0; i < this.properties.startWith; i++) {
			this.buildUi();
		}
	}

	//read the saved values from the json file saved to the server.
	constructor.prototype.readSavedValues = function(savedVals){
		console.log('savedVals',savedVals,'this.properties.currentCategory',this.properties.currentCategory);
		for (var i = 0,len = savedVals.length; i < len; i++) {
			this.buildUi(savedVals[i].select,savedVals[i].where,savedVals[i].thirdField,savedVals[i].or);
		}
	}

	//temporaraly saves the rule(s) and it's values when switching between categories.
	constructor.prototype.saveState = function(rule){
		if(this.properties.saveState[this.properties.currentCategory]){
			this.properties.saveState[this.properties.currentCategory].push(rule);
		}else{
			this.properties.saveState[this.properties.currentCategory] = [];
		}
	}

	//contructs the UI elements for the app.
	constructor.prototype.buildUi = function(select,where,thirdField,or){
		var me = this;
		var ruleHolder = this.createNode({
				tag:'div',
				classNames:'rule-holder'
			});
		var ruleObject = {
			thirdFields:this.createThirdFields(thirdField)
		}
		//holds ui elements in an object for ease of appending to dom via loop.
		var uiHolder = {
			orClause:(function(){
				var orBox = me.createNode({
					tag:'input',
					classNames:'or-clause',
					attrs:{
						type:'checkbox',
						name:'rule[orClause]'
					}
				});
				if(or){
					orBox.checked = or;
					orBox.classNames +=' ';
				}
				return orBox;
			})(),
			select:(function(){
				var row = me.createNode({
					tag:'div',
					classNames:'form-row',
					html:'<label>Select </label>',
					attrs:{
						"data-myIndex":me.properties.ruleCache.length
					}
				});
				var dropdown = me.createDropdown(me.properties.configJson.default_dropdowns[me.properties.currentCategory].select,select);
				ruleObject.currentFieldType = dropdown[dropdown.selectedIndex].getAttribute('data-fieldType');
				row.appendChild(dropdown);
				me.thirdParty_chosen_dropdown(dropdown);
				return row;
			})(),
			where:(function(){
				var row = me.createNode({
					tag:'div',
					classNames:'form-row',
					html:'<label>Where </label>'
				});

				var dropdown = me.createDropdown(me.properties.configJson.default_dropdowns.where.select,where);
				row.appendChild(dropdown);
				me.thirdParty_chosen_dropdown(dropdown);
				return row;
			})(),
			userInput:(function(){
				var fieldHolder = me.createNode({
					tag:'div'
				});
				var field = ruleObject.thirdFields[ruleObject.currentFieldType];
				var label = me.createNode({
					tag:'label',
					html:'is'
				});
				var row = me.createNode({
					tag:'div',
					classNames:'form-row'
				});
				row.appendChild(label);
				fieldHolder.appendChild(field);
				ruleObject.fieldHolder = fieldHolder;
				row.appendChild(fieldHolder);
				return row;
			})(),
			ruleAddRemove:(function(){
				var addRule = me.createNode({
					tag:'div',
					classNames:'add-rule btn btn-success',
					html:'Add',
					attrs:{
						style:'margin-right:10px;'
					}
				});
				var removeRule = me.createNode({
					tag:'div',
					classNames:'remove-rule btn btn-danger',
					html:'Remove',
					attrs:{
						"data-myIndex":me.properties.ruleCache.length
					}
				});

				me.assignEvents(removeRule,{
					mouseup:function(){
						//removeRule.removeEventListener('mouseup',test);
						this.parentNode.parentNode.className = this.parentNode.parentNode.className.replace('add-rule','');
						me.removeRuleUi(this.getAttribute('data-myIndex'));
					}
				});
				me.assignEvents(addRule,{
					mouseup:function(){
						me.buildUi();
					}
				});

				var row = me.createNode({
					tag:'div',
					classNames:'form-row',
					attrs:{
						style:'text-align:right;'
					}
				});
				row.appendChild(addRule);
				row.appendChild(removeRule);
				return row;
			})()
		};
		var docFrag = document.createDocumentFragment();
		for(var el in uiHolder){
			docFrag.appendChild(uiHolder[el]);
		}
		ruleHolder.appendChild(docFrag);
		ruleObject.rule = ruleHolder;
		this.properties.ruleCache.push(ruleObject);
		this.properties.injectSpot.appendChild(ruleObject.rule);
		window.getComputedStyle(ruleObject.rule).opacity;
		ruleObject.rule.className += ' add-rule';
		//this.assignEvents
	}

	constructor.prototype.thirdParty_datePicker = function(el){
		$(el).datepicker({
			minDate: "-3M",
			maxDate: "+3M"
		})
	}

	constructor.prototype.thirdParty_chosen_dropdown = function(el){
		var me = this;
		$(el).chosen().change(function(){
			var ruleObject = me.properties.ruleCache[$(this).parent().attr('data-myIndex')];
			var fieldType = $(this).children('option:selected').attr('data-fieldType');
			ruleObject.fieldHolder.innerHTML = '';
			ruleObject.fieldHolder.appendChild(ruleObject.thirdFields[fieldType]);
		});
	}

	constructor.prototype.getFieldType = function(){

	}

	//used for selecting a category from the dropdown
	constructor.prototype.selectCategory = function(){
		var me = this;
		var catVal = category.value.toLowerCase();
		this.properties.currentCategory = catVal;
		me.buildUi();
	}

	//removes targeted rule from the dom
	constructor.prototype.removeRuleUi = function(index){
		if(index){
			var el = this.properties.ruleCache[index].rule;
			el.className += ' delete-rule';
			el.parentNode.removeChild(el);
			delete this.properties.ruleCache[index];
		}else{
			this.properties.ruleCache = [];
			this.properties.injectSpot.innerHTML = '';
		}
	}

	//creates the elements from the json config file
	constructor.prototype.createThirdFields = function(savedVal){
		var el = null;
		var thirdFields = {};
		var elHolder = null;
		for(var field in this.properties.configJson.thirdFields){
			if(this.properties.configJson.thirdFields[field].tag == 'select'){
				el = this.createDropdown(this.properties.configJson.thirdFields[field].dropdownOptions,savedVal);
				elHolder = this.createNode({
					tag:'div'
				});
				elHolder.appendChild(el);
				this.thirdParty_chosen_dropdown(el);
				thirdFields[field] = elHolder;
			}else{
				el = this.createNode(this.properties.configJson.thirdFields[field]);
				if(field == 'date'){
					this.thirdParty_datePicker(el);
				}
				el.value = savedVal || '';
				thirdFields[field] = el;
			}
		}
		return thirdFields;
	}

	constructor.prototype.createDropdown = function(dropdownvals,savedVal,attributes){
		var select = this.createNode({
			tag:'select',
			classNames:'select-field',
			attrs:{
				name:'rule[template]',
				tabindex:"-1",
				style:"display:visible; position:absolute; clip:rect(0,0,0,0)"
			}
		});
		var option = null;
		var attrs = attributes || {};
		var aValue = null;
		var childOptions = document.createDocumentFragment();
		for (var i = 0,len = dropdownvals.length;i<len;i++) {
				aValue = dropdownvals[i].value || dropdownvals[i];
				if(dropdownvals[i].fieldType){
					attrs['data-fieldType'] = dropdownvals[i].fieldType;
				}
				if(savedVal == aValue){
					attrs.selected = 'selected';
				}else{
					delete attrs.selected;
				}
				attrs.value = aValue;
				option = this.createNode({
					tag:'option',
					html:aValue,
					attrs:attrs
				});
				childOptions.appendChild(option);
		};
		select.appendChild(childOptions);
		return select;
	}

	constructor.prototype.createPseudoDropdown = function(dropdownvals,savedVal){
		var dropHolder = this.createNode({
			tag:'div',
			classNames:'chosen-container chosen-container-single',
			html:'<a class="chosen-single" tabindex="-1"><span></span><div><b></b></div></a>',
			attrs:{
				style:"width: 345px;"
			}
		});
		var pseudoDrop = this.createNode({
			tag:'div',
			classNames:'chosen-drop',
			html:'<div class="chosen-search"><input type="text" autocomplete="off" tabindex="2"></div>',
		});
		var ul = this.createNode({
			tag:'ul',
			classNames:'chosen-results'
		});
		var li = null;
		for (var i = 0,len = dropdownvals.length;i<len;i++) {
			li = this.createNode({
				tag:'li',
				classNames:'active-result',
				html:dropdownvals[i],
				attrs:{
					"data-option-array-index":i
				}
			});
			if(savedVal == dropdownvals[i]){
				li.classNames += ' result-selected';
			}
			ul.appendChild(li);
		}
		pseudoDrop.appendChild(ul);
		dropHolder.appendChild(pseudoDrop);
		return dropHolder;
	}

	constructor.prototype.createNode = function(node){
		var el = document.createElement(node.tag);
		el.className = node.classNames || '';
		el.innerHTML = node.html || '';
		if(node.attrs){
			el = this.assignAttrs(el,node.attrs);
		}
		return el;
	}

	constructor.prototype.assignAttrs = function(el,attrs){
		for(var attr in attrs){
			el.setAttribute(attr,attrs[attr]);
		}
		return el;
	}

	//attach event(s) for ui object(s)
	constructor.prototype.assignEvents = function(el,events,useCapture){
		for(var event in events){
			el.addEventListener(event,events[event],useCapture);
		}
	}

	constructor.prototype.createCustomEvent = function(event){
		var eventObj = null;
		if(Event){
			eventObj = new Event(event);
		}else if(document.createEvent){
			eventObj = document.createEvent('Event');
			eventObj.initEvent(event);
		}
	}

	//remove event(s) from ui object(s)
	constructor.prototype.unAssignEvents = function(el,events){
		for(var event in events){
			el.removeEventListener(event,events[event]);
		}
	}

	//returns the correct css3 transition event
	constructor.prototype.transitionEndEventName = function() {
    	var i,
        undefined,
        el = document.createElement('div'),
        transitions = {
            'transition':'transitionend',
            'OTransition':'otransitionend',  // oTransitionEnd in very old Opera
            'MozTransition':'transitionend',
            'WebkitTransition':'webkitTransitionEnd'
        };

	    for (i in transitions) {
	        if (transitions.hasOwnProperty(i) && el.style[i] !== undefined) {
	            return transitions[i];
	        }
	    }

	}

	//exposes the constructor to the global environment
	window.rule_builder = constructor;
})();