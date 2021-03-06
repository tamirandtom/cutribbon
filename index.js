'use strict';

var targetUrl;
var urlColor;

window.onload = function () {
    let bsDiv = document.getElementById("box-shadow-div");
    let x, y;
    // On mousemove use event.clientX and event.clientY to set the location of the div to the location of the cursor:
    window.addEventListener('mousemove', function (event) {
        x = event.clientX;
        y = event.clientY;
        if (typeof x !== 'undefined') {
            bsDiv.style.left = x + "px";
            bsDiv.style.top = y + "px";
        }
    }, false);
}

function prepareFrame() {
    var url = new URL(window.location.href);
    targetUrl = url.searchParams.get("site");
    urlColor = url.searchParams.get("color") || "0000FF";
    if ("#" !== urlColor[0]) {
        urlColor = "#" + urlColor;
    }

    if (targetUrl) {

         

        if (targetUrl.includes('tamuseum'))
        {
            document.body.classList.toggle("is-tam", true);

        } else {
            var ifrm = document.createElement("iframe");
            ifrm.setAttribute("src", targetUrl);
            ifrm.style.width = "100%";
            ifrm.style.height = "100%";
            document.body.appendChild(ifrm);
    
        }
        document.body.classList.toggle("mode-ribbon-cutting", true);

      
        $(".ribbon1, .ribbon2").css("background", urlColor);

    } else {
        // Setup the intro form instead
        document.body.classList.toggle("mode-form", true);
    }

}

prepareFrame();

// If set to true, the user must press
// UP UP DOWN ODWN LEFT RIGHT LEFT RIGHT A B
// to trigger the confetti with a random color theme.
// Otherwise the confetti constantly falls.

