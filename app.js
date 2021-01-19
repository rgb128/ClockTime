'use strict';

class Configurations {
    screen = {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
        paddingsTopBottom: document.documentElement.clientHeight / 20,
    };
    consts = {
        clocksQuantity: 4,
        coefClockMargin: .3,
        clocksPerSecond: 1,
        colors: [
            "#F1948A",
            "#C39BD3",
            "#7FB3D5",
            "#5DADE2",
            "#76D7C4",
            "#82E0AA",
            "#F7DC6F",
            "#F0B27A",
            "#AEB6BF",
            "#FFA3A3",
            "#A3FFF1",
            "#A3B1FF",
            "#F3ACFF",
        ],
        minSpeed: .5, // Can be undefined
        maxSpeed: 10, // Can be undefined
    }
    one = (this.screen.height - this.screen.paddingsTopBottom * 2) / (this.consts.clocksQuantity + (this.consts.clocksQuantity - 1) * this.consts.coefClockMargin);
    clock = {
        // border: this.one / 15,
        defaultColor: 'white',
        size: this.one,
        margins: this.one * this.consts.coefClockMargin,
        cssClass: 'clock',
        cssAnimationName: 'animateClock',
        hands: {
            hour: {
                height: this.one / 3.5,
                width: this.one / 15,
                border: this.one / 50,
                fill: false,
                round: true,
                color: 'black'
            },
            minute: {
                height: this.one / 2.6,
                width: this.one / 35,
                border: 0,
                fill: true,
                round: true,
                color: 'black'
            },
            second: {
                height: this.one / 2.1,
                width: this.one / 80,
                border: 0,
                fill: true,
                round: false,
                color: 'black'
            }
        }
    };

    constructor() {}
}

/** @type {Configurations} */
let CONFIG = new Configurations();

const CONTAINER = document.getElementById('container');
const MILLIS_IN_CLOCK_FACE = 12 * 60 * 60 * 1000;

window.onresize = (e) => {
    CONFIG = new Configurations();
}

class Clock {
    /** @type {Time} */
    time;
    /** @type {HTMLElement} */
    root;

    running = true;

    /** @type {boolean} */
    reverse;

    /** @type {number} */
    currentLeft;

    hands = {
        /** @type {HTMLElement} */
        hour: document.createElement('div'),
        /** @type {HTMLElement} */
        minute: document.createElement('div'),
        /** @type {HTMLElement} */
        second: document.createElement('div'),
    }

    /**
     * 
     * @param {Time | undefined} time time to initialize clock
     * @param {HTMLElement | undefined} container contairner
     * @param {number | undefined} numberOnTop first is 0
     * @param {string|undefined} color color of clock
     * @param {number|undefined} speed speed. must be > 0
     * @param {boolean|undefined} reverse reverse clock
     */
    constructor(time, container, numberOnTop, color, speed, reverse) {

        this.time = (time && time instanceof Time) ? time.clone() : new Time();

        this.reverse = reverse === true;

        if (typeof numberOnTop !== 'number') throw new Error ('NumberOnTop must be initialized');
        if (!container || !(container instanceof HTMLElement)) throw new Error ('container must be HTMLElement');

        numberOnTop = Math.round(numberOnTop);
        if (numberOnTop < 0) numberOnTop = 0;
        if (numberOnTop >= CONFIG.consts.clocksQuantity) numberOnTop = CONFIG.consts.clocksQuantity-1;

        this.root = this.createRootElement(color);
        this.root.style.top = `${CONFIG.screen.paddingsTopBottom + numberOnTop * (CONFIG.clock.size + CONFIG.clock.margins)}px`;
        // const timeToDeath = this.calculateTimeToLive();
        // this.root.style.animation = `${CONFIG.clock.cssAnimationName} ${timeToDeath}s linear 1`;
        // // die. refactor this later
        // setTimeout(() => {
        //     this.root.remove();
        // }, timeToDeath * 1000);
        container.appendChild(this.root);
        this.createHands();
        this.rotateHands();
        // const realSpeed = (typeof speed === 'number' && speed > 0) ? speed : 1;
        // if (this.interval !== undefined) clearInterval(this.interval);
        // this.interval = setInterval(() => {
        //     this.time.addASecond();
        //     this.redraw();
        // }, 1000 / realSpeed);
    }

    // redraw() {
    //     if (this.running) {
    //         this.rotateHands();
    //     }
    //     this.moveRight();
    // }

