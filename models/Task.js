const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    name: String,
    status: String,
    deadline: Date,

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    date: {
        type: Date,
        default: Date.now   // ✅ auto store created date
    }
});

module.exports = mongoose.model("Task", taskSchema);