var http = require("http");
var url = require('url');
var fs = require('fs');
var io = require('socket.io');
var _ = require('lodash');

// set port and ip
var port = 8080;
var ip = "127.0.0.1";

var server = http.createServer(function(request, response) {
  var path = url.parse(request.url).pathname;

  if (path === '/') {
    fs.readFile('./client/index.html', function(error, data) {
      if (error) {
        response.writeHead(404);
        response.write("Not found - 404");
        response.end();
      } else {
        response.writeHead(200, {
          "Content-Type": "text/html"
        });
        response.write(data, "utf8");
        response.end();
      }
    });
  } else {
    response.writeHead(404);
    response.write("Not found - 404");
    response.end();
  }
});


var listener = io.listen(server);

var activePlayers = {}; // Array to store players in game
var waitingPlayers = []; // Array to store players on deck
var playerIDCounter = 0;

// send message to active players
var msgActivePlayers = function(target, message) {
  _.each(activePlayers, function(player) {
    listener.to(player.id).emit(target, message);
  })
};

listener.sockets.on('connection', function(socket) {

  // on page load, add player
  socket.on('add_player', function(callback) {
    var playerNum = Object.keys(activePlayers).length;
    // game underway
    if (playerNum === 2) {
      // add player to wait array
      var waitingPlayer = {};
      socket.playerName = playerIDCounter++;
      waitingPlayer[socket.playerName] = socket;
      waitingPlayers.push(waitingPlayer);
      console.log('------------------------- add to waitingPlayers: ', waitingPlayers.length);

      var state = {
          gameState: false,
          msg: 'game underway',
          playerId: socket.playerName
        }
      // update client state
      callback(state);
    } else {
      // add player to active game array
      socket.playerName = playerIDCounter++;
      activePlayers[socket.playerName] = socket;
      console.log('------------------------- add to activePlayers: ', Object.keys(activePlayers));

      // no players, waiting for an opponent to join
      if (playerNum === 0) {
        state = {
          gameState: false,
          msg: 'waiting for opponent',
          playerId: socket.playerName
        }
      }
      // player waiting, play game
      if (playerNum === 1) {
        state = {
          gameState: true,
          msg: 'play game',
          playerId: socket.playerName
        }
      }
      // update client state
      callback(state);
      msgActivePlayers('game_state', state);
    }
  });

  // when a player disconnects
  socket.on('disconnect', function(data) {
    if (!socket.playerName) return;
    console.log('xxxxxxxxxxxxxxxxxxxxxxxxx remove player: ', socket.playerName);
    // remove player from active game array
    if (socket.playerName in activePlayers) {
      delete activePlayers[socket.playerName];
      console.log('xxxxxxxxxxxxxxxxxxxxxxxxx update activePlayers: ', Object.keys(activePlayers));
    // remove player from wait array
    } else {
      var updateWaitingPlayers = _.filter(waitingPlayers, function(player) {
        return !(socket.playerName in player)
      })
      waitingPlayers = updateWaitingPlayers;
    }
    // need opponent and players waiting
    if (Object.keys(activePlayers).length < 2 && waitingPlayers.length !== 0) {

      // move next waiting player to active game array
      var nextPlayer = waitingPlayers.shift();
      activePlayers[Object.keys(nextPlayer)[0]] = nextPlayer[Object.keys(nextPlayer)[0]];
      console.log('xxxxxxxxxxxxxxxxxxxxxxxxx add to activePlayers: ', Object.keys(activePlayers));
      // update player messages
      if (Object.keys(activePlayers).length === 2) {
        var state = {
          gameState: true,
          msg: 'play game'
        }
      } else {
        state = {
          gameState: false,
          msg: 'waiting for opponent'
        }
      }
      // update client state
      msgActivePlayers('game_state', state);
    } else {
      state = {
        gameState: false,
        msg: 'waiting for opponent'
      }
      // update client state
      msgActivePlayers('game_state', state);
    }
  });

  // placeholder to capture player moves
  socket.on('send_move', function(x, y) {
    var x = x.trim();
    var y = y.trim();
    console.log('************************* move playerId: ' + socket.playerName + ' --> x: ' + x + ' y: ' + y);
    // insert logic to verify moves and determine win/draw
    msgActivePlayers('game_play', 'return logic');
  });

  // send server time to all players
  setInterval(function() {
    var time = new Date();
    var curr_hour = time.getHours();
    var curr_min = time.getMinutes();
    var curr_sec = time.getSeconds();
    time = curr_hour + ":" + curr_min + ":" + curr_sec;
    socket.emit('date', {
      'date': time
    });
  }, 1000);
});

console.log("Listening on http://" + ip + ":" + port);
server.listen(port, ip);