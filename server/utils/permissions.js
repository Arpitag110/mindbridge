const Circle = require('../models/Circle');

// Returns true if ownerId and viewerId share at least one circle
async function isCircleMate(ownerId, viewerId) {
    if (!ownerId || !viewerId) return false;
    try {
        const exists = await Circle.exists({ members: { $all: [ownerId, viewerId] } });
        return !!exists;
    } catch (err) {
        console.error('isCircleMate error', err);
        return false;
    }
}

// Returns true if both user IDs are members of the specific circle
async function bothInCircle(circleId, ownerId, viewerId) {
    if (!circleId || !ownerId || !viewerId) return false;
    try {
        const circle = await Circle.findById(circleId).select('members').lean();
        if (!circle) return false;
        const members = circle.members.map(m => m.toString());
        return members.includes(ownerId.toString()) && members.includes(viewerId.toString());
    } catch (err) {
        console.error('bothInCircle error', err);
        return false;
    }
}

module.exports = { isCircleMate, bothInCircle };