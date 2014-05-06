(function() {

require(['$api/models', '$views/list#List'], function(models,List) {


            // Handle drops
            var dropBox = document.querySelector('#drop-box');

            dropBox.addEventListener('dragstart', function(e){
                e.dataTransfer.setData('text/html', this.innerHTML);
                e.dataTransfer.effectAllowed = 'copy';
            }, false);

            dropBox.addEventListener('dragenter', function(e){
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                this.classList.add('over');
            }, false);

            dropBox.addEventListener('dragover', function(e){
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                return false;
            }, false);

            dropBox.addEventListener('dragleave', function(e){
                e.preventDefault();
                this.classList.remove('over');
            }, false);

            dropBox.addEventListener('drop', function(e){
                e.preventDefault();
               

                var drop = models.Playlist.fromURI(e.dataTransfer.getData('text'));
                this.classList.remove('over');
                var successMessage = document.createElement('p');
                successMessage.innerHTML = 'Playlist successfully dropped: ' + drop.uri;
                this.appendChild(successMessage);

                var playlist = models.Playlist.fromURI(drop.uri);
                var list = List.forPlaylist(playlist);
                var urilist = [];

				var recent = [];
				$.getJSON("http://ws.audioscrobbler.com/2.0/?method=user.getRecentTracks&user=feeefles&api_key=10738a09187adc62d9f3e7863e09ce32&format=json&callback=?", 
					function(data) {
						data.recenttracks.track.forEach(function(item) {
							recent.push(item.name);
						});
					}).done(function(data){
						console.log(recent);
						playlist.load('tracks').done(function(playlist) {
							playlist.tracks.snapshot().done(function(trackSnapshot) {
								var tracks = trackSnapshot.toArray();
								tracks.forEach(function(track) {

									track.load('name', 'artists').done(
										function(track) {
											addTrack(track, recent, urilist);
										});

									// });

									});
								displayTracks(urilist);
										
								});
							});
							
						});
					// });

            }, false);

		var displayTracks = function(urilist) {
			var temp = models.Playlist.createTemporary("tempplaylist_"+new Date().getTime())
			.done(function(playlist) {

				playlist.load('tracks').done(function(loadedPlaylist) {
					loadedPlaylist.tracks.clear().done(function () {
						promises = _.map(urilist, function(uri) {
							return loadedPlaylist.tracks.add(models.Track.fromURI(uri));
						});
						models.Promise.join(promises).done(function() {
							var list = List.forPlaylist(loadedPlaylist);
							document.getElementById('playlist-player').appendChild(list.node);
							list.init();
						});

					});
				});
			});
		};

		var addTrack = function(track, recent, urilist) {

			//TODO: add artist check too!
					track.load('name', 'artists').done(function(track) {
						var artists = track.artists;
						var artistsList = [];
						for (var i = 0; i < artists.length; i++) {
							artistsList.push(artists[i].name);
							}
						var index = $.inArray(track.name, recent);
						var i2 = $.inArray(track.uri, urilist);
							if ((index == -1) && (i2 == -1)) {
								urilist.push(track.uri);
								// var addedTrackRow = document.createElement('p');
								// addedTrackRow.innerHTML = "Added track: " + artistsList.join(', ') + ' - ' + track.name;
								// document.getElementById('playlist-player').appendChild(addedTrackRow);
						}
					});
                };


    });
}());