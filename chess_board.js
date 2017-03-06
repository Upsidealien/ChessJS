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

//Movement rules for pieces
function canPawnMoveToBlock(selectedPiece, clickedBlock, enemyPiece)
{
  var rowToMoveTo = (currentTurn === WHITE_TEAM ? selectedPiece.row + 1:selectedPiece.row - 1),
      adjacentEnemy = (clickedBlock.col === selectedPiece.col - 1 ||
          enemyPiece !== null),
      nextRowEmpty = (clickedBlock.col === selectedPiece.col &&
          blockOccupiedByEnemy(clickedBlock) === null);

  return clickedBlock.row === rowToMoveTo &&
        (nextRowEmpty === true || adjacentEnemy === true || clickedBlock.col === selectedPiece.col);
}

function canKnightMoveToBlock(selectedPiece, clickedBlock, enemyPiece)
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

    var canMove = contains(allowedMoves, clickedBlock);

    return canMove;
}

function canCastleMoveToBlock(selectedPiece, clickedBlock, enemyPiece)
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

    var canMove = contains(allowedMoves, clickedBlock);

    return canMove;
}

function canBishopMoveToBlock(selectedPiece, clickedBlock, enemyPiece)
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

  var canMove = contains(allowedMoves, clickedBlock);

  return canMove;
}

function canQueenMoveToBlock(selectedPiece, clickedBlock, enemyPiece)
{
    var canCastleMove = canCastleMoveToBlock(selectedPiece, clickedBlock, enemyPiece);
    var canBishopMove = canBishopMoveToBlock(selectedPiece, clickedBlock, enemyPiece);

  return (canCastleMove || canBishopMove);
}

function canKingMoveToBlock(selectedPiece, clickedBlock, enemyPiece)
{
    var numberOfRowsAway = Math.abs(selectedPiece.row - clickedBlock.row);
    var numberOfColsAway = Math.abs(selectedPiece.col - clickedBlock.col);

    return ((numberOfRowsAway<=1) && (numberOfColsAway<=1) && blockOccupiedByTeam(clickedBlock) === null)
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
