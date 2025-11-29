const User = require("../models/User")

class Tutor extends User{
    constructor(id, name, role, email, password, appointments, supportcourse, department, availability){
        super(id, name, role, email, password);
        this.appointments = appointments;
        this.supportcourse = supportcourse;
        this.department = department;
        this.availability = availability;
    }
}

module.exports = Tutor