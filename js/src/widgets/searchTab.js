(function($) {

  $.SearchTab = function(options) {
    jQuery.extend(true, this, {
      element:           null,
      appendTo:          null,
      manifest:          null,
      visible:           null,
      canvasID:          null,
      windowId:          null,
      eventEmitter:      null,
    }, options);

    this.init();
  };

  $.SearchTab.prototype = {
    init: function() {
      var _this = this;
      this.windowId = this.windowId;

      this.localState({
        id: 'searchTab',
        visible: this.visible,
      }, true);

      this.listenForActions();
      this.render(this.localState());
      this.loadTabComponents();
    },

    localState: function(state, initial) {
      if (!arguments.length) return this.searchTabState;
      this.searchTabState = state;

      if (!initial) {
        this.eventEmitter.publish('searchTabStateUpdated.' + this.windowId, this.searchTabState);
      }

      return this.searchTabState;
    },

    loadTabComponents: function() {
      var _this = this;
    },

    tabStateUpdated: function(data) {
      if (data.tabs[data.selectedTabIndex].options.id === 'searchTab') {
        this.element.show();
      }
      else {
        this.element.hide();
      }
    },

    toggle: function() {},

    listenForActions: function() {
      var _this = this;

      //jQuery.subscribe('searchTabStateUpdated.' + _this.windowId, function(_, data) {
      //    _this.render(data);
      //});

      this.eventEmitter.subscribe('tabStateUpdated.' + _this.windowId, function(_, data) {
        _this.tabStateUpdated(data);
      });

      // eventEmitter.subscribe('currentCanvasIDUpdated.' + _this.windowId, function(event) {
      //
      // });
    },

    displaySearchWithin: function(query_params, searchUrl){
      var _this = this;
      if (query_params !== "") {

        this.searchObject = new $.SearchWithinResults({
          manifest: _this.manifest,
          appendTo: _this.element.find(".search-results-list"),
          panel: true,
          canvasID: _this.canvasID,
          windowId: _this.windowId,
          imagesList: _this.imagesList,
          thumbInfo: {thumbsHeight: 80, listingCssCls: 'panel-listing-thumbs', thumbnailCls: 'panel-thumbnail-view'},
          query_params: query_params,
          searchService: searchUrl,
          eventEmitter: _this.eventEmitter
        });
      }
    },

    bindEvents: function() {
      var _this = this;

      this.element.find(".js-perform-query").on('submit', function(event){
        event.preventDefault();

        var query = _this.element.find(".js-query").val();
        var motivation = _this.element.find(".js-motivation").val();
        var date = _this.element.find(".js-date").val();
        var user = _this.element.find(".js-user").val();
        var searchUrl = _this.element.find("#search-within-selector").val();

        _this.displaySearchWithin({
          "q": query,
          "motivation": motivation,
          "date": date,
          "user": user
        }, searchUrl);

      });

      this.element.find(".js-search-expand").on('click', function(event){
        event.preventDefault();

        _this.element.find(".js-search-expanded").slideToggle("fast");

        if (jQuery(this).text() === i18next.t("more")){
          jQuery(this).text(i18next.t("less"));
        }
        else if (jQuery(this).text() === i18next.t("less")){
          jQuery(this).text(i18next.t("more"));
        }
      });

    },

    render: function(state) {
      var _this = this;

      var searchService = this.manifest.getSearchWithinService(),
          searchServiceIdArray = searchService && searchService.map(function(data){
        return {
          "url": data['@id'],
          "label": data.label
        };
      });

      var templateData = {
        searchService: searchServiceIdArray
      };

      if (!this.element) {
        this.element = jQuery(_this.template(templateData)).appendTo(_this.appendTo);
        _this.bindEvents();
      } else {
        _this.appendTo.find(".search-results").remove();
        this.element = jQuery(_this.template(templateData)).appendTo(_this.appendTo);
      }

      if (state.visible) {
        this.element.show();
      } else {
        this.element.hide();
      }
    },

    template: function (data) {
      return $.Handlebars.getTemplate(this.state.getStateProperty('template'), 'widgets/searchTab')(data);
    }
  };

}(Mirador));
