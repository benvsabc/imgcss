/**
 * Created by shenshaohui on 2016/6/14.
 *
 * \u8F6E\u64AD\u56FE\u52A8\u753B
 *
 * $(selector).swiper(options)
 *
 * @param {Object} options \u8F6E\u64AD\u7684\u9009\u9879
 *
 *          options.duration    {int} || 600    \u8F6E\u64AD\u7684\u8FC7\u6E21\u65F6\u95F4 ms
 *          options.interval    {int} || 4000   \u8F6E\u64AD\u7684\u95F4\u9694\u65F6\u95F4 ms
 *          options.orientation {int} || 1      \u8F6E\u64AD\u56FE\u65B9\u5411
 *          options.delay       {int} || 0      \u521D\u59CB\u5EF6\u8FDF
 *          options.style       {object}
 *          options.animation   {object}
 *
 * @event swipestart \u8F6E\u64AD\u52A8\u753B\u5F00\u59CB\u65F6\u89E6\u53D1
 * @event swipeend   \u8F6E\u64AD\u52A8\u753B\u7ED3\u675F\u65F6\u89E6\u53D1
 *
 */
(function ($) {

    function parseStyleText(styleText) {
        var styleArray = $.trim(styleText).split(/\s*;\s*/g);
        var styleObject = {};
        for (var i = 0, len = styleArray.length; i < len; i++) {
            var pair = styleArray[i].split(/\s*:\s*/g);
            if (pair[0] != 'z-index') {
                styleObject[pair[0]] = pair[1];
            }
        }
        return styleObject;
    }

    $.fn.swiper = function (opts) {
        opts = opts || {};

        var options = {
            duration: opts.duration || 600,
            interval: opts.interval || 4000,
            orientation: opts.orientation || 1,
            style: opts.style || {},
            animation: opts.animation || {}
        };

        var timer;
        var swipeLock = false;

        var $this = this,
            $swiperItems = $this.find('.swiper-item'),
            $dotContainer = $('<ul class="swiper-dots"></ul>');

        var itemCount = $swiperItems.length,
            currentIndex = 0,
            maxOffset = Math.floor(($swiperItems.length - 1) / 2);

        if (0 === itemCount) {
            // throw new Error('no swiper-item, please check it'); // no children
            console.error('no swiper-item, please check it');
            return this;
        }

        if ($.isEmptyObject(options.animation)) {
            $swiperItems.each(function (index, element) {
                var $element = $(element);
                options.animation[$element.attr('data-offset')] = parseStyleText($element.attr('style'));
            });
        }

        // \u521B\u5EFA\u7F29\u7565\u70B9
        for (var i = 0, len = itemCount; i < len; i++) {
            if (0 == i) {
                $dotContainer.append($('<li class="active"></li>'));
            } else {
                $dotContainer.append($('<li></li>'));
            }
        }

        $this.append($dotContainer);
        var $dotItems = $dotContainer.children();
        // \u5C45\u4E2D
        $dotContainer.css({
            'margin-left': -$dotContainer.outerWidth() / 2 + 'px'
        });

        $dotContainer.click(function (event) {
            var $li = $(event.target).closest('li');
            swipeTo($li.index());
        });

        // \u6DFB\u52A0\u5DE6\u53F3\u53EF\u70B9\u51FB\u6309\u94AE
        var $prevButton = $('<div class="swiper-btn swiper-prev-btn"></div>'),
            $nextButton = $('<div class="swiper-btn swiper-next-btn"></div>');

        $this.append($prevButton);
        $this.append($nextButton);

        $prevButton.click(function () {
            prev();
        });

        $nextButton.click(function () {
            next();
        });

        /*
         * \u6267\u884C\u8F6E\u64AD
         * swiper(orientation, duration[, callback])
         *
         * @param {int} orientation \u8F6E\u64AD\u7684\u65B9\u5411 1 next, -1 prev
         * @param {int} duration    \u8F6E\u64AD\u52A8\u753B\u7684\u65F6\u95F4(ms)
         * @param {function} callback    \u8F6E\u64AD\u7684\u56DE\u8C03
         */
        function swipe(orientation, duration, callback) {
            // \u56DE\u8C03
            callback = typeof callback === 'function' ? callback : function () {};
            var callbackCounter = 0; // \u56DE\u8C03\u8BA1\u6570\u5668

            // For Swiper Item
            for (var i = 0; i < itemCount; i++) {
                var index = (i - currentIndex + itemCount) % itemCount;
                index = index > maxOffset ? index - itemCount : index;

                var $item = $swiperItems.eq(i);

                var offset = index;
                var zIndex = getZIndex(offset, itemCount, orientation)

                $item
                    .attr('data-offset', offset)
                    .css('z-index', zIndex);

                $dotItems.eq(i).attr('data-offset', offset);

                // \u6837\u5F0F\u6548\u679C
                var styleKey = offset in options.style ? offset : 'default';
                if (options.style[styleKey]) {
                    $swiperItems.eq(i).css(options.style[styleKey]);
                }

                // \u52A8\u753B\u6548\u679C
                var animationKey = offset in options.animation ? offset : 'default';
                if (options.animation[animationKey]) {
                    callbackCounter++;
                    $item.animate(options.animation[animationKey], duration, function () {
                        if (0 == --callbackCounter) {
                            $this.trigger('swipeend');
                            callback();
                        }
                    });
                }
            }

            $this.trigger('swipestart');
        }

        /**
         * \u79FB\u52A8\u4E00\u6B65
         *
         * @param orientation \u79FB\u52A8\u7684\u65B9\u5411
         */
        function swipeStep(orientation) {
            if (swipeLock) {
                return;
            }

            clearTimeout(timer);
            swipeLock = true;

            currentIndex = (currentIndex + itemCount + orientation) % itemCount;

            swipe(orientation, options.duration, function () {
                swipeLock = false;
                timer = setTimeout(options.orientation < 0 ? prev : next, options.interval);
            });
        }

        function prev() {
            swipeStep(-1);
        }

        function next() {
            swipeStep(1);
        }

        /**
         * \u79FB\u52A8\u5230\u67D0\u4E2A\u5143\u7D20
         *
         * @param index \u5143\u7D20\u4E0B\u6807
         */
        function swipeTo(index) {
            if (index === currentIndex) {
                return;
            }

            if (swipeLock) {
                return;
            }

            clearTimeout(timer);
            swipeLock = true;

            var offset = +$swiperItems.eq(index).attr('data-offset'),
                orientation = offset > 0 ? 1 : -1,
                duration = options.duration / Math.abs(offset);

            (function fn() {
                if (0 == $swiperItems.eq(index).attr('data-offset')) {
                    swipeLock = false;
                    timer = setTimeout(next, options.interval);
                }
                else {
                    currentIndex = (currentIndex + orientation) % itemCount;
                    swipe(orientation, duration, fn);
                }
            }());
        }

        function offsetTarget(offset) {
            return $swiperItems.filter('[data-offset="' + (offset || 0) + '"]');
        }

        swipe(1, 0);
        setTimeout(function () {
            timer = setTimeout(options.orientation < 0 ? prev : next, options.interval);
        }, options.delay);

        $this.swipeNext = next;
        $this.swipePrev = prev;
        $this.swipeTo = swipeTo;
        $this.offsetTarget = offsetTarget;

        return this;
    };

    /**
     * \u8BA1\u7B97\u5B50\u5143\u7D20\u5BF9\u5E94\u7684 z-index
     *
     * offset      \u5F53\u524D\u5143\u7D20\u7684\u504F\u79FB
     * count       \u5B50\u5143\u7D20\u7684\u603B\u4E2A\u6570
     * orientation \u504F\u79FB\u7684\u65B9\u5411，next > 0, prev < 0;
     */
    function getZIndex(offset, count, orientation) {
        return count - 2 * Math.abs(offset) + (offset * orientation < 0 ? 1 : 0);
    }

    /**
     * \u8BA1\u7B97\u5B50\u5143\u7D20\u7684 offset，offset = 0 \u7684\u5143\u7D20\u5373\u4E3A\u5F53\u524D\u7126\u70B9\u5143\u7D20
     *
     * @param index \u5F53\u524D\u5143\u7D20\u5728\u5B50\u5143\u7D20\u4E2D\u7684 index
     * @param activeIndex \u5F53\u524D
     */
    function getOffset(index, activeIndex, count) {
        var maxOffset = Math.floor((count - 1) / 2);
        var offset = (index - activeIndex + count) % count;
        return offset > maxOffset ? offset - count : offset;
    }

})(jQuery);
