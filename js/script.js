var transforms = {
    'scale': 1, 'translateX': '0px', 'translateY': '0px',
    'perspective': '400px', 'rotateX': '0deg', 'rotateY': '0deg', 'scaleZ': '1',
    'rotateZ': '0deg', 'translateZ': '0px'
};

var $c; // will hold container where transforms are made

jQuery(document).ready(function() {

    // attach the plugin to an element
    $('#wrapper').gitdown( {    'title': 'Traversal',
                                'file': 'README.md',
                                'callback': main
    } );
    var $gd = $('#wrapper').data('gitdown');

    function main() {
        $c = $('.inner').addClass('inner');
        $('.info .toc a.current').removeClass('current');
        position_sections();
        configure_sections();
        register_events();
        update_transform(transforms);
    }

    function update_transform(t) {
        var str = '';
        for ( key in t ) {
            str += `${key}(${t[key]}) `;
        }
        $c.css( 'transform', str );
    }

    function position_sections() {
        var docwidth = $(document).width();
        var $sections = $('.section *');
        if ( $sections.length > 0 ) {
            // find attributes and position section
            $sections.children().each(function() {
                var comments = $(this).getComments();
                if ( comments.length > 0 ) {
                    // comment found, extract attributes
                    var text = comments[0];
                    var s = text.substr(text.indexOf("{") + 1).split('}')[0];
                    var pairs = s.split(',');
                    for ( var i = 0; i < pairs.length; i++ ) {
                        var key = pairs[i].split(':')[0];
                        var value = pairs[i].split(':')[1];
                        $(this).closest('.section').css( key, value );
                    }
                }
            });
        }

        // iterate over sections and position elements if they're at 0,0
        var counter = 0;
        var left = 0;
        var top = 0;
        $('.section').each(function() {
            var position = $(this).position();
            if ( position.top === 0 && position.left === 0 ) {
                // set default values for section positions
                if ( counter > 0 ) {
                    var prev_width = $(this).prev('.section').width();
                    // increment height if width of document is surpassed
                    if ( left > docwidth - prev_width * 2 ) {
                        left = 0;
                        top += $(this).prev('.section').height();
                    } else {
                        left += prev_width;
                    }
                    $(this).css( {top: top, left: left} );
                }
                counter += 1;
            }
        });
    }

    function configure_sections() {
        $('.section').each(function() {
            
            var $s = $(this);

            // quickly add a draggable class for drag method
            $s.addClass('draggable');

            // set initial position values
            var x = $s.css('left').slice( 0, -2 );
            var y = $s.css('top').slice( 0, -2 );
            $s.attr('data-x', x);
            $s.attr('data-y', y);
        });
    }

    // return a transform for container based on element e
    function transform_focus(element) {
        var t = '';

        var e = document.getElementById( element.substr(1) );
        var x = e.offsetLeft;
        //x -= e.parentNode.offsetLeft;
        var y = e.offsetTop;
        //y -= e.parentNode.offsetTop;
        var w = e.offsetWidth;
        var h = e.offsetHeight;

        var maxwidth = window.innerWidth;
        var maxheight = window.innerHeight;

        // center viewport on section
        var translateX = x - (maxwidth/2) + w/2;
        var translateY = y - (maxheight/2) + h/2;

        transforms['translateX'] = -translateX + 'px';
        transforms['translateY'] = -translateY + 'px';

        // scale transform based on window dismentions
        var translateZ = Math.min( 
            maxwidth / w,
            maxheight / h
          );

        //var scale = 1;
        transforms['scaleZ'] = translateZ;// / 2;

        update_transform(transforms);
    }

    function register_events() {

        $('a[href^=#]').click(function(e){
            e.preventDefault();
            // remove .current class
            $('.section').removeClass('current');
            //e.classList.add('current');           
            var element = this.getAttribute('href');
            $(element).addClass('current');
            transform_focus(element);
        });

        // target elements with the "draggable" class
        interact('.draggable').allowFrom('.handle-heading')
            .draggable({
                // enable inertial throwing
                inertia: false,
                // keep the element within the area of it's parent
                restrict: {
                restriction: 'self',
                endOnly: true,
                elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
            },
            // enable autoScroll
            autoScroll: true,

            // call this function on every dragmove event
            onmove: dragMoveListener,
            // call this function on every dragend event
            onend: function (event) {
                $(event.target).removeClass('no-transition');
            }
        });

        // target elements with the "draggable" class
        interact('.inner').draggable({
            // enable inertial throwing
            inertia: false,

            // enable autoScroll
            autoScroll: true,

            // call this function on every dragmove event
            onmove: dragMoveListener,
            onend: function (event) {
                $(event.target).removeClass('no-transition');
            }
        });

        // mousewheel zoom handler
        $('.inner').on('wheel', function(event){
            event.preventDefault();
            var scale = parseFloat( transforms['scale'] );
            if( event.originalEvent.deltaY < 0 ) {
                transforms['scale'] = scale + 0.25;// + 'px';
            } else{
                transforms['scale'] = scale - 0.25;// + 'px';
            }
            update_transform(transforms);
        });

    }

    function create_section(x,y){
        var name = 'New Section';
        name = unique_name(name);
        var html = default_section_html(name);
        $('.inner').append(html);
        $s = $( '#' + $gd.clean(name) );
        $s.css( { "top": y + 'px', "left": x + 'px' } );
        $s.css( { "width": '200px', "height": '100px' } );
        $s.attr( 'data-x', x).attr( 'data-y', y );
        $s.find('.content').click(function(){
            var content = '';
            var id = $(this).parent().attr('id');
            render_editor(id);
        });
    }

    function default_section_html(name) {
        var id = $gd.clean(name);
        var html = '<div class="section heading draggable" id="' + id + '">';
        html += '<h2 class="handle-heading">';
        html += '<a class="handle" name="' + id + '">' + name + '</a>'
        html += '</h2>';
        html += '<div class="content">';
        html += '<p>New content</p>';
        html += '</div>'; // .content
        html += '</div>'; // .section
        return html;
    }

    // drag handler
    function dragMoveListener (event) {
        event.preventDefault();
        var target = event.target;
        var $target = $(target);

        $(target).addClass('no-transition');
        
        // keep the dragged position in the data-x/data-y attributes
        var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
        var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

        if ( $target.hasClass('inner') ) {
            var x = parseFloat( transforms['translateX'] );
            var y = parseFloat( transforms['translateY'] );
            transforms['translateX'] = x - event.dx + 'px';
            transforms['translateY'] = y - event.dy + 'px';
            update_transform(transforms);
        } else {
            $target.css('top', y + 'px');
            $target.css('left', x + 'px');

            // update the position attributes
            $target.attr('data-x', x);
            $target.attr('data-y', y);
        }
    }

});