    /** @returns {HTMLElement} */
    createRootElement(color) {
        if (!this.time) { throw new Error('Time must be initialized'); }
        const rootBF = document.createElement('div');
        const screenWidth = CONFIG.screen.width
        this.currentLeft = screenWidth;
        rootBF.classList.add(CONFIG.clock.cssClass);
        rootBF.style.width = CONFIG.clock.size + 'px';
        rootBF.style.height = CONFIG.clock.size + 'px';
        rootBF.style.left = currentLeft + 'px';
        rootBF.context = this;
        rootBF.style.borderRadius = CONFIG.clock.size / 2 + 'px';
        rootBF.style.backgroundColor = color ? color : CONFIG.clock.defaultColor;
        rootBF.onclick = (e) => {
            const targerElement = e.target;
            /** @type {Clock} */
            const targetContext = targerElement.context;
            for (const element of CONTAINER.children) {
                /** @type {Clock} */
                const context = element.context;
                context.running = false;
                context.time = targetContext.time.clone();
                context.reverse = targetContext.reverse;
                context.rotateHands();
                element.onclick = () => { };
            }
        }
        return rootBF;
    }

    /** ticks the clock */
    tick(timestamp) {
        timestamp = Time.normalizeTimeStamp(timestamp);
        this.addTimeStamp(timestamp);
        this.rotateHands(timestamp);
        this.moveLeft(timestamp);
    }

    // /**
    //  * @return {number} calculated time to set to animation property
    //  */
    // calculateTimeToLive() {
    //     const smallDistance = CONFIG.clock.size + CONFIG.clock.margins;
    //     const smallTime = 1 / CONFIG.consts.clocksPerSecond;
    //     const velocity = smallDistance / smallTime;
    //     const bigDistance = CONFIG.screen.width * 1.5; // Because animation is from left = 100vw to left = -50vw
    //     const bigTime = bigDistance / velocity;
    //     return bigTime;
    // }

    createHands() {
        /**
         * sets all nesessary styles to one hand
         * @param {HTMLElement} hand 
         * @param {Configurations.clock.hands.hour} config 
         */
        function createHand(hand, config) {
            hand.style.height = config.height + 'px';
            hand.style.width = config.width + 'px';
            hand.style.borderRadius = config.round ? (config.width / 2 + 'px') : '0px';
            hand.style.top = (CONFIG.clock.size / 2 + config.width / 2 - config.height) + 'px';
            hand.style.left = (CONFIG.clock.size / 2 - config.width / 2) + 'px';
            hand.style.border = `${config.border}px solid ${config.color}`;
            hand.style.transformOrigin = `50% ${config.height - config.width / 2}px`;
            hand.style.backgroundColor = config.fill ? config.color : 'transparent';
        }

        // center point
        // const centerPoint = document.createElement('div');
        // centerPoint.classList.add('centerpoint');
        // centerPoint.style.top = CONFIG.clock.size / 2 - 1 + 'px';
        // centerPoint.style.left = CONFIG.clock.size / 2 - 1 + 'px';
        // this.root.appendChild(centerPoint);

        // Hour
        this.hands.hour = document.createElement('div');
        this.hands.hour.classList.add('hand', 'hour');
        createHand(this.hands.hour, CONFIG.clock.hands.hour);
        // Minute
        this.hands.minute = document.createElement('div');
        this.hands.minute.classList.add('hand', 'minute');
        createHand(this.hands.minute, CONFIG.clock.hands.minute);
        // Hour
        this.hands.second = document.createElement('div');
        this.hands.second.classList.add('hand', 'second');
        createHand(this.hands.second, CONFIG.clock.hands.second);

        this.root.appendChild(this.hands.hour);
        this.root.appendChild(this.hands.minute);
        this.root.appendChild(this.hands.second);
    }

    rotateHands() {
        /**
         * calculates angle for hand depending on time
         * @param {boolean} reverse
         * @param {number} time current time
         * @param {number} maxTime maximal allowed time (12 for hours, 60 for minutes and seconds)
         * @returns {number} angle in deg
         */
        function countAngleByTime(reverse, time, maxTime) {
            let angle = 360 * time / maxTime;
            if (reverse) angle *= -1;
            return angle;
        }

        const hourAngle = countAngleByTime(this.reverse, this.time.getHours(false), 12);
        const minuteAngle = countAngleByTime(this.reverse, this.time.getMinutes(false), 60);
        const secondAngle = countAngleByTime(this.reverse, this.time.getSeconds(true), 60);

        this.hands.hour.style.transform = `rotate(${hourAngle}deg)`;
        this.hands.minute.style.transform = `rotate(${minuteAngle}deg)`;
        this.hands.second.style.transform = `rotate(${secondAngle}deg)`;
    }

    /** @param {number|undefined} timestamp timestamp time in milliseconds. Default is 0 */ 
    addTimeStamp(timestamp) {
        timestamp = Time.normalizeTimeStamp(timestamp);
        this.time.addTimeStamp(timestamp);
    }

