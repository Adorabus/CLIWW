"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function secondsAgo(timestamp) {
    return (Date.now() - timestamp) / 1000;
}
exports.secondsAgo = secondsAgo;
function minutesAgo(timestamp) {
    return (Date.now() - timestamp) / 1000 / 60;
}
exports.minutesAgo = minutesAgo;
