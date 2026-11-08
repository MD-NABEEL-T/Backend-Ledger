const accountModel=require("../models/account.model");
const ledgerModel=require("../models/ledger.model");


async function createAccountController(req,res){
    const user=req.user;

    const account =await accountModel.create({
        user:user._id
    })

    res.status(201).json({
        account
    })

}

async function getUserAccountsController(req,res){
    const accounts = await accountModel.find({user:req.user._id});

    res.status(200).json({
        accounts
    })
}

async function getAccountBalanceController(req,res){
    const { accountId} = req.params;

    const account = await accountModel.findOne({
        _id:accountId,    
        user:req.user._id
    })
    if(!account){
        return res.status(404).json({
            message: "Account not found "
        })
    }

    const balance = await account.getBalance();
    res.status(200).json({
        account_id: account._id,
        balance: balance
    })
}

async function getAccountLedgerController(req,res){
    const { accountId } = req.params;

    const account = await accountModel.findById(accountId);
    if(!account){
        return res.status(404).json({
            message: "Account not found"
        });
    }

    // Verify account ownership so users cannot inspect other users' ledger entries
    if(account.user.toString() !== req.user._id.toString()){
        return res.status(403).json({
            message: "Forbidden: You do not own this account"
        });
    }

    const entries = await ledgerModel.find({ account: account._id })
        .sort({ _id: -1 })
        .populate("transaction", "createdAt status");

    res.status(200).json({
        entries
    });
}

module.exports={
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController,
    getAccountLedgerController
}