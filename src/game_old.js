let { init, Sprite, GameLoop, collides } = kontra

let { canvas } = init();

function getNewBall() {
    return Sprite({
        x: 1 + (Math.random() * 240),        // starting x,y position of the sprite
        y: 1 + (Math.random() * 240),
        color: 'purple',  // fill color of the sprite rectangle
        width: 5,     // width and height of the sprite rectangle
        height: 5,
        dx: Math.round(Math.random() * 1) + 1,          // move the sprite 2px to the right every frame
        dy: Math.round(Math.random() * 1) + 1,
        energy: 120
    });
}

function removeElement(element, array){
    const indexOf = array.indexOf(element);
    if(indexOf > -1){
        array.splice(indexOf, 1);
    }
}

function updateBall(ball) {

    ball.energy--;
    if(ball.energy < 0){
        removeElement(ball, balls)
    }

    // wrap the sprites position when it reaches
    // the edge of the screen
    if (ball.x > canvas.width - ball.width) {
        ball.x = canvas.width - ball.width - 1;
        ball.dx = -ball.dx;
    } else if (ball.x < 0) {
        ball.x = 1;
        ball.dx = -ball.dx;
    }

    if (ball.y > canvas.height - ball.height) {
        ball.y = canvas.height - ball.height - 1;
        ball.dy = -ball.dy;
    } else if (ball.y < 0) {
        ball.y = 1;
        ball.dy = -ball.dy;
    }

    // balls.forEach(otherBall => {
    //     if (ball !== otherBall) {
    //         if (collides(ball, otherBall)) {
    //             if ((ball.y + ball.height >= otherBall.y + otherBall.height) || (ball.y <= otherBall.y)) {
    //                 ball.dy = -ball.dy;
    //             }

    //             else if ((ball.x + ball.width >= otherBall.x + otherBall.width) || (ball.x <= otherBall.x)) {
    //                 ball.dx = -ball.dx;
    //             }
    //         }
    //     }
    // })

      if(collides(ball, block)){
          if((ball.y + ball.height >= block.y + block.height)||(ball.y <= block.y)){
              ball.dy = -ball.dy;
          }

          else if((ball.x + ball.width >= block.x + block.width) || (ball.x <= block.x)){
              ball.dx = -ball.dx;
          }
      }

    ball.update();
}

function renderBall(ball) {
    ball.render();
}

let balls = [];

let centre = 256 - 25;
let block = Sprite({x: centre, y: centre, color: 'blue', width: 50, height: 50})

let loop = GameLoop({  // create the main game loop
    update: function () { // update the game state
        balls.forEach(updateBall)
        if (Math.random() > 0.4 && balls.length < 3000) {
            balls.push(getNewBall())
        }
    },
    render: function () { // render the game state
        balls.forEach(renderBall)
        block.render();
    }
});

loop.start();    // start the game