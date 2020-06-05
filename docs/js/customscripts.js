
$('#mysidebar').height($(".nav").height());


document.addEventListener("DOMContentLoaded", function() {
  /**
   * AnchorJS
   */
  anchors.add('h2,h3,h4,h5');

});

$( document ).ready(function() {
    var wh = $(window).height();
    var sh = $("#mysidebar").height();

    if (sh + 100 > wh) {
        $( "#mysidebar" ).parent().addClass("layout-sidebar__sidebar_a");
    }
    // activate tooltips. although this is a bootstrap js function, it must be activated this way in your theme.
    $('[data-toggle="tooltip"]').tooltip({
        placement : 'top'
    });

});

// needed for nav tabs on pages. See Formatting > Nav tabs for more details.
// script from http://stackoverflow.com/questions/10523433/how-do-i-keep-the-current-tab-active-with-twitter-bootstrap-after-a-page-reload
$(function() {
    var json, tabsState;
    $('a[data-toggle="pill"], a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
        var href, json, parentId, tabsState;

        tabsState = localStorage.getItem("tabs-state");
        json = JSON.parse(tabsState || "{}");
        parentId = $(e.target).parents("ul.nav.nav-pills, ul.nav.nav-tabs").attr("id");
        href = $(e.target).attr('href');
        json[parentId] = href;

        return localStorage.setItem("tabs-state", JSON.stringify(json));
    });

    tabsState = localStorage.getItem("tabs-state");
    json = JSON.parse(tabsState || "{}");

    $.each(json, function(containerId, href) {
        return $("#" + containerId + " a[href=" + href + "]").tab('show');
    });

    $("ul.nav.nav-pills, ul.nav.nav-tabs").each(function() {
        var $this = $(this);
        if (!json[$this.attr("id")]) {
            return $this.find("a[data-toggle=tab]:first, a[data-toggle=pill]:first").tab("show");
        }
    });
});

// Load versions and append them to topnavbar
$(document).ready(function () {
  // releasesInfo variable generates by generate_artifacts script and loads in head on the build stage as channels.js;
  var releasesInfo = window.releasesInfo;

  if (releasesInfo === undefined || releasesInfo.menuChannels === undefined) return;

  var menu = $('#doc-versions-menu');
  var toggler;
  var currentRelease = $('#werfVersion').text();
  var currentChannel = $('#werfChannel').text();
  if (!currentRelease) currentRelease = 'local';
  if (!currentChannel) currentChannel = 'local';
  let _current_channel;

  releasesInfo.menuChannels.sort((prev, next) => {
    if ( parseFloat(prev.group) > parseFloat(next.group) ) return -1;
    if ( parseFloat(prev.group) < parseFloat(next.group) ) return 1; });

  if (typeof releasesInfo === 'undefined' || releasesInfo == null) {
    console.log('releasesInfo is not defined, assume local mode');
    releasesInfo = {};
  } else {
    if (currentChannel === 'root') {

      for (group of releasesInfo.menuChannels) {
        for (channel of releasesInfo.orderedChannels) {
          if (channel === 'rock-solid') continue;
          _current_channel = group.channels.filter(function (el) {
            return ((el.version === currentRelease) && (el.name === channel));
          });
          if (_current_channel.length) {
            currentChannel = group.group + '-' + channel;
            break;
          }
        }
        if (_current_channel.length) break
        else {
          // if (currentRelease === group.channels['rock-solid'].version)
          if (group.channels.filter(function (el) {
            return ((el.version === currentRelease) && (el.name === 'rock-solid') )}))
            currentChannel = group.group + '-rock-solid';
        }
      }
    }

    var docSubURL = document.location.pathname.match(/^.*\/documentation(\/.*)$/);
    if (docSubURL && docSubURL[1]) {
      docSubURL = '/documentation' + docSubURL[1];
    } else docSubURL = '/documentation/';

    var submenu = $('<ul class="header__submenu">');
    $.each(releasesInfo.menuChannels, function (j, group) {
      $.each(releasesInfo.orderedChannels, function (i, channel) {

        var channel_version = '';
        if (channel !== 'review') {
          var _channel_version = group.channels.filter(function (el) {
            return el.name === channel;
          })[0];
          if (_channel_version) channel_version = _channel_version.version;
        } else channel_version = 'review';

        if (channel_version) {
          var link = $('<a href="/v' + group.group + '-' + channel + docSubURL +'">');
          if (channel !== 'review') {
            link.append('<span class="header__submenu-item-channel"> ' + group.group + '-' + channel + '</span>');
            link.append('<span class="header__submenu-item-release"> — ' + channel_version + '</span>');
          }

          var item = $('<li class="header__submenu-item">');
          item.html(link);
          if ((group.group + '-' + channel !== currentChannel)) submenu.append(item);
        }
      });
    })
  }

  if (submenu && submenu[0] && submenu[0].children && submenu[0].children.length) {
    menu.append($('<div class="header__submenu-container">').append(submenu));
    menu.addClass('header__menu-item header__menu-item_parent');
    if (document.location.pathname === '/') {
      toggler = $('<a href="/documentation/">');
    } else {
      toggler = $('<a href="#">');
    }
  } else {
    menu.addClass('header__menu-item');
    toggler = $('<span class="header__menu-item-static">');
  }

  toggler.append(currentChannel || 'Versions');
  if (currentChannel && !((currentChannel === 'local') || (currentChannel === 'review'))) {
    toggler.append('<span class="header__menu-item-extra"> – ' + currentRelease + '</span>');
  }
  menu.prepend(toggler);
  $('.header__menu').addClass('header__menu_active')

});


