import Rive, { File, RiveCanvas } from 'rive-canvas';
import { handleDefaultScroll, handleScrollAnimaton } from './page/scroll';

const nodeRiv = require('../resources/static/node-link.riv')
const adjacencyRiv = require('../resources/static/adjacency-matrix.riv')
const interactionsRiv = require('../resources/static/interactions.riv')

handleDefaultScroll()
handleScrollAnimaton(document.getElementById("nodeLinkCanvas"), 50, (el) => {
    if (el instanceof HTMLCanvasElement) {
        runRive(el, nodeRiv.default).catch(e => console.error(e))
    }
})

handleScrollAnimaton(document.getElementById("adjacencyCanvas"), 50, (el) => {
    if (el instanceof HTMLCanvasElement) {
        runRive(el, adjacencyRiv.default).catch(e => console.error(e))
    }
})

handleScrollAnimaton(document.getElementById("interactionsCanvas"), 50, (el) => {
    if (el instanceof HTMLCanvasElement) {
        runRive(el, interactionsRiv.default).catch(e => console.error(e))
    }
})

async function loadRivFile(filePath: string): Promise<[RiveCanvas, File]> {
    const req = new Request(filePath);
    const loadRive = Rive({ locateFile: (file) => `file://${file}` });
    const loadFile = fetch(req).then((res) => res.arrayBuffer()).then((buf) => new Uint8Array(buf));
    const [rive, file] = await Promise.all([loadRive, loadFile]);
    return [rive, rive.load(file)];
}

async function runRive(canvas: HTMLCanvasElement, filePath: string) {
    const [rive, nodeFile] = await loadRivFile(filePath)
    const artboard = nodeFile.defaultArtboard()
    const stateMachine = artboard.stateMachineByName("Hover Machine")
    const smi = new rive.StateMachineInstance(stateMachine)

    const ctx = canvas.getContext('2d');
    const renderer = new rive.CanvasRenderer(ctx);

    const testInput = smi.input(0).asBool()

    canvas.onmouseover = (e) => testInput.value = true
    canvas.onmouseout = (e) => testInput.value = false

    smi.advance(artboard, 0)
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
        smi.advance(artboard, elapsedTime);
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
}