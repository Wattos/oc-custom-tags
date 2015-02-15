/**
 * ownCloud - tags
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Filip Wieladek <Filip@Wieladek.com>
 * @copyright Filip Wieladek 2015
 */

(function ($, OC) {
	var APP_ID= "oc-custom-tags";

	var tags_placeholder_template= Handlebars.compile(
		'<span class="tags">' +
		'</span>'
	);
	
	var tags_contents_template= Handlebars.compile(
		'{{#each tags}}' +
			'<span class="tag">' +
				'<span class="tag-content">{{this}}</span>' +
				'<span class="tag-actions">' +
				'{{#each ../actions}}' + 
					'<img class="svg tag-action tag-action-{{this.name}}" title="{{this.tooltip}}" src="{{this.icon}}"/>' +
				'{{/each}}' +
				'</span>' +
			'</span>' +
		'{{/each}}'
	)
	
	var dropdown_template= Handlebars.compile(
		'<div id="tags-dropdown" class="tags-dropdown">' +
			'<div class="tags-dropdown-search">'+
				'<input  id="tags-input-text"   class="tags-input-text" type="text" placeholder="Enter new Tags"></input>' +
				'<button id="tags-input-button" class="tags-input-button">+</button>' +
			'</div>' +
			'<div id="tags-dropdown-results" class="tags-dropdown-results">'+
			'</div>' +
		'</div>'
	);
	
	OC.Tags= {};
	
	OC.Tags.Client= {
		applyTags: function(fileData, tags) {
			var encodedPath = OC.encodePath(fileData.name);
			while (encodedPath[0] === '/') {
				encodedPath = encodedPath.substr(1);
			}
			return $.ajax({
				url: OC.generateUrl('/apps/files/api/v1/files/') + encodedPath,
				contentType: 'application/json',
				data: JSON.stringify({
					tags: tags || []
				}),
				dataType: 'json',
				type: 'POST'
			}).then(function(result) {
				fileData.tags= result.tags || [];
			});
		}
	};
	
	OC.Tags.UI= {
		render: function(fileData, $row) {
			var tags= fileData.tags || [];
 			tags= _.without(tags, OC.TAG_FAVORITE);
			tags= tags.sort();
			var html= $(tags_contents_template({ 
				'tags': tags, 
				'actions': OC.Tags.Plugin.tagActions
			}));
			html.on("click", ".tag-action", function(event) {
				var $tag= $(event.target).closest(".tag");
				var tag= $tag.find(".tag-content").text();
				var newTags= _.without(fileData.tags, tag);
				OC.Tags.Client.applyTags(fileData, newTags).then(function(result){
					OC.Tags.UI.render(fileData, $row);
				});
			});
			$row.find(".tags").html(html);
		},
		
		placeholder: function() {
			return $(tags_placeholder_template());
		},
		
		dropdown: function(fileName, context) {
			var dropdown= {};
			dropdown.el= $(dropdown_template());
			dropdown.ui= {
				input: dropdown.el.find("#tags-input-text"),
				addButton: dropdown.el.find("#tags-input-button"),
				results: dropdown.el.find("#tags-dropdown-results")
			};

			var addTag= function() {
				var $file= context.$file;
				var fileData= context.fileList.files[$file.index()];
				var tags= dropdown.ui.input.val();
				tags= tags.split(/(\s|,)/);
				tags= _.filter(tags, function(value) { return !(/\s+/.test(value) || value === "") });
				tags= tags.concat(fileData.tags || []);
				tags= _.uniq(tags);
				
				OC.Tags.Client.applyTags(fileData, tags).then(function(result) {
					OC.Tags.UI._closeDropdown(dropdown, context);
					OC.Tags.UI.render(fileData, context.$file);
				});
			};
			dropdown.ui.input.on("keypress", function(event) {
				if (event.which == 13) {
					addTag(event);
				}
			});
			dropdown.ui.addButton.on("click", addTag);
			
			dropdown.ui._onClick= function(event) {
				if (dropdown.el.has($(event.target)).length === 0) {
					OC.Tags.UI._closeDropdown(dropdown, context);
				}
			};
 			window.addEventListener("click", dropdown.ui._onClick, true);
			context.$file.find(".filename").append(dropdown.el);
			context.$file.addClass('mouseOver');
			dropdown.ui.input.focus();
		},
		
		_closeDropdown: function(dropdown, context) {
			window.removeEventListener("click", dropdown.ui._onClick);
			dropdown.el.remove();
			context.$file.removeClass('mouseOver');
		}
	};
	
	OC.Tags.Plugin= {
		name: 'Support for Tags',
		allowedLists: [
			'files',
			'favorites'
		],
		tagActions: [ 
			{ 
				name: 'remove',
				icon: OC.imagePath(APP_ID,'icon-removeTag'),
				tooltip: 'Remove this tag'
			}
		],
 
		_contributeAction: function(fileList) {
			fileList.fileActions.registerAction({
				name: 'tag',
				displayName: 'Tag',
				mime: 'all',
				permissions: OC.PERMISSION_UPDATE,
				icon: OC.imagePath(APP_ID,'icon-action'),
				actionHandler: _.bind(this._handleAction, this)
			});
		},
 
		_contributeRendering: function(fileList) {
			var oldCreateRow= fileList._createRow;
			fileList._createRow= function(fileData) {
				var $row= oldCreateRow.apply(this, arguments);
				$row.find(".filename").append(OC.Tags.UI.placeholder());
				OC.Tags.UI.render(fileData, $row);
				return $row;
			};
		},
 
		_handleAction: function(fileName, context) {
			if (context.$file.find('#tags-dropdown').length > 0) {
				return;
			}
			OC.Tags.UI.dropdown(fileName, context);
		},
 
		attach: function(fileList) {
			if (this.allowedLists.indexOf(fileList.id) < 0) {
				return;
			}
			this._contributeRendering(fileList);
			this._contributeAction(fileList);
		}
	}
})(jQuery, OC);

OC.Plugins.register('OCA.Files.FileList', OC.Tags.Plugin);
