var NUMBER_OF_COLS = 8,
	NUMBER_OF_ROWS = 8,
	BLOCK_SIZE = 100;

var BLOCK_COLOUR_1 = '#FFFFFF',
	BLOCK_COLOUR_2 = '#A9A9A9',
	HIGHLIGHT_COLOUR = '#fb0006';

var piecePositions = null;

var PIECE_PAWN = 0,
	PIECE_CASTLE = 1,
	PIECE_ROUKE = 2,
	PIECE_BISHOP = 3,
	PIECE_QUEEN = 4,
	PIECE_KING = 5,
	IN_PLAY = 0,
	TAKEN = 1,
	pieces = null,
	ctx = null,
	json = null,
	canvas = null,
	BLACK_TEAM = 0,
	WHITE_TEAM = 1,
	SELECT_LINE_WIDTH = 5,
	currentTurn = WHITE_TEAM,
	selectedPiece = null;

function draw()
{
  canvas = document.getElementById('chess');

  if (canvas.getContext)
  {
    ctx = canvas.getContext('2d');

    //Calculate the size of each square
    BLOCK_SIZE = canvas.height / NUMBER_OF_ROWS;

    //Draw the background
    drawBoard();

    defaultPositions();

    //Draw pieces
    pieces = new Image();
    pieces.src = 'pieces.png';
    pieces.onload = drawPieces;

    canvas.addEventListener('click', board_click, false);
  }
  else
  {
      alert("Canvas is not supported");
  }
}


function drawBoard()
{
  for(row = 0; row < NUMBER_OF_ROWS; row++) {
    drawRow(row);
  }

  //Draw outline
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, NUMBER_OF_ROWS * BLOCK_SIZE, NUMBER_OF_COLS * BLOCK_SIZE);
}

function drawRow(row)
{
  //Draw 8 block left to right
  for (block = 0; block < NUMBER_OF_ROWS; block++)
  {
    drawBlock(row, block);
  }
}

