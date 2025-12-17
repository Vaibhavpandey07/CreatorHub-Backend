import dotenv from 'dotenv'
import {app} from './src/app.js'
import {env} from './src/utlis/getEnvVariable.util.js'
import {connection} from './src/db/connection.db.js'


connection().then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log(`server running at http://127.0.0.1:${env.PORT}`);
    })
}).catch((err)=>{
    console.log("Can not connect to the dataBase",err);
})
    