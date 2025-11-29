const AuthService = require("../services/AuthService");

class AuthController{
    //POST /login, POST is an operator to send resources to the server
    login(req, res){
        const{username, password} = req.body;
        if(!username || !password){
            return res.status(400).json({message: "Please type username and password"})
        }
        const token = AuthService.authenticate(username, password);
        if(token){
            const role = AuthService.getRole(token);
            const user = AuthService.getRole(token);

            return res.status(200).json({
                message: "Login Successfully",
                token: token,
                role: role,
                user:{
                    id: user.id,
                    name: user.name
                }
            });
        }
        else{
            return res.status(401).json({message: "Wrong password or username"});
        }
    }
}

module.exports = new AuthController();