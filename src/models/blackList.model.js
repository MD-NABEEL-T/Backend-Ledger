const mongoose = require("mongoose")

const tokenBlacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, "Token is required to add to blacklist"],
        unique: true
    }
}, {
    timestamps: true
})

tokenBlacklistSchema.index({ createdAt: 1 }, {
    expireAfterSeconds: 36000 // 10 hours
})

const tokenBlacklistModel = mongoose.model("TokenBlacklist", tokenBlacklistSchema)

module.exports = tokenBlacklistModel