// Update github counters
$(document).ready(function () {
  $.get("https://api.github.com/repos/flant/werf", function (data) {
    $(".gh_counter").each(function (index) {
      $(this).text(data.stargazers_count)
    });
  });
});


// Update roadmap steps
$(document).ready(function () {
  $('[data-roadmap-step]').each(function (index) {
    var $step = $(this);
    $.get('https://api.github.com/repos/flant/werf/issues/' + $step.data('roadmap-step'), function (data) {
      if (data.state === 'closed') {
        $step.addClass('roadmap__steps-list-item_closed');
      }
    });
  });

});

$(document).ready(function () {
  var $header = $('.header');

  function updateHeader() {
    if ($(document).scrollTop() == 0) {
      $header.removeClass('header_active');
    } else {
      $header.addClass('header_active');
    }
  }

  $(window).scroll(function () {
    updateHeader();
  });
  updateHeader();
});

$(document).ready(function () {
  $('.header__menu-icon_search').on('click tap', function () {
    $('.topsearch').toggleClass('topsearch_active');
    $('.header').toggleClass('header_search');
    if ($('.topsearch').hasClass('topsearch_active')) {
      $('.topsearch__input').focus();
    } else {
      $('.topsearch__input').blur();
    }
  });

  $('body').on('click tap', function (e) {
    if ($(e.target).closest('.topsearch').length === 0 && $(e.target).closest('.header').length === 0) {
      $('.header').toggleClass('header_search');
      $('.topsearch').removeClass('topsearch_active');
    }
  });
});

$(document).ready(function() {
  var adjustAnchor = function() {
      var $anchor = $(':target'), fixedElementHeight = 120;
      if ($anchor.length > 0) {
        $('html, body').stop().animate({
          scrollTop: $anchor.offset().top - fixedElementHeight
        }, 200);
      }
  };
  $(window).on('hashchange load', function() {
      adjustAnchor();
  });
});

$(document).ready(function(){
  // waint untill fonts are loaded
  setTimeout(function() {
    $('.publications__list').masonry({
      itemSelector: '.publications__post',
      columnWidth: '.publications__sizer'
    })
  }, 500)
});

$(document).ready(function(){

  $('h1:contains("Installation")').each(function( index ) {
    var $title = $(this);
    var $btn1 = $title.next('p');
    var $btn2 = $btn1.next('p');
    var $btn3 = $btn2.next('p');

    var new_btns = $('<div class="publications__install-btns">');
    new_btns.append($($btn1.html()).addClass('releases__btn'));
    new_btns.append($($btn2.html()).addClass('releases__btn'));
    new_btns.append($($btn3.html()).addClass('releases__btn'));

    $btn1.remove();
    $btn2.remove();
    $btn3.remove();
    $title.after(new_btns);
  });
});

