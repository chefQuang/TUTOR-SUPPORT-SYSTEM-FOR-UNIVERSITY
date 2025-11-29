const { debugPort } = require("process")
const db = require("../repositories/MockDatabase");
//const { use } = require("react");

class AuthService{
    authenticate(username, password){
        const user = db.findUserbyEmail(username);
        if(!user){
            return null
        }
        if(user.password != password){
            return null
        }
        const mockToken = `MOCK_TOKEN_${user.id}`;
        return mockToken;
    }

    getRole(token){
        if(!token || !token.startsWith("MOCK_TOKEN_")){
            return null;
        }

        const userID = token.replace("MOCK_TOKEN_", "");
        const user = db.findUserbyID(userID);
        return user ? user.role : null;
    }

    getUserByToken(token){
        if(!token || !token.startsWith("MOCK_TOKEN_")) return null;
        const userID = token.replace("MOCK_TOKEN_", "");
        return db.findUserbyID(userID);
    }
}

module.exports = new AuthService();