const express=require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser")

const authRouter = require("./routes/auth.routes")
const accountRouter = require("./routes/account.routes")
const transactionRouter=require("./routes/transaction.routes")

const app=express();

// Allow frontend dev server on port 5173 to communicate with API and send credentials/cookies
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))

app.get("/",(req,res)=>{
    res.send("Ledger service is running .")
})
app.use(express.json())
app.use(cookieParser())

app.use("/api/auth",authRouter)
app.use("/api/accounts",accountRouter)
app.use("/api/transactions",transactionRouter)


module.exports=app;
 