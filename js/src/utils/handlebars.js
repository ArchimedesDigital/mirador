(function($) {

  $.Handlebars = (function() {
    return Handlebars.create();
  })();

}(Mirador));

Mirador.Handlebars.getTemplate = function (template, name) {
  var _this = this;
  if (_this.templates === undefined || _this.templates[name] === undefined) {
    $.ajax({
      url: 'templates/' + template + '/' + name + '.handlebars',
      success: function (data) {
        if (_this.templates === undefined) {
          _this.templates = {};
        }
        _this.templates[name] = _this.compile(data);
      },
      async: false
    });
  }
  return this.templates[name];
};