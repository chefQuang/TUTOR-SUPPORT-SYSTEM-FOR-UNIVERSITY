class Appointment{
    constructor(id, tutor, timeslot, isOffline, location, urllink, status, maxslot, parcitipant){
        this.id = id;
        this.tutor = tutor;
        this.timeslot = timeslot;
        this.isOffline = isOffline;
        this.location = location;
        this.urllink = urllink;
        this.status = status;
        this.maxslot = maxslot;
        this.parcitipant = parcitipant
    }

    getAppointmentId(){
        return this.id;
    }

    getAppointmenttime(){
        return this.timeslot;
    }
}

module.exports = Appointment