// Presentation

$(document).ready(function() {

  var magic = new ScrollMagic.Controller();
  var magic_width = window.innerHeight > 700 ? 800 : 650;
  var magic_height = parseInt(magic_width/1.4);

  // Pin scheme
  new ScrollMagic.Scene({duration: 5000, offset: -1})
  .setPin('#presentation')
  .addTo(magic);

  // Move away title & move in scheme
  new ScrollMagic.Scene({duration: 500, offset: 10}).setTween(
    new TimelineMax()
    .to('#presentation-title', {x: '-2000px', opacity: 0}, 0)
    .to('#presentation-bg', {x: '-1500px'}, 0)
    .to('#presentation-scheme', {
      width: magic_width, 
      x: '-' + (1160 - magic_width)/2 + 'px',  
      y: + (45 + ((window.innerHeight - magic_height)/2) - (window.innerHeight > 700 ? ((window.innerHeight - 480)/2) : 130)) + 'px'
    }, 0))
  .addTo(magic);

  // Hide arrows & smart
  new ScrollMagic.Scene({duration: 100, offset: 550}).setTween(
    new TimelineMax()
    .to('#scheme_arrows_gw', {opacity: '0'}, 0)
    .to('#scheme_arrows_wd', {opacity: '0'}, 0)
    .to('#scheme_arrows_wk', {opacity: '0'}, 0)
    .to('#scheme_smart_2', {opacity: '0'}, 0)
    .to('#scheme_smart', {opacity: '0'}, 0)
  ).addTo(magic);

  // Git -> Werf, show
  new ScrollMagic.Scene({duration: 300, offset: 950}).setTween(
    new TimelineMax()
    .to('#scheme_arrows_gw', {opacity: '1'}, 0)
  ).addTo(magic);

  // Werf -> Docker Registry, show
  new ScrollMagic.Scene({duration: 300, offset: 1550}).setTween(
    new TimelineMax()
    .to('#scheme_arrows_wd', {opacity: '1'}, 0)
    .to('#scheme_smart_2', {opacity: '1'}, 0)
  ).addTo(magic);
  
  // Werf -> Docker Registry, sync
  new ScrollMagic.Scene({duration: 1000, offset: 2150}).setTween(
    new TimelineMax()
    .to('#scheme_smart_icon_update_arrows_2', {rotation: '-720', transformOrigin: '50% 50%'}, 0)
  ).addTo(magic);

  // Werf -> Docker Registry, show info
  new ScrollMagic.Scene({duration: 300, offset: 2750}).setTween(
    new TimelineMax()
    .to('#scheme_smart_icon_update_2', {opacity: '0'})
    .to('#scheme_smart_icon_check_2', {opacity: '1'})
    .to('#scheme_step', {opacity: '1'}, 0)
    .to('#scheme_step_connector', {opacity: '1'}, 0)
  ).addTo(magic);

  // Werf -> Kubernetes, show
  new ScrollMagic.Scene({duration: 300, offset: 3350}).setTween(
    new TimelineMax()
    .to('#scheme_arrows_wk', {opacity: '1'}, 0)
    .to('#scheme_smart', {opacity: '1'}, 0)
  ).addTo(magic);

  // Werf -> Kubernetes, sync
  new ScrollMagic.Scene({duration: 1000, offset: 3950}).setTween(
    new TimelineMax()
    .to('#scheme_smart_icon_update_arrows', {rotation: '-720', transformOrigin: '50% 50%'}, 0)
  ).addTo(magic);

  // Werf -> Docker Registry, show info  
  new ScrollMagic.Scene({duration: 300, offset: 4550}).setTween(
    new TimelineMax()
    .to('#scheme_smart_icon_update', {opacity: '0'})
    .to('#scheme_smart_icon_check', {opacity: '1'})
    .to('#scheme_step_2', {opacity: '1'}, 0)
    .to('#scheme_step_connector_2', {opacity: '1'}, 0)
  ).addTo(magic);
});