    /** 
     * Moves rigth using given timestamp. Deletes itself if it already behind screen.
     * @param {number|undefined} timestamp timestamp time in milliseconds. Default is 0
    */
    moveLeft(timestamp) {
        timestamp = Time.normalizeTimeStamp(timestamp);
        const width = CONFIG.clock.size + CONFIG.clock.margins; // px
        const velocity = width / (CONFIG.consts.clocksPerSecond * 1000); // px/ms
        const leftDelta = velocity * timestamp; // (px/ms)*ms=px
        this.currentLeft -= leftDelta;
        if (this.currentLeft < -1 * CONFIG.clock.size) {
            this.root.remove(); // Die
            return;
        }
        this.root.style.left = this.currentLeft + 'px';
    }
}

class Time {
    /**@type {number} Time in milliseconds */
    time;

    /** @param {number|undefined} time Start time in milliseconds. Default is 0 */
    constructor(time) {
        if (typeof (time) === 'number' && time >= 0) {
            this.time = time % MILLIS_IN_CLOCK_FACE;
        } else {
            this.time = 0;
        }
    }
    
    /** @param {number|undefined} timestamp timestamp time in milliseconds. Default is 0 */ 
    addTimeStamp(timestamp) {
        timestamp = Time.normalizeTimeStamp(timestamp);
        this.time = (this.time + timestamp) % MILLIS_IN_CLOCK_FACE;

        return this;
    }

    static normalizeTimeStamp(timestamp) {
        if (typeof (timestamp) === 'number') {
            timestamp = timestamp % MILLIS_IN_CLOCK_FACE;
            if (timestamp < 0) {
                timestamp = MILLIS_IN_CLOCK_FACE - timestamp;
            }
            return timestamp;
        }
        return 0;
    }

    /** 
     * @param {boolean} whole if true, returned value will be floored. default is false 
     * @returns {number}
    */
    getHours(whole) {
        const time = this.time % MILLIS_IN_CLOCK_FACE;
        const fullSeconds = Math.floor(time / 1000);
        const hours = (fullSeconds / 60 / 60) % 12; // fullHours % hoursInFace
        return whole === true ? Math.floor(hours) : hours;
    }
    /** 
     * @param {boolean} whole if true, returned value will be floored. default is false 
     * @returns {number}
    */
    getMinutes(whole) {
        const time = this.time % MILLIS_IN_CLOCK_FACE;
        const fullSeconds = Math.floor(time / 1000);
        const minutes = (fullSeconds / 60) % 60; // fullMinutes % minutesInHour(minutesInFace)
        return whole === true ? Math.floor(minutes) : minutes;
    }
    /** 
     * @param {boolean} whole if true, returned value will be floored. default is false 
     * @returns {number}
    */
    getSeconds(whole) {
        const time = this.time % MILLIS_IN_CLOCK_FACE;
        const fullSeconds = Math.floor(time / 1000);
        const seconds = fullSeconds % 60; // fullSeconds % secondsInMinute(secondsInFace)
        return whole === true ? Math.floor(seconds) : seconds;
    }

    /** @returns {string} time as string in format h:m:s */
    toString() {
        return `${this.getHours(true)}:${this.getMinutes(true)}:${this.getSeconds(true)}`;
    }

    /** @returns {Time} */
    clone() {
        return new Time(this.hours, this.minutes, this.seconds);
    }

    /**
     * @returns {Time} random time
     */
    static random() {
        /** @returns {number} a random integer between min (inclusive) and max (inclusive). */
        function getRandomInt(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        return new Time (getRandomInt(0, MILLIS_IN_CLOCK_FACE));
    }
}

function map(num, frombottom, fromtop, tobottom, totop) {
    let a = num - frombottom;
    a *= (totop-tobottom)/(fromtop-frombottom);
    a += tobottom;
    return a;
}


// setInterval(() => {
//     for (let i = 0; i < CONFIG.consts.clocksQuantity; i-=-1) {
//         const colorId = Math.floor(map(Math.random(), 0, 1, 0, CONFIG.consts.colors.length));
//         const reverseTrue = Math.random() < .2;
//         const speed = (CONFIG.consts.minSpeed !== undefined && CONFIG.consts.maxSpeed !== undefined)
//             ? map(Math.random(), 0, 1, CONFIG.consts.minSpeed, CONFIG.consts.maxSpeed)
//             : 1;

//         new Clock(
//             Time.random(), 
//             true, 
//             CONTAINER, 
//             i, 
//             CONFIG.consts.colors[colorId],
//             speed,
//             reverseTrue);
//     }
// }, 1000 / CONFIG.consts.clocksPerSecond);


const timef = Time.random();

let prev = performance.now();

  requestAnimationFrame(function measure(time) {
    const delta = Math.round(time - prev);
    prev = time;

    timef.addTimeStamp(delta);
    
    document.title = timef.toString();

    requestAnimationFrame(measure);
  })