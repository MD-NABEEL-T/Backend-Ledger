const mongoose = require("mongoose");
const bcrypt = require("bcrypt")
const userSchema =new mongoose.Schema({
    email:{
        type:String,
        required:[true, "Email is required"],
        trim:true,
        lowercase:true,
        match:[/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,"Please provide a valid email address"],
        unique:[true,"Email already exists"]
    },
    name:{
        type:String,
        required :[true,"Name is required for creating an account"]
    },
    password:{
        type:String,
        required:[true,"Password is required "],
        minlength:[6,"password should have more than 6 characters"],
        select:false // password cant be accessed by default using schema 
    },
    systemUser: {
        type: Boolean,
        default: false,
        immutable: true,
        select:false
    }
},{
    timestamps:true
})
userSchema.pre("save",async function(next){

    if(!this.isModified("password")){
        return next()
    }

    //password is changed by the user 
    const hash = await bcrypt.hash(this.password,10)
    this.password = hash
    
    // converted the new password into hash again
    return
})

//compare the user schema entered by user and in the db 
userSchema.methods.comparePassword =async function(password){
    // console.log(password)
    return await bcrypt.compare(password,this.password)
}

const userModel =mongoose.model("User",userSchema)

module.exports = userModel