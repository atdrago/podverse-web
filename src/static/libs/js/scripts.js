/*eslint-disable*/
'use strict';

// Set default values for vars that handle player crashes and autoplay functionality
window.restartAttempts = 0;
window.lastPlaybackPosition = -1;
window.endTimeHasBeenReached = false;

var convertSecToHHMMSS = function(sec) {
  // thanks to dkreuter http://stackoverflow.com/questions/1322732/convert-seconds-to-hh-mm-ss-with-javascript
  var totalSec = sec;

  var hours = parseInt(totalSec / 3600) % 24;
  var minutes = parseInt(totalSec / 60) % 60;
  var seconds = totalSec % 60;
  var result = '';

  if (hours > 0) {
    result += hours + ':';
  }

  if (minutes > 9) {
    result += minutes + ':';
  } else if (minutes > 0 && hours > 0) {
    result += '0' + minutes + ':';
  } else if (minutes > 0){
    result += minutes + ':';
  }

  if (seconds > 9) {
    result += seconds;
  } else if (seconds > 0 && minutes > 0) {
    result += '0' + seconds + ':';
  } else if (seconds > 0) {
    result += seconds;
  } else {
    result += '00';
  }

  return result
}

var readableDate = function(date) {
  return date.substring(0, 10);
}

var convertHHMMSSToSeconds = function (hhmmssString) {

  var hhmmssArray = hhmmssString.split(':'),
    hours = 0,
    minutes = 0,
    seconds = 0;

  if (hhmmssArray.length === 3) {
    hours = parseInt(hhmmssArray[0]);
    minutes = parseInt(hhmmssArray[1]);
    seconds = parseInt(hhmmssArray[2]);


    if (hours < 0 || minutes > 59 || minutes < 0 || seconds > 59 || seconds < 0) {
      console.log('errrror');
      return -1;
    }

    hours = hours * 3600;
    minutes = minutes * 60;

  } else if (hhmmssArray.length === 2) {
    minutes = parseInt(hhmmssArray[0]);
    seconds = parseInt(hhmmssArray[1]);

    if (minutes > 59 || minutes < 0 || seconds > 59 || seconds < 0) {
      console.log('errrror');
      return -1;
    }

    minutes = minutes * 60;

  } else if (hhmmssArray.length === 1) {
    seconds = parseInt(hhmmssArray[0]);

    if (seconds > 59 || seconds < 0) {
      console.log('errrror');
      return -1;
    }

  } else {
    console.log('errrror');
    return -1;
  }

  return hours + minutes + seconds;

}

// Podcast / Episode / Clip variables added to the window
// object in player.html

var loadmediaRef = function(index, shouldPlay) {
  var item = mediaRefs[index];

  // Only clips have a startTime and endTime
  startTime = item.startTime;
  endTime = item.endTime;

  if (window.startTime === 0 && window.endTime !== null) {
    isEpisode = true;
  } else {
    isEpisode = false;
  }

  if (isEpisode === false) {
    clipTitle = item.title;
    duration = item.duration;
    podcastTitle = item.episode.podcast.title;
    podcastImageURL = item.episode.podcast.imageURL;
    episodeTitle = item.episode.title;
    episodeMediaURL = item.episode.mediaURL;
    episodePubDate = item.episode.pubDate;
  } else { // handle item as episode
    clipTitle = "";
    duration = item.duration;
    podcastTitle = item.episode.podcast.title;
    podcastImageURL = item.episode.podcast.imageURL;
    episodeTitle = item.episode.title;
    episodeMediaURL = item.episode.mediaURL;
    episodePubDate = item.episode.pubDate;
    startTime = "0";
    endTime = item.duration;
  }

  window.location.hash = index + 1;

  setPlayerInfo();
  createAndAppendAudio();
  if (shouldPlay) {
    audio.play();
  }
}

var setPlayerInfo = function() {

  if (window.isPlayerPage) {

    if (window.startTime === 0 && window.endTime !== null) {
      isEpisode = true;
    } else {
      isEpisode = false;
    }

    if (isEpisode === false) {
      $('#player-image img').attr('src', podcastImageURL);
      $('#player-restart-clip').css('display', 'block');
      $('#player-title').css('padding', '0.75rem 0 1rem 0');
      $('#player-podcast-title').html(podcastTitle);
      $('#player-sub-title').html(episodeTitle);
      $('#player-condensed-title').html(clipTitle);
      $('#player-title').html(clipTitle);
      $('#player-stats-duration').html('Clip: ' + convertSecToHHMMSS(duration) + ' - ' + convertSecToHHMMSS(startTime) + ' to ' + convertSecToHHMMSS(endTime));
      $('#player-stats-listens').html('Listens: 1234');
      $('#player-restart-clip').html('Restart Clip');
    } else {
      $('#player-restart-clip').css('display', 'none');
      $('#player-title').css('padding', '0.5rem 0 0.75rem 0');
      $('#player-image img').attr('src', podcastImageURL);
      $('#player-podcast-title').html(podcastTitle);
      $('#player-sub-title').html(episodeTitle);
      $('#player-condensed-title').html(episodeTitle);
      $('#player-title').html('');
      $('#player-stats-duration').html('Full Episode: ' + readableDate(episodePubDate));
      $('#player-stats-listens').html('Listens: 1234');
    }

    window.restartAttempts = 0;
    window.lastPlaybackPosition = -1;
    window.endTimeHasBeenReached = false;
  }
}

