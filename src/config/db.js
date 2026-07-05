
const mongoose =require("mongoose")


function connectToDB(){
    mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("Server is connected to the database")
    })
    .catch((err)=>{
        console.error("Error connecting to the database:", err)
        process.exit(1) // shuts down the whole app
    })
}

module.exports=connectToDB