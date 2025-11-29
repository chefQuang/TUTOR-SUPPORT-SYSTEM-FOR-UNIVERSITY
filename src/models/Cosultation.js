const Appointment = require("../models/Appointment")

class Cosultation extends Appointment{
    constructor(id, tutor, timeslot, isOffline, location, urllink, status, maxslot, parcitipant, context){
        super(id, tutor, timeslot, isOffline, location, urllink, status, maxslot, parcitipant);
        this.context = context;
    }
}

module.exports = Cosultation