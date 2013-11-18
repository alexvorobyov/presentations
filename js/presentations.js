(function(window) {

  /* Class to manage list of presentations */
  var PresentationsController = function(opts) {
    opts = opts || {};

    this.items = {};

    if (opts.items) {
      for (var i = 0, item; item = opts.items[i++];) {
        this.items['presentation' + i] = $(item);
      }
    }

    this.init();
  };

  PresentationsController.prototype.init = function() {
    this.buildMenu();

    var self = this;

    $('.presentations-menu').delegate('a', 'click', function(event) {
      var target = $(event.target),
          li = target.parents('li'),
          presentationId,
          presentationSource;

      if (li.length && (presentationId = li.attr('data-presentation-id')) && (presentationSource = self.items[presentationId])) {
        var presentation = new Presentation({
          source : presentationSource
        });

        presentation.next();
      }

      event.preventDefault();
    })

  };

  PresentationsController.prototype.buildMenu = function() {
    if (this.menu) return;

    this.menu = $('<ul class="presentations-menu"></ul>');

    var presentationTitle;
    for (var i in this.items) {
      presentationTitle = this.items[i].find('.presentation-title').html() || 'Presentation';

      this.menu.append('<li data-presentation-id="' + i + '"><a href="#">' + presentationTitle + '</a></li>');
    }

    $('body').append(this.menu);
  };

  PresentationsController.prototype.hide = function() {
    this.menu.hide();
  };

  PresentationsController.prototype.show = function() {
    this.menu.show();
  };


  /* Class to manage single presentation */
  var Presentation = function(opts) {
    opts = opts || {};

    if (!opts.source) {
      throw new Error('no presentation source');
    }

    this.source = opts.source;
    this.slides = opts.source.find('.presentation-slide');

    this.currentSlide = null;
    this.currentSlideNumber = -1;

    $('body').addClass('presentation-active').removeClass('presentation-list');

    this.attachListeners();
    this.createControls();
  };

  Presentation.prototype.attachListeners = function() {
    var self = this,
        body = $('body'),
        win = $(window),
        prevSlideKeyCodes = [8, 33, 37, 38],
        nextSlideKeyCodes = [32, 34, 39, 40];

    $(document).on('keydown', this.keyDownListener = function(e) {
      if (~$.inArray(e.which, prevSlideKeyCodes)) {
        self.prev();
        e.preventDefault();
      }
      else if (~$.inArray(e.which, nextSlideKeyCodes)) {
        self.next();
        e.preventDefault();
      }
      else if (e.which == 36) {
        self._showSlide(0, {
          force : true,
          start : true
        });
        e.preventDefault();
      }
      else if (e.which == 35) {
        self._showSlide(self.slides.length - 1, {
          force : true
        });
        e.preventDefault();
      }
      else if (e.which == 27) {
        self.destroy();
        e.preventDefault();
      }
    });

    $(window).on('resize', this.resizeListener = function() {
      var scaleMax = Math.max(body.innerWidth() / win.innerWidth(), body.innerHeight() / win.innerHeight()),
          scaleOpt = 'scale(' + (1 / scaleMax) + ')';

      body.css({
        'WebkitTransform' : scaleOpt,
        'MozTransform' : scaleOpt,
        'msTransform' : scaleOpt,
        'OTransform' : scaleOpt,
        'transform' : scaleOpt
      })
    });

    this.resizeListener();
  };

  Presentation.prototype.createControls = function() {
    this.controls = $([
      '<div class="presentation-controls">',
      '<a class="presentation-controls-prev">&lt;</a>',
      '<a class="presentation-controls-close">&times;</a>',
      '<a class="presentation-controls-next">&gt;</a>',
      '</div>'
    ].join(''));

    $('body').append(this.controls);

    var self = this;
    this.controls.on('click', this.controlsListener = function(event) {
      var target = $(event.target);

      if (target.is('.presentation-controls-prev')) {
        self.prev();
      }
      else if (target.is('.presentation-controls-close')) {
        self.destroy();
      }
      else if (target.is('.presentation-controls-next')) {
        self.next();
      }

      event.preventDefault();
    })
  };

  Presentation.prototype.next = function() {
    if (this.currentSlideNumber + 1 < this.slides.length) {
      this._showSlide(this.currentSlideNumber + 1)
    }
  };

  Presentation.prototype.prev = function() {
    if (this.currentSlideNumber - 1 >= 0) {
      this._showSlide(this.currentSlideNumber - 1, {
        prev : true
      })
    }
  };

  Presentation.prototype.destroy = function() {
    $(document).unbind('keydown', this.keyDownListener);
    $(window).unbind('resize', this.resizeListener);

    this.controls.unbind('click', this.controlsListener);
    this.controls.remove();

    this.slides.hide();
    this.slides.find('.presentation-slide-next').attr('class', 'presentation-slide-next');
    $('body').addClass('presentation-list').removeClass('presentation-active');
  };

  Presentation.prototype._showSlide = function(slideNumber, opts) {
    opts = opts || {};

    if (this.currentSlide) {
      if (opts.force) {
        if (opts.start) {
          this.source.find('.presentation-slide-next').attr('class', 'presentation-slide-next');
        }
        this.currentSlide.hide();
      }
      else if (!this.currentSlide[opts.prev ? 'showPrevStep' : 'showNextStep']()) {
        this.currentSlide.hide();
      }
      else {
        return;
      }
    }

    this.currentSlideNumber = slideNumber;

    var slideToShow = new Slide({
      source : this.slides.eq(slideNumber)
    });

    slideToShow.show();
    this.currentSlide = slideToShow;

    this.controls[this.currentSlideNumber == 0 ? 'addClass' : 'removeClass']('presentation-controls-first');
    this.controls[this.currentSlideNumber == this.slides.length - 1 ? 'addClass' : 'removeClass']('presentation-controls-last');
  };


  /* Slide representation */
  var Slide = function(opts) {
    opts = opts || {};

    if (!opts.source) {
      throw new Error('no slide source');
    }

    this.source = opts.source;
  };

  Slide.prototype.show = function() {
    this.source.show();
  };

  Slide.prototype.hide = function() {
    this.source.hide();
  };

  Slide.prototype.showNextStep = function() {
    var nextStep = this.source.find('.presentation-slide-next:not(.presentation-slide-next-active)').eq(0);

    if (nextStep.length) {
      nextStep.addClass('presentation-slide-next-active').addClass(nextStep.attr('data-add-class') || 'presentation-slide-visibility');

      return true;
    }
    return false;
  };

  Slide.prototype.showPrevStep = function() {
    var prevStep = this.source.find('.presentation-slide-next.presentation-slide-next-active').last();

    if (prevStep.length) {
      prevStep.attr('class', 'presentation-slide-next');

      return true;
    }
    return false;
  };

  $(function() {
    var presentationContainers = $('.presentation');

    if (presentationContainers.length) {
      new PresentationsController({
        items : presentationContainers
      });
    }
  })

})(window);