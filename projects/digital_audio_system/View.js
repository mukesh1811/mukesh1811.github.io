function View(canvas) {
    this.canvas = canvas;
    this.clicks = [];
    this.frameRate = 1000 / 30;
    this.maxRadius = 150;
    this.looprate = 4000;
}

View.prototype.handleClick = function(event) {
    var view = this;
    console.log(this)
    var x = event.offsetX;
    var y = event.offsetY;
    var pos = view.clicks.push({x: x, y: y, radius: 0});
    console.log("Add a circle at", x, ", ", y);
    Audio.play(x%10)
    setInterval(function(){
        view.clicks[pos-1].radius = 0;
        Audio.play(x%10)
    },view.looprate);
};

View.prototype.updateDisplay = function() {
    var view = this;
    var context = view.canvas.getContext("2d");
    context.clearRect(0, 0, view.canvas.width, view.canvas.height);
    context.fillStyle = 'black';
    context.fillRect(0, 0, view.canvas.width, view.canvas.height);

    for (var i = 0; i < view.clicks.length; i++)
    {
        var circle = view.clicks[i];
        
        if (circle.radius == this.maxRadius) continue;
        circle.radius += 1;
        
        var alpha = 0.7;
        if (circle.radius >= (view.radius - 15)) 
        {
            alpha = (view.radius - circle.radius) / 10;
        }
        view.drawCircle(context, circle.x, circle.y, circle.radius, alpha);
    }
};

View.prototype.drawCircle = function(context, x, y, radius, alpha) {
    context.beginPath();
    context.arc(x, y, radius, 0, 2*Math.PI);
    context.fillStyle = "rgba(" + x%256 + ", " + y%256  + ", " + (x * y % 256)+ " ," + alpha + ")";
    context.fill();
};