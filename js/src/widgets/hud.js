(function($) {

  $.Hud = function(options) {

    jQuery.extend(this, {
      element:   null,
      windowId:  null,
      annoState: null,
      annoEndpointAvailable: false,
      eventEmitter: null
    }, options);

    this.init();
  };

  $.Hud.prototype = {

    init: function() {
      this.createStateMachines();

      var showAnno = typeof this.showAnno !== 'undefined' ? this.showAnno : this.canvasControls.annotations.annotationLayer,
      showImageControls = typeof this.showImageControls !== 'undefined' ? this.showImageControls : this.canvasControls.imageManipulation.manipulationLayer;
      this.element = jQuery(this.template({
        showNextPrev : this.showNextPrev,
        showBottomPanel : typeof this.bottomPanelAvailable === 'undefined' ? true : this.bottomPanelAvailable,
        showAnno : showAnno,
        showImageControls : showImageControls
      })).appendTo(this.appendTo);

      if (showAnno || showImageControls) {
        this.contextControls = new $.ContextControls({
          element: null,
          container: this.element.find('.mirador-osd-context-controls'),
          qtipElement: this.qtipElement,
          mode: 'displayAnnotations',
          windowId: this.windowId,
          canvasControls: this.canvasControls,
          annoEndpointAvailable: this.annoEndpointAvailable,
          availableAnnotationTools: this.availableAnnotationTools,
          availableAnnotationStylePickers: this.availableAnnotationStylePickers,
          state: this.state,
          eventEmitter: this.eventEmitter
        });
      }

      this.listenForActions();
      this.bindEvents();
    },

    listenForActions: function() {
      var _this = this;
      this.eventEmitter.subscribe('DISABLE_TOOLTIPS_BY_CLASS.' + this.windowId, function(event, className) {
        _this.element.find(className).qtip('disable');
      });

      this.eventEmitter.subscribe('ENABLE_TOOLTIPS_BY_CLASS.' + this.windowId, function(event, className) {
        _this.element.find(className).qtip('enable');
      });

      this.eventEmitter.subscribe('SET_STATE_MACHINE_POINTER.' + this.windowId, function(event) {
        if (_this.annoState.current === 'none') {
          _this.annoState.startup();
        } else if (_this.annoState.current === 'off') {
          _this.annoState.displayOn();
        } else {
          _this.annoState.choosePointer();
        }
      });
    },

    bindEvents: function() {
      var _this = this;
    },

    createStateMachines: function() {
      var _this = this,
      duration = "200";

      //add more to these as AnnoState becomes more complex
      //initial state is 'none'
      this.annoState = StateMachine.create({
        events: [
          { name: 'startup', from: 'none', to: 'off' },
          { name: 'displayOn', from: 'off', to: 'pointer'},
          { name: 'displayOff', from: ['pointer', 'shape'], to: 'off'},
          { name: 'choosePointer', from: ['pointer', 'shape'], to: 'pointer'},
          { name: 'chooseShape', from: 'pointer', to: 'shape'},
          { name: 'changeShape', from: 'shape', to: 'shape'},
          { name: 'refresh', from: 'pointer', to: 'pointer'},
          { name: 'refresh', from: 'shape', to: 'shape'}
        ],
        callbacks: {
          onstartup: function(event, from, to) {
            _this.eventEmitter.publish(('windowUpdated'), {
              id: _this.windowId,
              annotationState: to
            });
          },
          ondisplayOn: function(event, from, to) {
            _this.eventEmitter.publish('HUD_ADD_CLASS.'+_this.windowId, ['.mirador-osd-annotations-layer', 'selected']);
            if (_this.annoEndpointAvailable) {
                  _this.contextControls.annotationShow();
            }
            _this.eventEmitter.publish('modeChange.' + _this.windowId, 'displayAnnotations');
            _this.eventEmitter.publish('HUD_ADD_CLASS.'+_this.windowId, ['.mirador-osd-pointer-mode', 'selected']);
            _this.eventEmitter.publish('HUD_ADD_CLASS.'+_this.windowId, ['.hud-dropdown', 'hud-disabled']);
            _this.eventEmitter.publish('DISABLE_TOOLTIPS_BY_CLASS.'+_this.windowId, '.hud-dropdown');
            _this.eventEmitter.publish('DEFAULT_CURSOR.' + _this.windowId);
            _this.eventEmitter.publish(('windowUpdated'), {
              id: _this.windowId,
              annotationState: to
            });
          },
          ondisplayOff: function(event, from, to) {
            if (_this.annoEndpointAvailable) {
              _this.eventEmitter.publish('HUD_REMOVE_CLASS.'+_this.windowId, ['.mirador-osd-edit-mode', 'selected']);
              _this.eventEmitter.publish('HUD_REMOVE_CLASS.'+_this.windowId, ['.mirador-osd-pointer-mode', 'selected']);
              _this.eventEmitter.publish('CANCEL_ACTIVE_ANNOTATIONS.'+_this.windowId);
              _this.contextControls.annotationHide();
            }
            _this.eventEmitter.publish('HUD_REMOVE_CLASS.'+_this.windowId, ['.mirador-osd-annotations-layer', 'selected']);
            _this.eventEmitter.publish('modeChange.' + _this.windowId, 'default');
            _this.eventEmitter.publish(('windowUpdated'), {
              id: _this.windowId,
              annotationState: to
            });
          },
          onchoosePointer: function(event, from, to) {
            _this.eventEmitter.publish('HUD_REMOVE_CLASS.'+_this.windowId, ['.mirador-osd-edit-mode', 'selected']);
            _this.eventEmitter.publish('HUD_ADD_CLASS.'+_this.windowId, ['.mirador-osd-pointer-mode', 'selected']);
            _this.eventEmitter.publish('HUD_ADD_CLASS.'+_this.windowId, ['.hud-dropdown', 'hud-disabled']);
            _this.eventEmitter.publish('DISABLE_TOOLTIPS_BY_CLASS.'+_this.windowId, '.hud-dropdown');
            _this.eventEmitter.publish('modeChange.' + _this.windowId, 'displayAnnotations');
            _this.eventEmitter.publish('DEFAULT_CURSOR.' + _this.windowId);
            _this.eventEmitter.publish(('windowUpdated'), {
              id: _this.windowId,
              annotationState: to
            });
          },
          onchooseShape: function(event, from, to, shape) {
            _this.eventEmitter.publish('HUD_REMOVE_CLASS.'+_this.windowId, ['.mirador-osd-pointer-mode', 'selected']);
            _this.eventEmitter.publish('HUD_REMOVE_CLASS.'+_this.windowId, ['.mirador-osd-edit-mode', 'selected']);
            _this.eventEmitter.publish('HUD_REMOVE_CLASS.'+_this.windowId, ['.hud-dropdown', 'hud-disabled']);
            _this.eventEmitter.publish('ENABLE_TOOLTIPS_BY_CLASS.'+_this.windowId, '.hud-dropdown');
            _this.eventEmitter.publish('HUD_ADD_CLASS.'+_this.windowId, ['.mirador-osd-'+shape+'-mode', 'selected']);
            _this.eventEmitter.publish('modeChange.' + _this.windowId, 'creatingAnnotation');
            _this.eventEmitter.publish('CROSSHAIR_CURSOR.' + _this.windowId);
            _this.eventEmitter.publish('toggleDrawingTool.'+_this.windowId, shape);

            _this.eventEmitter.publish(('windowUpdated'), {
              id: _this.windowId,
              annotationState: to
            });
          },
          onchangeShape: function(event, from, to, shape) {
            _this.eventEmitter.publish('HUD_REMOVE_CLASS.'+_this.windowId, ['.mirador-osd-pointer-mode', 'selected']);
            _this.eventEmitter.publish('HUD_REMOVE_CLASS.'+_this.windowId, ['.mirador-osd-edit-mode', 'selected']);
            _this.eventEmitter.publish('HUD_REMOVE_CLASS.'+_this.windowId, ['.hud-dropdown', 'hud-disabled']);
            _this.eventEmitter.publish('ENABLE_TOOLTIPS_BY_CLASS.'+_this.windowId, '.hud-dropdown');
            _this.eventEmitter.publish('HUD_ADD_CLASS.'+_this.windowId, ['.mirador-osd-'+shape+'-mode', 'selected']);
            _this.eventEmitter.publish('CROSSHAIR_CURSOR.' + _this.windowId);
            //don't need to trigger a mode change, just change tool
            _this.eventEmitter.publish('toggleDrawingTool.'+_this.windowId, shape);

            _this.eventEmitter.publish(('windowUpdated'), {
              id: _this.windowId,
              annotationState: to
            });
          },
          onrefresh: function(event, from, to) {
            //TODO
          }
        }
      });

      this.manipulationState = StateMachine.create({
        events: [
          { name: 'startup',  from: 'none',  to: 'manipulationOff' },
          { name: 'displayOn',  from: 'manipulationOff',  to: 'manipulationOn' },
          { name: 'displayOff', from: 'manipulationOn', to: 'manipulationOff' }
        ],
        callbacks: {
          onstartup: function(event, from, to) {
            _this.eventEmitter.publish(('windowUpdated'), {
              id: _this.windowId,
              manipulationState: to
            });
          },
          ondisplayOn: function(event, from, to) {
            _this.eventEmitter.publish('HUD_ADD_CLASS.'+_this.windowId, ['.mirador-manipulation-toggle', 'selected']);
            _this.contextControls.manipulationShow();
            _this.eventEmitter.publish(('windowUpdated'), {
              id: _this.windowId,
              manipulationState: to
            });
          },
          ondisplayOff: function(event, from, to) {
            _this.contextControls.manipulationHide();
            _this.eventEmitter.publish('HUD_REMOVE_CLASS.'+_this.windowId, ['.mirador-manipulation-toggle', 'selected']);
            _this.eventEmitter.publish(('windowUpdated'), {
              id: _this.windowId,
              manipulationState: to
            });
          }
        }
      });
    },

    template: function (data) {
        return $.Handlebars.getTemplate(this.state.getStateProperty('template'), 'widgets/hud')(data);
    }
};

}(Mirador));
