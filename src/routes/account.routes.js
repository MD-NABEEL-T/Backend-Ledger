const express=require("express")
const authMiddleware=require("../middleware/auth.middleware")
const accountController=require("../controllers/account.controller")
const router =express.Router()

// POST/api/accounts/
// create a new account (protected route )
router.post("/",authMiddleware.authMiddleware,accountController.createAccountController)

// GET /api/accounts/
// Get all accounts of the logged-in user
// protected route
router.get("/",authMiddleware.authMiddleware,accountController.getUserAccountsController)



// GET /api/accounts/balance:accountId
router.get("/:accountId/balance",authMiddleware.authMiddleware,accountController.getAccountBalanceController)

// GET /api/accounts/:accountId/ledger
// Get ledger entries for an account (protected route)
router.get("/:accountId/ledger",authMiddleware.authMiddleware,accountController.getAccountLedgerController)

module.exports=router