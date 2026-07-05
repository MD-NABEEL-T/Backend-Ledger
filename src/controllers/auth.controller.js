const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const emailService = require("../services/email.service")
const tokenBlacklistModel = require("../models/blacklist.model")
// POST /api/auth/register
async function userRegisterController(req, res) {
    const { email, password, name } = req.body

    const isExists = await userModel.findOne({ email })

    if (isExists) {
        return res.status(422).json({
            message: "User already exists with email",
            status: "failed"
        })
    }

    const user = await userModel.create({ email, password, name })

    // ✅ Send email RIGHT AFTER user is created
    await emailService.sendRegistrationEmail(user.email, user.name)

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" })

    res.cookie("token", token)

    res.status(201).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    })
}

// POST /api/auth/login
async function userLoginController(req, res) {
    const { email, password } = req.body

    const user = await userModel.findOne({ email }).select("password")

    if (!user) {
        return res.status(401).json({ message: "Email is Invalid" })
    }

    const isValidPassword = await user.comparePassword(password)
    if (!isValidPassword) {
        return res.status(401).json({ message: "Password is Invalid" })
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" })

    res.cookie("token", token)

    res.status(200).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    })
    // ❌ Removed email call from here — it doesn't belong in login
}

// user logout controller
async function userLogoutController(req, res) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(400).json({ message: "No token provided" })
    }

    await tokenBlacklistModel.create({ token })

    res.cookie("token", "") // Clear the cookie

    res.status(200).json({ message: "User logged out successfully" })
}
module.exports = { userRegisterController, userLoginController, userLogoutController }