$(function () {
    // Globals
    var $window = $(window)
        , random = Math.random
        , cos = Math.cos
        , sin = Math.sin
        , PI = Math.PI
        , PI2 = PI * 2
        , timer = undefined
        , frame = undefined
        , confetti = [];

    // Settings
    var spread = 40
        , sizeMin = 3
        , sizeMax = 12 - sizeMin
        , eccentricity = 10
        , deviation = 100
        , dxThetaMin = -.1
        , dxThetaMax = -dxThetaMin - dxThetaMin
        , dyMin = .13
        , dyMax = .18
        , dThetaMin = .4
        , dThetaMax = .7 - dThetaMin;

    // Cosine interpolation
    function interpolation(a, b, t) {
        return (1 - cos(PI * t)) / 2 * (b - a) + a;
    }

    // Create a 1D Maximal Poisson Disc over [0, 1]
    var radius = 1 / eccentricity, radius2 = radius + radius;
    function createPoisson() {
        // domain is the set of points which are still available to pick from
        // D = union{ [d_i, d_i+1] | i is even }
        var domain = [radius, 1 - radius], measure = 1 - radius2, spline = [0, 1];
        while (measure) {
            var dart = measure * random(), i, l, interval, a, b, c, d;

            // Find where dart lies
            for (i = 0, l = domain.length, measure = 0; i < l; i += 2) {
                a = domain[i], b = domain[i + 1], interval = b - a;
                if (dart < measure + interval) {
                    spline.push(dart += a - measure);
                    break;
                }
                measure += interval;
            }
            c = dart - radius, d = dart + radius;

            // Update the domain
            for (i = domain.length - 1; i > 0; i -= 2) {
                l = i - 1, a = domain[l], b = domain[i];
                // c---d          c---d  Do nothing
                //   c-----d  c-----d    Move interior
                //   c--------------d    Delete interval
                //         c--d          Split interval
                //       a------b
                if (a >= c && a < d)
                    if (b > d) domain[l] = d; // Move interior (Left case)
                    else domain.splice(l, 2); // Delete interval
                else if (a < c && b > c)
                    if (b <= d) domain[i] = c; // Move interior (Right case)
                    else domain.splice(i, 0, c, d); // Split interval
            }

            // Re-measure the domain
            for (i = 0, l = domain.length, measure = 0; i < l; i += 2)
                measure += domain[i + 1] - domain[i];
        }

        return spline.sort();
    }

    // Create the overarching container
    var container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '0';
    container.style.overflow = 'visible';
    container.style.zIndex = '9999';

    // Confetto constructor
    class Confetto {
        constructor(theme) {
            this.frame = 0;
            this.outer = document.createElement('div');
            this.inner = document.createElement('div');
            this.outer.appendChild(this.inner);
            var outerStyle = this.outer.style, innerStyle = this.inner.style;
            outerStyle.position = 'absolute';
            outerStyle.width = (sizeMin + sizeMax * random()) + 'px';
            outerStyle.height = (sizeMin + sizeMax * random()) + 'px';
            innerStyle.width = '100%';
            innerStyle.height = '100%';
            innerStyle.backgroundColor = urlColor;
            outerStyle.perspective = '50px';
            outerStyle.transform = 'rotate(' + (360 * random()) + 'deg)';
            this.axis = 'rotate3D(' +
                cos(360 * random()) + ',' +
                cos(360 * random()) + ',0,';
            this.theta = 360 * random();
            this.dTheta = dThetaMin + dThetaMax * random();
            innerStyle.transform = this.axis + this.theta + 'deg)';
            this.x = $window.width() * random();
            this.y = -deviation;
            this.dx = sin(dxThetaMin + dxThetaMax * random());
            this.dy = dyMin + dyMax * random();
            outerStyle.left = this.x + 'px';
            outerStyle.top = this.y + 'px';
            // Create the periodic spline
            this.splineX = createPoisson();
            this.splineY = [];
            for (var i = 1, l = this.splineX.length - 1; i < l; ++i)
                this.splineY[i] = deviation * random();
            this.splineY[0] = this.splineY[l] = deviation * random();
            this.update = function (height, delta) {
                this.frame += delta;
                this.x += this.dx * delta;
                this.y += this.dy * delta;
                this.theta += this.dTheta * delta;
                // Compute spline and convert to polar
                var phi = this.frame % 7777 / 7777, i = 0, j = 1;
                while (phi >= this.splineX[j])
                    i = j++;
                var rho = interpolation(this.splineY[i], this.splineY[j], (phi - this.splineX[i]) / (this.splineX[j] - this.splineX[i]));
                phi *= PI2;
                outerStyle.left = this.x + rho * cos(phi) + 'px';
                outerStyle.top = this.y + rho * sin(phi) + 'px';
                innerStyle.transform = this.axis + this.theta + 'deg)';
                return this.y > height + deviation;
            };
        }
    }

    function poof() {
        if (!frame) {
            // Append the container
            document.body.appendChild(container);

            // Add confetti
            var theme = "rgb(0,0,0)";
            (function addConfetto() {

                var confetto = new Confetto(theme);
                confetti.push(confetto);
                container.appendChild(confetto.outer);
                timer = setTimeout(addConfetto, spread * random());
            })(0);

            // Start the loop
            var prev = undefined;
            requestAnimationFrame(function loop(timestamp) {
                var delta = prev ? timestamp - prev : 0;
                prev = timestamp;
                var height = $window.height();

                for (var i = confetti.length - 1; i >= 0; --i) {
                    if (confetti[i].update(height, delta)) {
                        container.removeChild(confetti[i].outer);
                        confetti.splice(i, 1);
                    }
                }

                if (timer || confetti.length)
                    return frame = requestAnimationFrame(loop);

                // Cleanup
                document.body.removeChild(container);
                frame = undefined;
            });
        }
    }


    var newState = -1;
    $(".ribbon1, .ribbon2").click(function () {
        poof();
        $(".ribbon1,.ribbon2, .c2").addClass("open");

        if (newState == -1) {
            newState = 0;
            setTimeout(function () {
                location.href = targetUrl;
            }, 5000);
        }
    });
});


