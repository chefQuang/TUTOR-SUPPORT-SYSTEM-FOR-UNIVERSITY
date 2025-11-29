const app = require('./src/app')
const db = require('./src/repositories/MockDatabase')

const PORT = 3000;

//Start Server
app.listen(PORT, () => {
    console.log(`🚀 Tutor Support System Mock Server is running at http://localhost:${PORT}`)
    console.log(`💾 Database have loaded ${db.getAllUser().length} users.`)
})