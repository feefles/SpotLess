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
                var trackList = [];

                console.log(trackList);
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
									track.load('name', 'artists').done(function(track) {
										trackList.push(track.name);
										var artists = track.artists;
										var artistsList = [];
										for (var i = 0; i < artists.length; i++) {
											artistsList.push(artists[i].name);
										}
										if ($.inArray(track.name, recent) == -1) {
											var addedTrackRow = document.createElement('p');
											addedTrackRow.innerHTML = "Added track: " + artistsList.join(', ') + ' - ' + track.name;
											document.getElementById('playlist-player').appendChild(addedTrackRow);
											}
										});
									});
								});
							});

						});
					// });


                


            }, false);
		var addTrack = function(track) {
					track.load('name', 'artists').done(function(track) {
						var artists = track.artists;
						var artistsList = [];
						for (var i = 0; i < artists.length; i++) {
							artistsList.push(artists[i].name);
							}
						var index = $.inArray(track.name);
							if (index == -1) {
								var addedTrackRow = document.createElement('p');
								addedTrackRow.innerHTML = "Added track: " + artistsList.join(', ') + ' - ' + track.name;
								document.getElementById('playlist-player').appendChild(addedTrackRow);
						}
					});
                };


    });
}());