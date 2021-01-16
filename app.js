'use strict';

class Configurations {
    screen = {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
        paddingsTopBottom: document.documentElement.clientHeight / 10,
    };
    consts = {
        clocksQuantity: 4,
        coefClockMargin: .5,
        clocksPerSecond: 1,
    }
    one = (this.screen.height - this.screen.paddingsTopBottom * 2) / (this.consts.clocksQuantity + (this.consts.clocksQuantity - 1) * this.consts.coefClockMargin);
    clock = {
        size: this.one,
        margins: this.one * this.consts.coefClockMargin,
        cssClass: 'clock',
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
        container.appendChild(this.root);
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
        this.root.innerText = this.time.toString();
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

setInterval(() => {
    for (let i = 0; i < CONFIG.consts.clocksQuantity; i-=-1) {
        new Clock(Time.random(), true, container, i);
    }
}, 1000);