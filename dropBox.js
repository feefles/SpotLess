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
               
                console.log(SEL);

                var drop = models.Playlist.fromURI(e.dataTransfer.getData('text'));
                this.classList.remove('over');
                var successMessage = document.createElement('p');
                successMessage.innerHTML = 'Playlist successfully dropped: ' + drop.uri;
                this.appendChild(successMessage);

                var playlist = models.Playlist.fromURI(drop.uri);
                var urilist = [];

				var recent = [];
				var genres = {};
				getLastFm(recent).done(function(data){
						playlist.load('tracks').done(function(playlist) {
							return playlist;})
						.done(function(playlist) {
							playlist.tracks.snapshot().done(function(trackSnapshot) {
								return trackSnapshot;})
								
							.done(function(trackSnapshot) {
								tracks = trackSnapshot.toArray();
	
								tracks.forEach(function(track) {

									track.load('name', 'artists').done(
										function(track) {
											addTrack(track, recent, urilist);									
										});


									});

									displayTracks(urilist, tracks);
										
								});
							});
							
						});
					// });

            }, false);
	
		var getLastFm = function(recent) {
			return $.getJSON("http://ws.audioscrobbler.com/2.0/?method=user.getRecentTracks&user=feeefles&api_key=10738a09187adc62d9f3e7863e09ce32&format=json&callback=?", 
					function(data) {
						data.recenttracks.track.forEach(function(item) {
							recent.push(item.name);
						});
					});
		};
		var displayTracks = function(urilist, tracks) {
			var temp = models.Playlist.createTemporary("tempplaylist_"+new Date().getTime())
			.done(function(playlist) {

				playlist.load('tracks').done(function(loadedPlaylist) {
					loadedPlaylist.tracks.clear().done(function () {
						promises = _.map(urilist, function(uri) {
							return loadedPlaylist.tracks.add(models.Track.fromURI(uri));
						});
						models.Promise.join(promises).done(function() {
							sortDisplay(loadedPlaylist, tracks);
						});

					});
				});
			});
		};

		var sortDisplay = function(playlist, tracks) {
			var genreslist = {};
			var list;
			var lists;
			if (SEL == "All") {
				list = List.forPlaylist(playlist);
				document.getElementById('playlist-player').appendChild(list.node);
				list.init();
			}
			else if (SEL == "Popularity") {
				var sorted = playlist.tracks.sort('popularity', 'desc');
				list = List.forPlaylist(sorted);
				document.getElementById('playlist-player').appendChild(list.node);
				list.init();	
			}
			else if (SEL == "Genre") {
				var GenrePromise = function(track) {
					var promise = new models.Promise();
					track.load('artists').done(function(track) {
						var that = this;
						track.artists[0].load('genres').done(function(artist) {
							genreslist = updateGenres(artist.genres[0], genreslist, track);
							promise.setDone();
						});
					});
					return promise;
				};
				var gPromises = _.map(tracks, function(track) {
					var T = models.Track.fromURI(track.uri);
					return GenrePromise(T);
				});
				models.Promise.join(gPromises).done(function() {
					console.log(genreslist);
					for (var genre in genreslist) {
						console.log(genre);
						var newDiv = document.createElement('div');
						newDiv.id = genre;
						newDiv.className = "song-container";
						document.getElementById('playlist-player').appendChild(newDiv);
						document.getElementById('playlist-player').appendChild(document.createElement('br'));

						var t = models.Playlist.createTemporary('temp_genre'+genre)
						.done(function(g_playlist) {
							return g_playlist;
						}).done(function(g_playlist) {
							g_playlist.load('tracks')
						.done(function(g_playlist) {
							var lists = [];
							g_playlist.tracks.clear().done(function() {
								var promises = _.map(genreslist[genre], function(uri) {
									console.log(uri);
									return g_playlist.tracks.add(models.Track.fromURI(uri));
								});
								models.Promise.join(promises).done(function() {
									var l = List.forPlaylist(g_playlist);
									document.getElementById(genre).appendChild(l.node);
									l.init();
									});
								});
							});
						});

					}
				});
	
			}
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
				}
			});
        };


        var updateGenres = function(genre, genreslist, track) {
        	genre = genre || 'none';
			if (genreslist.hasOwnProperty(genre)) {
				genreslist[genre].push(track.uri);
			}
			else {
				genreslist[genre] = [track.uri];
			}
			return genreslist;
		};
    });
}());