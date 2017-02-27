

function draw()
{
  canvas = document.getElementById('chess');

  if (canvas.getContect)
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
