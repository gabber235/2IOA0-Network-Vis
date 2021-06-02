import Rive, { File, RiveCanvas, LinearAnimationInstance } from 'rive-canvas';

const timelineRiv = require('../../resources/static/timeline.riv')

export async function startTimeline(minDistance = 0.05, maxDistance = 0.3) {
    const elm = <HTMLCanvasElement>document.getElementById("timelineCanvas")
    const [sa, ea] = await runRive(elm)

    const start = 0;
    const end = start + minDistance;

    sa.advance(start);
    ea.advance(end);

    let mouseDown = false

    console.log(elm.getBoundingClientRect())

    elm.addEventListener("mouseup", () => mouseDown = false)
    elm.addEventListener("mousedown", () => mouseDown = true)

    elm.addEventListener("mousemove", (event: MouseEvent) => {
        if (!mouseDown) return
        console.log(event.x - elm.getBoundingClientRect().left)
    })
}

async function loadRivFile(filePath: string): Promise<[RiveCanvas, File]> {
    const req = new Request(filePath);
    const loadRive = Rive({ locateFile: (file) => 'file://' + file });
    const loadFile = fetch(req).then((res) => res.arrayBuffer()).then((buf) => new Uint8Array(buf));
    const [rive, file] = await Promise.all([loadRive, loadFile]);
    return [rive, rive.load(file)];
}

async function runRive(canvas: HTMLCanvasElement): Promise<[LinearAnimationInstance, LinearAnimationInstance]> {
    const [rive, nodeFile] = await loadRivFile(timelineRiv.default)
    const artboard = nodeFile.defaultArtboard()
    const startAni = new rive.LinearAnimationInstance(artboard.animationByName("Start"))
    const endAni = new rive.LinearAnimationInstance(artboard.animationByName("End"))

    const ctx = canvas.getContext('2d');
    const renderer = new rive.CanvasRenderer(ctx);


    artboard.advance(0)
    // Let's make sure our frame fits into our canvas
    ctx.save();
    renderer.align(rive.Fit.contain, rive.Alignment.center, {
        minX: 0,
        minY: 0,
        maxX: canvas.width,
        maxY: canvas.height
    }, artboard.bounds);
    // and now we can draw our frame to our canvas
    artboard.draw(renderer);
    ctx.restore();

    // track the last time a frame was rendered
    let lastTime = 0;

    // okay, so we have an animation and a renderer; how do we play an
    // animation? First, let's set up our animation loop with
    // requestFrameAnimation
    function draw(time: number) {
        // work out how many seconds have passed since a previous frame was
        // drawn
        if (!lastTime) {
            lastTime = time;
        }
        const elapsedTime = (time - lastTime) / 1000;
        lastTime = time;

        // advance our animation by the elapsed time
        // apply the animation to the artboard 
        startAni.apply(artboard, 1.0);
        endAni.apply(artboard, 1.0);
        // advance the artboard
        artboard.advance(elapsedTime);
        // advance the artboard
        artboard.advance(elapsedTime);

        // render the animation frame
        // first, clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // let's resize it to fit the canvas
        ctx.save();
        renderer.align(rive.Fit.contain, rive.Alignment.center, {
            minX: 0,
            minY: 0,
            maxX: canvas.width,
            maxY: canvas.height
        }, artboard.bounds);
        // and now we can draw our frame to our canvas
        artboard.draw(renderer);
        ctx.restore();

        // and kick off the next frame
        requestAnimationFrame(draw);
    }
    // now kick off the animation
    requestAnimationFrame(draw);

    return [startAni, endAni]
}