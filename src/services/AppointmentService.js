const db = require('../repositories/MockDatabase');
const Appointment = require('../models/Appointment');
const Cosultation = require('../models/Cosultation');
const Session = require('../models/Session');
const Tutor = require('../models/Tutor');
const Student = require('../models/Student');
const User = require('../models/User');
const Class = require('../models/Class');
const Course = require('../models/Course');

class AppointmentService {
    getCourses(){
        return db.getAllCourse();
    }

    findTutorbyCourse(course){
        return db.findTutorbyCourse(course);
    }

    getCosultation(){
        return db.getAllCosultations();
    }

    addCosultation(tutorid, id, timeslot, isOffline, location, urllink, status, maxslot, parcitipant, context){
        if(this.appointments.find(a => a.location === location)){
            return {success: false, message: "Phòng đã được đặt!"};
        }
        else if((isOffline === false) && (urllink === "")){
            return {success: false, message: "Chưa điền link cuộc họp!"};
        }
        let tutor = db.findUserbyID(tutorid);
        newmeet = new Cosultation(id, tutor, timeslot, isOffline, location, urllink, status, maxslot, parcitipant, context);
        return db.createCosultation(tutor, newmeet);
    }

    addSession(tutorid, id, timeslot, isOffline, location, urllink, status, maxslot, parcitipant, classown, course){
        if(this.appointments.find(a => a.location === location)){
            return {success: false, message: "Phòng đã được đặt!"};
        }
        else if((isOffline === false) && (urllink === "")){
            return {success: false, message: "Chưa điền link cuộc họp!"};
        }
        let tutor = db.findUserbyID(tutorid);
        newmeet = new Session(id, tutor, timeslot, isOffline, location, urllink, status, maxslot, parcitipant, classown, course);
        return db.createSession(tutor, newmeet);
    }

}