setPlayerInfo();

var createAndAppendAudio = function() {

  if (isPlayerPage) {

    // If audio player elements are already on the page, remove them first.
    $('.mejs-offscreen').remove();
    $('.mejs-container').remove();

    window.audio = document.createElement('audio');
    audio.setAttribute('src', episodeMediaURL);
    audio.setAttribute('type', 'audio/mpeg');
    audio.setAttribute('codecs', 'mp3');
    audio.preload = "auto";
    $('#player').append(audio);

    $('audio').mediaelementplayer({
      alwaysShowHours: true
    });

    audio.onloadedmetadata = function() {
      // NOTE: If the lastPlaybackPosition is greater than -1, then the audio player must
      // have crashed and then restarted, and we should resume from the last saved
      // playback position. Else begin from the clip start time.
      if (lastPlaybackPosition > -1) {
        audio.currentTime = lastPlaybackPosition;
      } else {
        audio.currentTime = startTime || 0;
      }
    };

    audio.oncanplaythrough = function() {
      var autoplay = $.cookie('autoplay');
      if (autoplay === 'On') {
        audio.play();
      }
    }

    // When playing a clip, prevent issue where the media file starts playing
    // from the beginning for a split second before adjusting the startTime.
    var pauseBeforeFirstPlay = false;
    audio.onplaying = function() {
      if (!pauseBeforeFirstPlay) {
        audio.pause();
        setTimeout(function() {
          audio.play();
          pauseBeforeFirstPlay = true;
        }, 1);
      }
    }

    audio.ontimeupdate = function() {
      // Skip to start time once when the user first hits play on mobile devices
      if (lastPlaybackPosition == -1) {
          audio.currentTime = startTime;
      }

      // Stop the clip once when the end time has been reached
      if (Math.floor(audio.currentTime) == endTime && endTimeHasBeenReached == false) {
          endTimeHasBeenReached = true;
          audio.pause();
      }

      // TODO: Can this be made more efficient than rewriting the lastPlaybackPosition
      // whenever time updates?
      lastPlaybackPosition = audio.currentTime;
    };

    audio.onerror = function(e) {
      switch (e.target.error.code) {
        case e.target.error.MEDIA_ERR_ABORTED:
          console.log('Aborted the video playback.');
          break;
        // Chrome will frequently throw a MEDIA_ERR_NETWORK error and crash when seeking
        // to a position in a clip. I have encountered the issue with native HTML 5 Chrome
        // components, as well as with 3rd party libraries like JWPlayer and MediaElement.
        // The only work around for this bug I have found is to listen for the error,
        // then remove the <audio> element and recreate and append the audio element.
        // TODO: Is there a better work around or resolution for the Chrome bug?
        case e.target.error.MEDIA_ERR_NETWORK:
          console.log('A network error caused the audio download to fail.');
          if (restartAttempts < 5) {
            restartAttempts++;
            $('#player').empty();
            createAndAppendAudio();
          }
          break;
        case e.target.error.MEDIA_ERR_DECODE:
          console.log('The audio playback was aborted due to a corruption problem or because the video used features your browser did not support.');
          break;
        case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          console.log('The video audio not be loaded, either because the server or network failed or because the format is not supported.');
          break;
        default:
          console.log('An unknown error occurred.');
          break;
      }
    };
  }
};

$('#player-restart-clip').on('click', function() {
  audio.pause();
  endTimeHasBeenReached = false;
  audio.currentTime = startTime;
  audio.play();
});

$('#player-autoplay').on('click', function() {
  toggleAutoplay();
});

var toggleAutoplay = function() {
  var autoplay = $.cookie('autoplay');
  if (autoplay !== 'On') {
    $.cookie('autoplay', 'On');
    $('#player-autoplay').html('Autoplay On');
  } else {
    $.cookie('autoplay', 'Off');
    $('#player-autoplay').html('Autoplay Off');
  }
}

var createAutoplayBtn = function() {
  var autoplay = $.cookie('autoplay');
  if (autoplay === 'On') {
    $('#player-autoplay').html('Autoplay On');
  } else {
    $.cookie('autoplay', 'Off');
    $('#player-autoplay').html('Autoplay Off');
  }
}

// Toggle the autoplay to True by default on page load
// TODO: remove autoplay on mobile devices since they do not support autoplay
createAutoplayBtn();

$(document).ready(function() {
  createAndAppendAudio();
});

$('.playlist-item').on('click', function() {
  var index = $(".playlist-item").index(this);
  loadmediaRef(index, true);
});

if (isPlayerPage) {
  var topOfPlayer = $("#player").offset().top;
  var heightOfPlayer = $("#player").outerHeight();
  var bottomOfPlayer = topOfPlayer + heightOfPlayer;

  var topOfPlayerContainer = $('#player-container').offset().top;
  var heightOfPlayerContainer = $('#player-container').outerHeight() - 27; // Subtract to prevent page content from jumping
  var bottomOfPlayerContainer = topOfPlayerContainer + heightOfPlayerContainer;

  $(window).scroll(function(){
      if($(window).scrollTop() > (bottomOfPlayer)){
         $("#player-container").addClass('player-condensed');
         $('html').attr('style', 'padding-top: ' + bottomOfPlayerContainer + 'px;' );
      }
      else{
         $("#player-container").removeClass('player-condensed');
         $('html').attr('style', '');
      }
  });

}
