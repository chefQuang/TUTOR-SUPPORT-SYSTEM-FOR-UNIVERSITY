const Appointment = require("../models/Appointment")

class Session extends Appointment{
    constructor(id, tutor, timeslot, isOffline, location, urllink, status, maxslot, parcitipant, classown, course){
        super(id, tutor, timeslot, isOffline, location, urllink, status, maxslot, parcitipant)
        this.classown = classown;
        this.course = course;
    }

    getSessionClassID(){
        return this.classid;
    }
}

module.exports = Session