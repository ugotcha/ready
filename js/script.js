var transforms = {
    'scale': 1, 'translateX': '0px', 'translateY': '0px',
    'perspective': '400px', 'rotateX': '5deg', 'rotateY': '0deg', 'scaleZ': '1',
    'rotateZ': '5deg', 'translateZ': '0px'
};

var $c; // will hold container where transforms are made

jQuery(document).ready(function () {

    // attach the plugin to an element
    $('#wrapper').gitdown({
        'title': 'Treverse',
        'file': 'README.md',
        'callback': main
    });
    var $gd = $('#wrapper').data('gitdown');
    var eid = '#wrapper';
    var eid_inner = eid + ' .inner';
    var inner_width = $(eid_inner).width();
    var inner_height = $(eid_inner).height();

    function main() {
        $c = $('.inner').addClass('inner');

        position_sections();
        configure_sections();
        register_events();

        // move to current section
        var $current = $('.info .toc a.current');
        $current.removeClass('current');
        $current.click();

        // for cases where only one section exists
        var id = $(eid + ' .section.current').attr('id');
        if ($gd.settings.loaded) {
            transform_focus(id);
        }
    }

    function default_section_html(name, content) {
        var id = $gd.clean(name);
        var html = '<div class="section heading" id="' + id + '">';
        html += '<h2 class="handle-heading">';
        html += '<a class="handle" name="' + id + '">' + name + '</a>'
        html += '</h2>';
        html += '<div class="content">';
        html += content;
        html += '</div>'; // .content
        html += '</div>'; // .section
        return html;
    }


    function position_sections() {
        
        // start by adding some padding around .inner
        var w = inner_width;
        var h = inner_height;

        $(eid_inner).width( w + w/2 );
        $(eid_inner).height( h + h/2 );

        var $sections = $('.section *');
        if ($sections.length > 0) {
            // find attributes and position section
            $sections.children().each(function () {
                var comments = $(this).getComments();
                if (comments.length > 0) {
                    // comment found, extract attributes
                    var text = comments[0];
                    var s = text.substr(text.indexOf("{") + 1).split('}')[0];
                    var pairs = s.split(',');
                    for (var i = 0; i < pairs.length; i++) {
                        var key = pairs[i].split(':')[0];
                        var value = pairs[i].split(':')[1];
                        if (key === 'left') {
                            value = parseFloat(value) + w / 2;
                        } else if (key === 'top') {
                            value = parseFloat(value) + h / 2;
                        } else if (key === 'transform') {
                            // special case, we'll add a data-transform attr
                            $(this).closest('.section').css('transform', value);
                            $(this).closest('.section').attr('data-transform', value);
                        }
                        $(this).closest('.section').css(key, value);
                    }
                }
            });
        }

        // now position elements that don't have position comments
        var padding = 20;
        var divisor = 8;
        if ( $gd.settings.heading === 'p' || $gd.settings.heading === 'lyrics' ) {
            padding = 10;
            divisor = 2;
        }
        var counter = 0;
        var left = w / divisor;
        var top = h / divisor;
        var row_height = 0;
        $(eid + ' .section').each(function () {

            // calculate and update section height
            var height = $(this).find('.content').height();
            var $heading = $(this).find('.handle-heading');
            if ( $heading.is(":visible") ) {
                height += $(this).find('.handle-heading').height();
            }

            // row_height will be the height of the tallest section in the current row
            if ( height > row_height ) row_height = height;

            var x = parseFloat( $(this).css('left') );
            var y = parseFloat( $(this).css('top') );
            if ( x === 0 && y === 0 ) {
                $(this).height(height + padding);
                // set default values for section positions
                if (counter > 0) {
                    var prev_width = $(this).prev('.section').width() + padding;
                    // setup allowed_width to enforce single column when p tag used for heading
                    var allowed_width = w;
                    if ( $gd.settings.heading === 'p' || $gd.settings.heading === 'lyrics' ) {
                        allowed_width = prev_width;
                    }
                    // increment height if width of document is surpassed
                    if ( left > allowed_width - (prev_width * 1) ) {
                        left = w / divisor;
                        top += row_height + padding;
                        var compare = top + (( row_height + padding ) * 2);
                        var h2 = parseFloat( $(eid_inner).height() );
                        if ( compare > h2 ) {
                            $(eid_inner).height(h2 * 3);
                            console.log ( h2, $(eid_inner).height() );
                        }
                        row_height = 0;
                    } else {
                        left += prev_width;
                    }
                }
                $(this).css({ top: top, left: left });
                counter += 1;
            }
        });
    }

    function configure_sections() {
        $('.section').each(function () {

            var $s = $(this);

            // set initial position values
            var x = parseFloat($s.css('left'));
            var y = parseFloat($s.css('top'));
            $s.attr('data-x', x);
            $s.attr('data-y', y);
        });
    }

    function update_transform(t) {
        var str = '';
        for (key in t) {
            str += `${key}(${t[key]}) `;
        }
        $c.css('transform', str);
    }


    // helper method to revert transform for easy calculation of next transform
    function default_transform() {
        var t = {
            'scale': 1, 'translateX': '0px', 'translateY': '0px',
            'perspective': '400px', 'rotateX': '0deg', 'rotateY': '0deg', 'scaleZ': '1',
            'rotateZ': '0deg', 'translateZ': '0px'
        };
        update_transform(t);
    }


    // return a transform for container based on element e
    function transform_focus(element) {
        // reset transform prior to calculation
        default_transform();
        var t = '';

        var e = document.getElementById(element);
        var x = e.offsetLeft;
        var y = e.offsetTop;
        var w = e.offsetWidth;
        var h = e.offsetHeight;

        // we'll add some padding til we find a more optimal way to center element
        var padding = 50;
        h += padding;

        var maxwidth = window.innerWidth;
        var maxheight = window.innerHeight;

        // center viewport on section
        var translateX = x - (maxwidth / 2) + w / 2;
        var translateY = y - (maxheight / 2) + h / 2;

        transforms['translateX'] = -translateX + 'px';
        transforms['translateY'] = -translateY + 'px';

        $('.inner').css('transform-origin', `${x + w / 2}px ${y + h / 2}px`);

        // scale current section to fit window
        scale = Math.min(maxwidth / (w * 1.5), maxheight / (h * 1.5));
        transforms['translateZ'] = scale * 100 + 'px';
        update_transform(transforms);
    }

    function register_events() {

        // update transform on window resize
        window.addEventListener('resize', function (e) {
            var id = $(eid + ' .section.current').attr('id');
            transform_focus(id);
        });

        $(eid + ' .info .field.select.mode').click(function () {
            configure_mode();
        });

        $('a[href^=#]').click(function (e) {
            // we unfortunately need to override default browser behavior for local links
            e.preventDefault();
            // remove .current class
            $('.section.current').removeClass('current');
            var element = this.getAttribute('href');
            $(element).addClass('current');
            transform_focus(element.substr(1));
            //update toc
            $('.info .toc a.current').removeClass('current');
            $(`.info .toc a[href="${element}"]`).addClass('current');
            // scroll to top of current link in toc
            var t = $(' .info .toc');
            var c = $(' .info .toc a.current');
            if (c.length > 0) {
                t.animate({ scrollTop: t.scrollTop() + (c.offset().top - t.offset().top) });
            }
        });

        if ($gd.settings.loaded) {
            // LEFT and RIGHT arrows
            document.addEventListener('keyup', (event) => {
                var key = event.key;
                if (key === 'ArrowLeft') {
                    var $prev = $('.toc a.current').prev()[0];
                    if (typeof $prev === "undefined") {
                        $('.toc a:last-child')[0].click();
                    } else $prev.click();
                } else if (key === 'ArrowRight') {
                    var $next = $('.toc a.current').next()[0];
                    if (typeof $next === "undefined") {
                        $('.toc a:first-child')[0].click();
                    } else $next.click();
                }
            }, false);
        }

    }

});
