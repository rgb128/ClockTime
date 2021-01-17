'use strict';

class Configurations {
    screen = {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
        paddingsTopBottom: document.documentElement.clientHeight / 10,
    };
    consts = {
        clocksQuantity: 1, // 4
        coefClockMargin: .1, // .5
        clocksPerSecond: 1,
    }
    one = (this.screen.height - this.screen.paddingsTopBottom * 2) / (this.consts.clocksQuantity + (this.consts.clocksQuantity - 1) * this.consts.coefClockMargin);
    clock = {
        size: this.one,
        margins: this.one * this.consts.coefClockMargin,
        cssClass: 'clock',
        cssAnimationName: 'animateClock',
        hands: {
            // hour: {
            //     height: this.one / 4,
            //     width: 3,
            //     border: 1,
            //     fill: false,
            //     round: true,
            //     color: 'black'
            // },
            // minute: {
            //     height: this.one / 3.5,
            //     width: 2,
            //     border: 0,
            //     fill: true,
            //     round: false,
            //     color: 'black'
            // },
            // second: {
            //     height: this.one / 5,
            //     width: 1,
            //     border: 0,
            //     fill: true,
            //     round: false,
            //     color: 'black'
            // }
            hour: {
                height: this.one / 3.5,
                width: this.one / 15,
                border: this.one / 90,
                fill: false,
                round: true,
                color: 'black'
            },
            minute: {
                height: this.one / 3,
                width: this.one / 40,
                border: 0,
                fill: true,
                round: true,
                color: 'black'
            },
            second: {
                height: this.one / 2.5,
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

window.onresize = (e) => {
    CONFIG = new Configurations();
}

class Clock {
    /** @type {Time} */
    time;
    /** @type {HTMLElement} */
    root;
    interval;

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
     * @param {boolean | undefined} initializeImmediately if true, the clock will call init() method immediately
     * @param {HTMLElement | undefined} container contairner; Nesessary if initializeImmediately is true
     * @param {number | undefined} numberOnTop first is 0. Nesessary if initializeImmediately is true
     */
    constructor(time, initializeImmediately, container, numberOnTop) {

        this.time = (time && time instanceof Time) ? time.clone() : new Time();

        if (initializeImmediately === true) {
            if (typeof numberOnTop !== 'number') throw new Error ('NumberOnTop must be initialized');
            if (!container || !(container instanceof HTMLElement)) throw new Error ('container must be HTMLElement');
            numberOnTop = Math.round(numberOnTop);
            if (numberOnTop < 0) numberOnTop = 0;
            if (numberOnTop >= CONFIG.consts.clocksQuantity) numberOnTop = CONFIG.consts.clocksQuantity-1;
            this.init(container, numberOnTop);
        }
    }

    /**
     * starts clock and redrawing
     * @param {HTMLElement} container
     * @param {number} numberOnTop
     */
    init(container, numberOnTop) {
        if (!container || !(container instanceof HTMLElement)) { throw new Error('Container must be HTMLElement'); }
        if (!this.time) { throw new Error('Time must be initialized'); }
        this.root = this.createRootElement();
        this.root.style.top = `${CONFIG.screen.paddingsTopBottom + numberOnTop * (CONFIG.clock.size + CONFIG.clock.margins)}px`;
        const timeToDeath = this.calculateTimeToLive();
        // TODO here uncomment
        // this.root.style.animation = `${CONFIG.clock.cssAnimationName} ${timeToDeath}s linear 1`;
        // die. refactor this later
        setTimeout(() => {
            // this.root.remove();
        }, timeToDeath * 1000);
        container.appendChild(this.root);
        this.createHands();
        this.redraw();
        if (this.interval !== undefined) clearInterval(this.interval);
        this.interval = setInterval(() => {
            this.time.addASecond();
            this.redraw();
        }, 1000);
    }

    /** stops this clock */
    stop() {
        if (this.interval !== undefined) clearInterval(this.interval);
    }

    redraw() {
        // this.root.innerText = this.time.toString();
        this.rotateHands();
    }

    /** @returns {HTMLElement} */
    createRootElement() {
        if (!this.time) { throw new Error('Time must be initialized'); }
        const rootBF = document.createElement('div');
        rootBF.classList.add(CONFIG.clock.cssClass);
        rootBF.style.width = CONFIG.clock.size + 'px';
        rootBF.style.height = CONFIG.clock.size + 'px';
        rootBF.context = this;
        return rootBF;
    }

    /**
     * @return {number} calculated time to set to animation property
     */
    calculateTimeToLive() {
        const smallDistance = CONFIG.clock.size + CONFIG.clock.margins;
        const smallTime = 1 / CONFIG.consts.clocksPerSecond;
        const velocity = smallDistance / smallTime;
        const bigDistance = CONFIG.screen.width * 1.5; // Because animation is from left = 100vw to left = -50vw
        const bigTime = bigDistance / velocity;
        return bigTime;
    }

    createHands() {
        /**
         * sets all nesessary styles to one hand
         * @param {HTMLElement} hand 
         * @param {Configurations.clock.hands.hour} config 
         */
        function createHand(hand, config) {
            /* height: this.one / 4,
                width: 3,
                border: 1,
                fill: false,
                round: true,
                color: 'black' */
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
        const centerPoint = document.createElement('div');
        centerPoint.classList.add('centerpoint');
        centerPoint.style.top = CONFIG.clock.size / 2 - 1 + 'px';
        centerPoint.style.left = CONFIG.clock.size / 2 - 1 + 'px';
        this.root.appendChild(centerPoint);

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
         * @param {number} time current time
         * @param {number} maxTime maximal allowed time (12 for hours, 60 for minutes and seconds)
         * @param {boolean} smooth if true, value will not be exactly in the number
         * @returns {number} angle in deg
         */
        function countAngleByTime(time, maxTime, smooth) {
            let angle = 360 * time / maxTime;
            if (!smooth) {
                angle -= 360 % (360 / maxTime);
            }
            return angle;
        }

        this.hands.hour.style.transform = `rotate(${countAngleByTime(this.time.hours + this.time.minutes / 60 + this.time.seconds / 3600, 12, true)}deg)`;
        this.hands.minute.style.transform = `rotate(${countAngleByTime(this.time.minutes + this.time.seconds / 60, 60, true)}deg)`;
        this.hands.second.style.transform = `rotate(${countAngleByTime(this.time.seconds, 60, false)}deg)`;
    }
}

class Time {
    /** @type {number} */
    hours;
    /** @type {number} */
    minutes;
    /** @type {number} */
    seconds;

    /**
     * 
     * @param {number|undefined} hours 
     * @param {number|undefined} minutes 
     * @param {number|undefined} seconds 
     */
    constructor(hours, minutes, seconds) {
        if (typeof (hours) === 'number' && hours >= 0) {
            this.hours = Math.round (hours) % 12;
        } else {
            this.hours = 0;
        }
        if (typeof (minutes) === 'number' && minutes >= 0) {
            this.minutes = Math.round (minutes) % 60;
        } else {
            this.minutes = 0;
        }
        if (typeof (seconds) === 'number' && seconds >= 0) {
            this.seconds = Math.round (seconds) % 60;
        } else {
            this.seconds = 0;
        }
    }
    
    /**
     * 
     * @param {number|undefined} hours 
     * @param {number|undefined} minutes 
     * @param {number|undefined} seconds 
     * @returns {Time} this
     */    
    addTimeStamp(hours, minutes, seconds) {
        if (typeof (seconds) === 'number') {
            seconds = Math.round (seconds);
            this.seconds += seconds;
        } 
        if (this.seconds >= 60) {
            const newSecs = Math.round(this.seconds % 60);
            const newMins = Math.floor(this.seconds / 60);
            this.seconds = newSecs;
            this.minutes += newMins;
        } else if (this.seconds < 0) {
            const newSecs = 60 + Math.round(this.seconds % 60);
            const newMins = Math.floor(this.seconds / 60);
            this.seconds = newSecs;
            this.minutes += newMins;
        }

        if (typeof (minutes) === 'number') {
            minutes = Math.round (minutes);
            this.minutes += minutes;
        } 
        if (this.minutes >= 60) {
            const newMins = Math.round(this.minutes % 60);
            const newHrs = Math.floor(this.minutes / 60);
            this.minutes = newMins;
            this.hours += newHrs;
        } else if (this.minutes < 0) {
            const newMins = 60 + Math.round(this.minutes % 60);
            const newHrs = Math.floor(this.minutes / 60);
            this.minutes = newMins;
            this.hours += newHrs;
        }

        if (typeof (hours) === 'number') {
            hours = Math.round (hours);
            this.hours += hours;
        } 
        if (this.hours >= 12) {
            const newHrs = Math.round(this.hours % 12);
            this.hours = newHrs;
        } else if (this.hours < 0) {
            const newHrs = 12 + Math.round(this.hours % 12);
            this.hours = newHrs;
        }

        return this;
    }

    /**
     * adds 1 second and returns this
     * @returns {Time} 
     */
    addASecond() {
        this.addTimeStamp(0, 0, 1);
        return this;
    }

    /**
     * @returns {string} time as string in format hh:mm:ss
     */
    toString() {
        this.hours = Math.round(this.hours);
        this.minutes = Math.round(this.minutes);
        this.seconds = Math.round(this.seconds);
        return `${this.hours}:${this.minutes}:${this.seconds}`;
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
        return new Time (
            getRandomInt(0, 11),
            getRandomInt(0, 59),
            getRandomInt(0, 59)
        );
    }
}

// let c = new Clock(container, undefined, true);

// setInterval(() => {
//     for (let i = 0; i < CONFIG.consts.clocksQuantity; i-=-1) {
//         new Clock(Time.random(), true, container, i);
//     }
// }, 1000 / CONFIG.consts.clocksPerSecond);

for (let i = 0; i < CONFIG.consts.clocksQuantity; i-=-1) {
    // const c = new Clock(Time.random(), true, container, i);
    let time = Time.random();
    console.log(time.toString());
    const c = new Clock(time, true, container, i);
    c.root.style.left = '100px';
}
