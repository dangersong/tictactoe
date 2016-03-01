var Game = function() {
  this.x = 1;
  this.y = 2;
  this._turnCounter = 1;
  this._players = [];
  this._board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  this._wins = [123, 147, 159, 258, 357, 369, 456, 789];
  this._lastWho = null;
};

Game.prototype.addPlayer = function(id) {
  return this._players.push(id);
};

Game.prototype.getPlayers = function() {
  return this._players;
};

Game.prototype.playerMove = function(player, square) {
  console.log('_lastWho', this._lastWho);
  // player?
  if (player !== 'A' && player !== 'B')
  {
    throw {
      "type"    : "error",
      "cb"      : "error",
      "success" : false,
      "msg"     : "Invalid player (" + player + ")"
    }
  }

  // Bad value, bad. Also, make sure square is whole.
  square = parseInt(square) >> 0;
  if (isNaN(square) || square < 0 || square > 8) 
  {
    throw {
      "type"    : "error",
      "cb"      : "error",
      "success" : false,
      "msg"     : "Invalid slot (" + square + ")"
    }
  }
  
  // Spot is taken
  if (this._board[square])
  {
    throw {
      "type"    : "error",
      "cb"      : "error",
      "success" : false,
      "msg"     : "Invalid slot (" + square + " already used.)"
    }
  }

  // It's not player's turn
  if (player === this._lastWho) {
    throw {
      "type"    : "error",
      "cb"      : "error",
      "success" : false,
      "msg"     : "It's not " + player + "'s turn."
    }
  }

  this._board[square] = this[player];
  this._turnCounter++;
  this._lastWho = player;

  return this._isWinner(player);
};

Game.prototype.reset = function() {
  this._board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  return true;
};

Game.prototype._getMoves  = function(player) {
  console.log('getMoves', player, Array.prototype.join.call(this._board, ', '));
  var res = '',
    i;
  for (i = 0, l = this._board.length; i < l; i++) {
    if (this._board[i] === this[player]) {
      res += (parseInt(i) + 1);
    }
  }
  return res;
};

Game.prototype._isWinner = function(player) {
  var vMoves = this._getMoves(player),
    vSplit, i;
  if (!vMoves) return false;

  for (i = 0, l = this._wins.length; i < l; i++) {
    vSplit = this._wins[i].toString().split('');
    if (vMoves.indexOf(vSplit[0]) !== -1 &&
      vMoves.indexOf(vSplit[1]) !== -1 &&
      vMoves.indexOf(vSplit[2]) !== -1) {
      return this._wins[i];
    }
  }

  return false;
};

exports.create = function() {
  return new Game();
};