function drawBlock(row, block)
{
  //Set the background colour
  ctx.fillStyle = getBlockColour(row, block);

  //Draw rectangle for the background
  ctx.fillRect(row*BLOCK_SIZE, block*BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

  ctx.stroke();
}

function getBlockColour(row, block)
{
  var blockColour;

  //Alternate the block colour
  if(row % 2)
  {
    blockColour = (block % 2?BLOCK_COLOUR_1:BLOCK_COLOUR_2);
  }
  else
  {
    blockColour = (block % 2?BLOCK_COLOUR_2:BLOCK_COLOUR_1);
  }

  return blockColour;
}

function drawPieces()
{
    drawTeamOfPieces(json.black, true);
    drawTeamOfPieces(json.white, false);
}

function drawTeamOfPieces(teamOfPieces, blackTeam)
{
  var piece;

  //Loop through each piece and draw it on the canvas
  for(piece=0; piece < teamOfPieces.length; piece++)
  {
    drawPiece(teamOfPieces[piece], blackTeam);
  }
}


function drawPiece(curPiece, blackTeam)
{
  var imageCoords = getImageCoords(curPiece.piece, blackTeam);

  //Draw the piece onto the canvas
  ctx.drawImage(pieces, imageCoords.x, imageCoords.y,
                BLOCK_SIZE, BLOCK_SIZE,
                curPiece.col * BLOCK_SIZE, curPiece.row * BLOCK_SIZE,
                BLOCK_SIZE, BLOCK_SIZE);
}

function getImageCoords(pieceCode, blackTeam)
{
  var imageCoords =
  {
    "x": pieceCode * BLOCK_SIZE,
    "y": (blackTeam?0:BLOCK_SIZE)
  };

  return imageCoords;
}

function screenToBlock(x, y) {
	var block =  {
		"row": Math.floor(y / BLOCK_SIZE),
		"col": Math.floor(x / BLOCK_SIZE)
	};

	return block;
}

function board_click(ev)
{
    var x;
    var y;
    if (ev.pageX || ev.pageY) {
      x = ev.pageX;
      y = ev.pageY;
    }
    else {
      x = ev.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      y = ev.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    x -= canvas.offsetLeft;
    y -= canvas.offsetTop;

  var clickedBlock = screenToBlock(x, y);

  if(selectedPiece == null)
  {
      checkIfPieceClicked(clickedBlock);
  }
  else
  {
      processMove(clickedBlock);
  }
}

function checkIfPieceClicked(clickedBlock)
{
    var pieceAtBlock = getPieceAtBlock(clickedBlock);

    if (pieceAtBlock != null)
    {
        selectPiece(pieceAtBlock);
    }
}


function getPieceAtBlock(clickedBlock)
{
    var team = (currentTurn === BLACK_TEAM ? json.black:json.white);

    return getPieceAtBlockForTeam(team, clickedBlock);
}

function blockOccupiedByEnemy(clickedBlock) {
	  var team = (currentTurn === BLACK_TEAM ? json.white : json.black);

    var blocked = getPieceAtBlockForTeam(team, clickedBlock);

	  return blocked;
}

function blockOccupiedByTeam(clickedBlock) {
    var team = (currentTurn === WHITE_TEAM ? json.white : json.black);

    var blocked = getPieceAtBlockForTeam(team, clickedBlock);

	  return blocked;
}

function removeSelection(selectedPiece) {
	drawBlock(selectedPiece.col, selectedPiece.row);
	drawPiece(selectedPiece, (currentTurn === BLACK_TEAM));
}


function getPieceAtBlockForTeam(teamOfPieces, clickedBlock)
{
    var curPiece = null,
      piece = 0,
      pieceAtBlock = null;

    for (piece = 0; piece < teamOfPieces.length; piece++)
    {
        curPiece = teamOfPieces[piece];

        if (curPiece.status === IN_PLAY &&
            curPiece.col === clickedBlock.col &&
            curPiece.row === clickedBlock.row)
        {
            curPiece.position = piece;

            pieceAtBlock = curPiece;
            piece = teamOfPieces.length;
        }
    }

    return pieceAtBlock;
}

function selectPiece(pieceAtBlock)
{
    //Draw outline
    ctx.lineWidth = SELECT_LINE_WIDTH;
    ctx.strokeStyle = HIGHLIGHT_COLOUR;
    ctx.strokeRect((pieceAtBlock.col * BLOCK_SIZE) + SELECT_LINE_WIDTH,
          (pieceAtBlock.row * BLOCK_SIZE) + SELECT_LINE_WIDTH,
          BLOCK_SIZE - (SELECT_LINE_WIDTH * 2),
          BLOCK_SIZE - (SELECT_LINE_WIDTH * 2));

    selectedPiece = pieceAtBlock;
}

function processMove(clickedBlock)
{
    var pieceAtBlock = getPieceAtBlock(clickedBlock),
        enemyPiece = blockOccupiedByEnemy(clickedBlock);

    if (pieceAtBlock !== null)
    {
        removeSelection(selectedPiece);
        checkIfPieceClicked(clickedBlock);
    }
    else if (canSelectedMoveToBlock(selectedPiece, clickedBlock, enemyPiece) === true)
    {
        movePiece(clickedBlock, enemyPiece);
        currentTurn = Math.abs(currentTurn-1);
    }
}


function movePiece(clickedBlock, enemyPiece)
{
  //Clear the block in the original position
  drawBlock(selectedPiece.col, selectedPiece.row);

  var team = (currentTurn === WHITE_TEAM ? json.white:json.black);
  var opposite = (currentTurn != WHITE_TEAM ? json.white:json.black);

  team[selectedPiece.position].col = clickedBlock.col;
  team[selectedPiece.position].row = clickedBlock.row;

  if (enemyPiece !== null)
  {
      //Clear the piece your about to take
      drawBlock(enemyPiece.col, enemyPiece.row);
      opposite[enemyPiece.position].status = TAKEN;
  }

  //Draw the piece in the new position
  drawPiece(selectedPiece, (currentTurn === BLACK_TEAM));

  currenTurn = (currentTurn === WHITE_TEAM ? BLACK_TEAM:WHITE_TEAM);

  selectedPiece = null;
}

function getPawnMoves(selectedPiece)
{
    var allowedMoves = [];

    var direction = (currentTurn === WHITE_TEAM ? 1: (-1));

    //One step forward
    var onSpaceAhead = {col:selectedPiece.col, row:selectedPiece.row+direction};
    if (blockOccupiedByEnemy(onSpaceAhead) === null && blockOccupiedByTeam(onSpaceAhead) === null)
    {
        allowedMoves.push({col: selectedPiece.col, row: selectedPiece.row+direction});
    }

    //Two step forward
    var twoSpaceAhead = {col:selectedPiece.col, row:selectedPiece.row+(2*direction)};
    if (blockOccupiedByEnemy(onSpaceAhead) === null && blockOccupiedByTeam(onSpaceAhead) === null && blockOccupiedByEnemy(twoSpaceAhead) === null && blockOccupiedByTeam(twoSpaceAhead) === null && (selectedPiece.row === 1 || selectedPiece.row === 6))
    {
        allowedMoves.push({col: selectedPiece.col, row: selectedPiece.row+(2*direction)});
    }

    //Taking a piece
    var attack1 = {col:selectedPiece.col-1, row:selectedPiece.row+direction};
    var attack2 = {col:selectedPiece.col+1, row:selectedPiece.row+direction};
    if (blockOccupiedByEnemy(attack1) !== null)
    {
        allowedMoves.push(attack1);
    }
    if (blockOccupiedByEnemy(attack2) !== null)
    {
        allowedMoves.push(attack2);
    }

    //En Passant
    var enpassant = [];
    if (currentTurn === WHITE_TEAM && selectedPiece.row === 4)
    {
      var enemyToTake1 = blockOccupiedByEnemy({row: 4, col: selectedPiece.col-1})
      if (enemyToTake1 !== null && enemyToTake1.piece === 0)
      {
          allowedMoves.push({row: 4+direction, col: selectedPiece.col-1});
          enpassant.push(enemyToTake1);
      }
      var enemyToTake2 = blockOccupiedByEnemy({row: 4, col: selectedPiece.col+1})
      if (enemyToTake2 !== null && enemyToTake2.piece === 0)
      {
          allowedMoves.push({row: 4+direction, col: selectedPiece.col+1});
          enpassant.push(enemyToTake2);
      }
    }

    if (currentTurn === BLACK_TEAM && selectedPiece.row === 3)
    {
      var enemyToTake1 = blockOccupiedByEnemy({row: 3, col: selectedPiece.col-1})
      if (enemyToTake1 !== null && enemyToTake1.piece === 0)
      {
          allowedMoves.push({row: 3+direction, col: selectedPiece.col-1});
          enpassant.push(enemyToTake1);
      }
      var enemyToTake2 = blockOccupiedByEnemy({row: 3, col: selectedPiece.col+1})
      if (enemyToTake2 !== null && enemyToTake2.piece === 0)
      {
          allowedMoves.push({row: 3+direction, col: selectedPiece.col+1});
          enpassant.push(enemyToTake2);
      }
    }

    return [allowedMoves, enpassant];

}

function canPawnMoveToBlock(selectedPiece, clickedBlock, enemyPiece)
{
    var allowedMoves = getPawnMoves(selectedPiece)[0];
    var enpassant = getPawnMoves(selectedPiece)[1];

    var canMove = contains(allowedMoves, clickedBlock);

    if(enpassant.length > 0)
    {
      if (selectedPiece.col !== clickedBlock.col)
      {
        var oppositeTeam = (currentTurn === WHITE_TEAM ? json.black:json.white);

        var pieceToDelete = oppositeTeam.filter(function( obj ) {
            return (obj.col == clickedBlock.col && obj.row == selectedPiece.row);
        })[0];

        drawBlock(pieceToDelete.col, pieceToDelete.row);
        oppositeTeam[pieceToDelete.position].status = TAKEN;
      }
    }

    return canMove;
}

function getKnightMoves(selectedPiece)
{
    var allowedMoves = [];

    allowedMoves[0] = {row: (selectedPiece.row - 2), col: (selectedPiece.col - 1)};
    allowedMoves[1] = {row: (selectedPiece.row - 2), col: (selectedPiece.col + 1)};
    allowedMoves[2] = {row: (selectedPiece.row + 2), col: (selectedPiece.col - 1)};
    allowedMoves[3] = {row: (selectedPiece.row + 2), col: (selectedPiece.col + 1)};
    allowedMoves[4] = {row: (selectedPiece.row - 1), col: (selectedPiece.col - 2)};
    allowedMoves[5] = {row: (selectedPiece.row - 1), col: (selectedPiece.col + 2)};
    allowedMoves[6] = {row: (selectedPiece.row + 1), col: (selectedPiece.col - 2)};
    allowedMoves[7] = {row: (selectedPiece.row + 1), col: (selectedPiece.col + 2)};

    return allowedMoves;
}

function canKnightMoveToBlock(selectedPiece, clickedBlock, enemyPiece)
{
    var allowedMoves = getKnightMoves(selectedPiece)

    var canMove = contains(allowedMoves, clickedBlock);

    return canMove;
}

function getCastleMoves(selectedPiece)
{
  var allowedMoves = [];

  //East
  var blocked = false;
  var counter = 1;
  while(!blocked)
  {
      var inspectedBlock = {col:selectedPiece.col-counter, row:selectedPiece.row};

      if ((blockOccupiedByEnemy(inspectedBlock) != null) || (blockOccupiedByTeam(inspectedBlock) != null) || (selectedPiece.col-counter) < 0)
      {
          if(blockOccupiedByEnemy(inspectedBlock) != null) {
            allowedMoves[allowedMoves.length] = inspectedBlock;
            blocked=true;
          } else {
            blocked=true;
          }
      } else {
          allowedMoves[allowedMoves.length] = inspectedBlock;
      }
      counter++;
  }
  //West
  blocked = false;
  counter=1;
  while(!blocked)
  {
      var inspectedBlock = {col:selectedPiece.col+counter, row:selectedPiece.row};
      if ((blockOccupiedByEnemy(inspectedBlock) != null) || blockOccupiedByTeam(inspectedBlock) != null || (selectedPiece.col+counter) > 7)
      {
        if(blockOccupiedByEnemy(inspectedBlock) != null) {
          allowedMoves[allowedMoves.length] = inspectedBlock;
          blocked=true;
        } else {
          blocked=true;
        }
      } else {
          allowedMoves[allowedMoves.length] = inspectedBlock;
      }
      counter++;
  }
  //North
  blocked = false;
  counter=1;
  while(!blocked)
  {
      var inspectedBlock = {col:selectedPiece.col, row:selectedPiece.row+counter};
      if ((blockOccupiedByEnemy(inspectedBlock) != null) || blockOccupiedByTeam(inspectedBlock) != null || (selectedPiece.row+counter) > 7)
      {
        if(blockOccupiedByEnemy(inspectedBlock) != null) {
          allowedMoves[allowedMoves.length] = inspectedBlock;
          blocked=true;
        } else {
          blocked=true;
        }
      } else {
          allowedMoves[allowedMoves.length] = inspectedBlock;
      }
      counter++;
  }
  //South
  blocked = false;
  counter=1;
  while(!blocked)
  {
      var inspectedBlock = {col:selectedPiece.col, row:selectedPiece.row-counter};
      if ((blockOccupiedByEnemy(inspectedBlock) != null) || blockOccupiedByTeam(inspectedBlock) != null || (selectedPiece.row-counter) < 0)
      {
        if(blockOccupiedByEnemy(inspectedBlock) != null) {
          allowedMoves[allowedMoves.length] = inspectedBlock;
          blocked=true;
        } else {
          blocked=true;
        }
      } else {
          allowedMoves[allowedMoves.length] = inspectedBlock;
      }
      counter++;
  }

  return allowedMoves;
}


function canCastleMoveToBlock(selectedPiece, clickedBlock, enemyPiece)
{
    var allowedMoves = getCastleMoves(selectedPiece);

    var canMove = contains(allowedMoves, clickedBlock);

    return canMove;
}

function getBishopMoves(selectedPiece)
{
	var allowedMoves = [];

  //North-West
  var blocked = false;
  var counter = 1;
  while(!blocked)
  {
      var inspectedBlock = {col:selectedPiece.col-counter, row:selectedPiece.row-counter};

      if ((blockOccupiedByEnemy(inspectedBlock) != null) || (blockOccupiedByTeam(inspectedBlock) != null) || (selectedPiece.col-counter) < 0 || (selectedPiece.row-counter) < 0)
      {
          if(blockOccupiedByEnemy(inspectedBlock) != null) {
            allowedMoves[allowedMoves.length] = inspectedBlock;
            blocked=true;
          } else {
            blocked=true;
          }
      } else {
          allowedMoves[allowedMoves.length] = inspectedBlock;
      }
      counter++;
  }
  //North-East
  blocked = false;
  counter=1;
  while(!blocked)
  {
      var inspectedBlock = {col:selectedPiece.col+counter, row:selectedPiece.row-counter};
      if ((blockOccupiedByEnemy(inspectedBlock) != null) || blockOccupiedByTeam(inspectedBlock) != null || (selectedPiece.col+counter) > 7 || (selectedPiece.row-counter) < 0)
      {
        if(blockOccupiedByEnemy(inspectedBlock) != null) {
          allowedMoves[allowedMoves.length] = inspectedBlock;
          blocked=true;
        } else {
          blocked=true;
        }
      } else {
          allowedMoves[allowedMoves.length] = inspectedBlock;
      }
      counter++;
  }
  //South-West
  blocked = false;
  counter=1;
  while(!blocked)
  {
      var inspectedBlock = {col:selectedPiece.col-counter, row:selectedPiece.row+counter};
      if ((blockOccupiedByEnemy(inspectedBlock) != null) || blockOccupiedByTeam(inspectedBlock) != null || (selectedPiece.row+counter) > 7 || (selectedPiece.col-counter) < 0)
      {
        if(blockOccupiedByEnemy(inspectedBlock) != null) {
          allowedMoves[allowedMoves.length] = inspectedBlock;
          blocked=true;
        } else {
          blocked=true;
        }
      } else {
          allowedMoves[allowedMoves.length] = inspectedBlock;
      }
      counter++;
  }
  //South-East
  blocked = false;
  counter=1;
  while(!blocked)
  {
      var inspectedBlock = {col:selectedPiece.col+counter, row:selectedPiece.row+counter};
      if ((blockOccupiedByEnemy(inspectedBlock) != null) || blockOccupiedByTeam(inspectedBlock) != null || (selectedPiece.row+counter) > 7 || (selectedPiece.col+counter) > 7)
      {
        if(blockOccupiedByEnemy(inspectedBlock) != null) {
          allowedMoves[allowedMoves.length] = inspectedBlock;
          blocked=true;
        } else {
          blocked=true;
        }
      } else {
          allowedMoves[allowedMoves.length] = inspectedBlock;
      }
      counter++;
  }

  return allowedMoves;
}

function canBishopMoveToBlock(selectedPiece, clickedBlock, enemyPiece)
{
  var allowedMoves = getBishopMoves(selectedPiece);

  var canMove = contains(allowedMoves, clickedBlock);

  return canMove;
}

function getQueenMoves(selectedPiece)
{
    var allowedMoves = getBishopMoves(selectedPiece);
    allowedMoves.push.apply(allowedMoves, getCastleMoves(selectedPiece));

    return allowedMoves;
}

function canQueenMoveToBlock(selectedPiece, clickedBlock, enemyPiece)
{
    var allowedMoves = getQueenMoves(selectedPiece);

    var canMove = contains(allowedMoves, clickedBlock);

    return canMove;
}

function getKingMoves(selectedPiece)
{
      var allowedMoves = [];

      allowedMoves[0] = {row: (selectedPiece.row - 1), col: (selectedPiece.col - 1)};
      allowedMoves[1] = {row: (selectedPiece.row - 1), col: (selectedPiece.col)};
      allowedMoves[2] = {row: (selectedPiece.row - 1), col: (selectedPiece.col + 1)};
      allowedMoves[3] = {row: (selectedPiece.row), col: (selectedPiece.col - 1)};
      allowedMoves[4] = {row: (selectedPiece.row), col: (selectedPiece.col + 1)};
      allowedMoves[5] = {row: (selectedPiece.row + 1), col: (selectedPiece.col - 1)};
      allowedMoves[6] = {row: (selectedPiece.row + 1), col: (selectedPiece.col)};
      allowedMoves[7] = {row: (selectedPiece.row + 1), col: (selectedPiece.col + 1)};

      return allowedMoves;
}

function canKingMoveToBlock(selectedPiece, clickedBlock, enemyPiece)
{
    var allowedMoves = getKingMoves(selectedPiece);

    return (contains(allowedMoves, clickedBlock) && blockOccupiedByTeam(clickedBlock) === null)
}


function isKingInCheck()
{
    var team = (currentTurn === BLACK_TEAM ? json.black:json.white);

    var king = team.filter(function( obj ) {
        return obj.piece == 5;
    })[0];

    var oppositeTeam = (currentTurn === WHITE_TEAM ? json.black:json.white);

    /*
      Go through all pieces and see if they are putting the king in check
    */
    var oppositeTeamInPlay = oppositeTeam.filter(function(obj) {
        return obj.status == 0;
    });

    var oppsiteTeamPawns = oppositeTeamInPlay.filter(function(obj) {
        return obj.piece == 0;
    });

    var oppositeTeamCastles = oppositeTeamInPlay.filter(function(obj) {
        return obj.piece == 1;
    });

    var oppositeTeamKnights = oppositeTeamInPlay.filter(function(obj) {
        return obj.piece == 2;
    });

    var oppositeTeamBishops = oppositeTeamInPlay.filter(function(obj) {
        return obj.piece == 3;
    });

    var oppositeTeamKing = oppositeTeamInPlay.filter(function(obj) {
        return obj.piece == 5;
    });

    var oppositeTeamQueen = oppositeTeamInPlay.filter(function(obj) {
        return obj.piece == 4;
    });


    var checkedBlocks = [];

    currentTurn = Math.abs(currentTurn-1);
    for(var i=0; i < oppsiteTeamPawns.length; i++) {
          var moves = getPawnMoves(oppsiteTeamPawns[i])[0];

          var attackingMoves = moves.filter(function( obj ) {
              return (obj.col !== oppsiteTeamPawns[i].col);
          });

          checkedBlocks.push.apply(checkedBlocks, attackingMoves);
    }

    for(var i=0; i < oppositeTeamCastles.length; i++) {
        checkedBlocks.push.apply(checkedBlocks, getCastleMoves(oppositeTeamCastles[i]));
    }

    for(var i=0; i < oppositeTeamKnights.length; i++) {
        checkedBlocks.push.apply(checkedBlocks, getKnightMoves(oppositeTeamKnights[i]));
    }

    for(var i=0; i < oppositeTeamBishops.length; i++) {
        checkedBlocks.push.apply(checkedBlocks, getBishopMoves(oppositeTeamBishops[i]));
    }


    for(var i=0; i < oppositeTeamQueen.length; i++) {
        checkedBlocks.push.apply(checkedBlocks, getQueenMoves(oppositeTeamQueen[i]));
    }

    for(var i=0; i < oppositeTeamKing.length; i++) {
        checkedBlocks.push.apply(checkedBlocks, getKingMoves(oppositeTeamKing[i]));
    }
    currentTurn = Math.abs(currentTurn-1);


    var inCheck = contains(checkedBlocks, king);

    return inCheck;
}

function contains(allowedBlocks, clickedBlock) {
    for (var i = 0; i < allowedBlocks.length; i++) {
        var allowedRow = allowedBlocks[i].row;
        var allowedCol = allowedBlocks[i].col;
        if (allowedRow === clickedBlock.row && allowedCol === clickedBlock.col) {
            return true;
        }
    }
    return false;
}

function canSelectedMoveToBlock(selectedPiece, clickedBlock, enemyPiece)
{
    var bCanMove = false;

    switch (selectedPiece.piece)
    {
        case PIECE_PAWN:

            bCanMove = canPawnMoveToBlock(selectedPiece, clickedBlock, enemyPiece);

        break;

        case PIECE_CASTLE:

            bCanMove = canCastleMoveToBlock(selectedPiece, clickedBlock, enemyPiece);

        break;

        case PIECE_ROUKE:

            bCanMove = canKnightMoveToBlock(selectedPiece, clickedBlock, enemyPiece);

        break;

        case PIECE_BISHOP:

            bCanMove = canBishopMoveToBlock(selectedPiece, clickedBlock, enemyPiece);

        break;

        case PIECE_QUEEN:

            bCanMove = canQueenMoveToBlock(selectedPiece, clickedBlock, enemyPiece);

        break;

        case PIECE_KING:

            bCanMove = canKingMoveToBlock(selectedPiece, clickedBlock, enemyPiece);
            kingChecked = isKingInCheck();

        break;
    }

    return bCanMove;

}


function defaultPositions()
{
    json =
    {
        "white":
        [
            {
                "piece": PIECE_CASTLE,
                "row": 0,
                "col": 0,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_ROUKE,
                "row": 0,
                "col": 1,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_BISHOP,
                "row": 0,
                "col": 2,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_KING,
                "row": 0,
                "col": 3,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_QUEEN,
                "row": 0,
                "col": 4,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_BISHOP,
                "row": 0,
                "col": 5,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_ROUKE,
                "row": 0,
                "col": 6,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_CASTLE,
                "row": 0,
                "col": 7,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_PAWN,
                "row": 1,
                "col": 0,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_PAWN,
                "row": 1,
                "col": 1,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_PAWN,
                "row": 1,
                "col": 2,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_PAWN,
                "row": 1,
                "col": 3,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_PAWN,
                "row": 1,
                "col": 4,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_PAWN,
                "row": 1,
                "col": 5,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_PAWN,
                "row": 1,
                "col": 6,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_PAWN,
                "row": 1,
                "col": 7,
                "status": IN_PLAY
            }
        ],
        "black":
        [
            {
                "piece": PIECE_CASTLE,
                "row": 7,
                "col": 0,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_ROUKE,
                "row": 7,
                "col": 1,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_BISHOP,
                "row": 7,
                "col": 2,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_KING,
                "row": 7,
                "col": 3,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_QUEEN,
                "row": 7,
                "col": 4,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_BISHOP,
                "row": 7,
                "col": 5,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_ROUKE,
                "row": 7,
                "col": 6,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_CASTLE,
                "row": 7,
                "col": 7,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_PAWN,
                "row": 6,
                "col": 0,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_PAWN,
                "row": 6,
                "col": 1,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_PAWN,
                "row": 6,
                "col": 2,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_PAWN,
                "row": 6,
                "col": 3,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_PAWN,
                "row": 6,
                "col": 4,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_PAWN,
                "row": 6,
                "col": 5,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_PAWN,
                "row": 6,
                "col": 6,
                "status": IN_PLAY
            },
            {
                "piece": PIECE_PAWN,
                "row": 6,
                "col": 7,
                "status": IN_PLAY
            }
        ]
    };
}
