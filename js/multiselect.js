/**
 * Multiselect
 * https://github.com/adampresley/multiselect
 * version 0.0.2
 *
 * Author: Adam Presley
 * License: MIT
 * Copyright 2015 Adam Presley
 */
(function(window, document) {
	"use strict";

	var
		selectedClass = "multiselect-li-selected";


	/**
	 * This is the public interface object returned to the calling user
	 * after rendering the control.
	 */
	var publicInterface = function(elementId, config, data) {
		/************************************************************************
		 * Public methods
		 ***********************************************************************/
		this.getData = function() {
			return data;
		};

		this.getSelected = function() {
			var
				selected = findSelectedItems(),
				result = [],
				index;

			for (index = 0; index < selected.length; index++) {
				result.push({
					"value": selected[index].getAttribute("data-value"),
					"text": selected[index].textContent,
					"index": window.parseInt(selected[index].getAttribute("data-index"), 10)
				});
			}

			return result;
		};

		this.getSelectedIndexes = function() {
			var
				selected = findSelectedItems(),
				result = [],
				index;

			for (index = 0; index < selected.length; index++) {
				result.push(window.parseInt(selected[index].getAttribute("data-index"), 10));
			}

			return result;
		};

		this.getSelectedValues = function() {
			var
				selected = findSelectedItems(),
				result = [],
				index;

			for (index = 0; index < selected.length; index++) {
				result.push(selected[index].getAttribute("data-value"));
			}

			return result;
		};

		/************************************************************************
		 * Private methods
		 ***********************************************************************/
		var attachClickEventToListItems = function() {
			Array.prototype.forEach.call(_listItems, function(el) {
				el.addEventListener("click", function() {
					this.classList.toggle(selectedClass);
					if (config.onItemClick) {
						config.onItemClick(el);
					}
				});
			});
		};

		var findSelectedItems = function() {
			return Array.prototype.filter.call(_listItems, function(el) {
				return el.classList.contains(selectedClass);
			});
		};

		/************************************************************************
		 * Constructor
		 ***********************************************************************/
		var
			_containerEl = document.getElementById(elementId),
			_listItems = _containerEl.querySelectorAll("li");

		attachClickEventToListItems();
	};


	/**
	 * This is the object that is attached to the window scope. This
	 * object provides the render() method and does the bulk of the
	 * work. Calling the render() method will return an object
	 * for the caller to work with.
	 */
	var multiselect = function() {
		var
			_self = this,
			_containerEl = undefined,
			_config = {},
			_data = [];

		/************************************************************************
		 * Public methods
		 ***********************************************************************/
		this.render = function(config) {
			var
				newEl = document.createDocumentFragment(),
				outerDiv = undefined,
				list = undefined;

			setupConfig(config);
			setupData(_config.data);

			_containerEl = document.getElementById(_config.elementId);
			_containerEl.classList.add("multiselect");

			outerDiv = createContainer(newEl);
			list = createList(outerDiv);
			createItems(list, _data);

			outerDiv.appendChild(list);
			newEl.appendChild(outerDiv);

			_containerEl.appendChild(newEl);
			return new publicInterface(_config.elementId, _config, _data);
		};

		/************************************************************************
		 * Private methods
		 ***********************************************************************/
		var createContainer = function(el) {
			var outerDiv = document.createElement("div");

			outerDiv.classList.add("multiselect-outer-div");
			outerDiv.style.width = _config.width;
			outerDiv.style.height = _config.height;
			outerDiv.style.overflow = "auto";

			return outerDiv;
		};

		var createItem = function(index, itemData) {
			var listItem = document.createElement("li");

			listItem.textContent = itemData.text;
			listItem.setAttribute("data-value", itemData.value);
			listItem.setAttribute("data-index", index);

			if (itemData.hasOwnProperty("selected") && itemData.selected === true) {
				listItem.classList.add(selectedClass);
			}

			return listItem;
		};

		var createItems = function(listEl, data) {
			var
				index = 0;

			for (index = 0; index < data.length; index++) {
				var item = createItem(index, data[index]);
				listEl.appendChild(item);
			}
		};

		var createList = function(outerDivEl) {
			var list = document.createElement("ul");

			list.classList.add("multiselect-list");
			return list;
		};

		var setupConfig = function(config) {
			/*
			 * Validate required arguments
			 */
			if (!config.hasOwnProperty("elementId")) throw("Please provide the ID of the element to render to (elementId)");
			if (!config.hasOwnProperty("data")) throw("Please provide an array of data for the multiselect control");

			_config.elementId = config.elementId;
			_config.data = config.data;

			_config.width = config.width || "300px";
			_config.height = config.height || "250px";
			_config.onItemClick = config.onItemClick || undefined;
		};

		var setupData = function(data) {
			if (typeof data === "function") {
				_data = data();
			} else {
				_data = data;
			}
		};
	};

	window.multiselect = new multiselect();
}(window, document));