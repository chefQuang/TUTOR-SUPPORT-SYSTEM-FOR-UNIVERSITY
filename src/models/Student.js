const User = require("../models/User")

class Student extends User{
    constructor(id, name, role, email, password, appointments){
        super(id, name, role, email, password);
        this.appointments = appointments;
    }
}

module.exports = Student