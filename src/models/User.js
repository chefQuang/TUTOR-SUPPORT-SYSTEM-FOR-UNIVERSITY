const Role = require("../models/Role")

class User{
    constructor(id, name, role, email, password){
        this.id = id;
        this.name = name;
        this.role = role;
        this.email = email;
        this.password = password;
    }
}


module.exports = User