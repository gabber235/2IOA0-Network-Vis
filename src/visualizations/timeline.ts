import * as d3 from "d3";
import Rive, { File, RiveCanvas, LinearAnimationInstance } from 'rive-canvas';
import { Observable } from 'rxjs';
const B = require("array-blur");

const timelineRiv = require('../../resources/static/timeline.riv')

export async function startTimeline(minDistance = 0.015, maxDistance = 0.05, thickness = 0.005): Promise<Observable<[number, number]>> {
    const elm = <HTMLCanvasElement>document.getElementById("timelineCanvas")
    const [sa, ea] = await runRive(elm)
    return new Observable(sub => {
        let start = 0;
        let end = start + minDistance;

        setTimeout(() => {
            sub.next([start, end])
        }, 500)

        sa.advance(start);
        ea.advance(end);

        let lastDrag = -1
        let type: "start" | "between" | "end" | "" = ""

        const setState = (state: [number, number]): any => {
            const newStart = clamp(state[0])
            const newEnd = clamp(state[1])
            if (start == newStart && end == newEnd) return
            start = newStart;
            end = newEnd;
            sub.next(state);
        }

        document.addEventListener("mouseup", () => {
            lastDrag = -1
            type = ""
        })
        elm.addEventListener("mousedown", (event: MouseEvent) => {
            const box = elm.getBoundingClientRect()
            lastDrag = (event.x - box.left) / box.width
            if (Math.abs(start - lastDrag) < thickness) type = "start"
            else if (Math.abs(end - lastDrag) < thickness) type = "end"
            else if (start < lastDrag && lastDrag < end) type = "between"
            else type = ""
        })

        document.addEventListener("mousemove", (event: MouseEvent) => {
            const box = elm.getBoundingClientRect()
            const per = (event.x - box.left) / box.width
            if (lastDrag < 0) {
                if (box.top > event.y || event.y > box.bottom) document.body.style.cursor = "default"
                else if (Math.abs(start - per) < thickness) document.body.style.cursor = "e-resize"
                else if (Math.abs(end - per) < thickness) document.body.style.cursor = "e-resize"
                else if (start < per && per < end) document.body.style.cursor = "move"
                else document.body.style.cursor = "default"
                return
            }

            if (type == "start") {
                let dif = per - lastDrag
                if (start + dif < 0) dif = 0 - start

                let endDif = 0;

                if (end - start - dif > maxDistance) endDif = start + dif + maxDistance - end;
                else if (end - start - dif < minDistance) endDif = start + dif + minDistance - end;

                if (end + endDif > 1) {
                    dif = 1 - end
                    endDif = dif
                }

                sa.advance(dif);
                ea.advance(endDif);
                setState([start + dif, end + endDif])
                lastDrag = clamp(per)
            } else if (type == "end") {
                let dif = per - lastDrag
                if (end + dif > 1) dif = 1 - end

                let startDif = 0;

                if (end + dif - start > maxDistance) startDif = end + dif - maxDistance - start;
                else if (end + dif - start < minDistance) startDif = end + dif - minDistance - start;

                if (start + startDif < 0) {
                    dif = 0 - start
                    startDif = dif
                }

                sa.advance(startDif);
                ea.advance(dif);
                setState([start + startDif, end + dif]);
                lastDrag = clamp(per)

            } else if (type == "between") {
                let dif = per - lastDrag
                if (start + dif < 0) dif = 0 - start
                else if (end + dif > 1) dif = 1 - end

                sa.advance(dif);
                ea.advance(dif);
                setState([start + dif, end + dif]);
                lastDrag = clamp(per)
            }
        })
    })
}

const clamp = (num: number): number => Math.max(0, Math.min(1, num))

async function loadRivFile(filePath: string): Promise<[RiveCanvas, File]> {
    const req = new Request(filePath);
    const loadRive = Rive({ locateFile: (file) => `file://${file}` });
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

export function loadTimelineGraph(counts: number[]) {
    const existingSVG = document.getElementById("TM-SVG");
    if (existingSVG) d3.select("#TM-SVG").remove();

    const bounds = document.getElementById("timelineCanvas").getBoundingClientRect()

    const width = bounds.width;
    const height = bounds.height;

    const svg = d3.select("#timeline").insert("svg", "timelineCanvas")
        .attr("width", width)
        .attr("height", height)
        .attr("id", "TM-SVG")
        .attr("pointer-events", "none")

    let max = counts[0];
    for (let i = 1; i < counts.length; ++i) {
        if (counts[i] > max) {
            max = counts[i];
        }
    }

    const x = (<any>d3).scale.linear().domain([0, counts.length]).range([0, width]);
    const y = (<any>d3).scale.linear().domain([0, max]).range([height, 0]);

    // create a line function that can convert data[] into x and y points
    const line = (<any>d3).svg.line()
        .interpolate("basis")
        .x((d: any, i: any) => x(i))
        .y((d: any) => y(d))

    svg.append("g")
        .append("path")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line(B.blur().radius(1)(counts)));

}