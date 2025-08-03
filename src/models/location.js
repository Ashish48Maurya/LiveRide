const mongoose = require("mongoose");
const schema = mongoose.Schema;
const locationSchema = new schema({
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    riderId: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Location", locationSchema);