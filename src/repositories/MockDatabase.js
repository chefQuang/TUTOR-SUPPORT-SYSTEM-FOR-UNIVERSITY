const User = require("../models/User");
const Role = require("../models/Role");
const Student = require("../models/Student");
const Appointment = require("../models/Appointment");
const Cosultation = require("../models/Cosultation");
const Course = require("../models/Course");
const Class = require("../models/Class");
const Session = require("../models/Appointment")
const AppointmentStatus = require("../models/AppointmentStatus");
const Tutor = require("../models/Tutor");
const { response } = require("../app");
//const { use } = require("react");

class MockDatabase{
    constructor(){
        this.users = [];
        this.appointments = [];
        this.courses = [];
        this.cosultations = [];
        this.seedData();
    }

    seedData(){
        console.log("🌱 Seeding mock data...");
        //Push mock account into list
        this.users.push(new Tutor("2353014", "Trần Anh Quân", "quan.tran@hcmut.edu.vn", Role.TUTOR, "123456", [], [], "Khoa Khoa học và Kĩ thuật Máy tính", []))
        this.users.push(new Student("2352969", "Nguyễn Bùi Quang", "quang.nguyen@hcmut.edu.vn", Role.STUDENT, "123456"))
        this.users.push(new User("2352517", "Đồng Công Khánh", "khanh.dong@hcmut.edu.vn", Role.ADMIN, "123456"))
        this.users.push(new User("2353086", "Bùi Quốc Thái", "thai.bui@hcmut.edu.vn", Role.STAFF, "123456"))
        this.users.push(new Student("2353016", "Trần Minh Quân", "quan.minh@hcmut.edu.vn", Role.STUDENT, "123456"))
        this.courses.push(new Course("CO3093", "Mạng máy tính", "0", [], []))
        this.courses.push(new Course("CO3001", "Công nghệ phần mềm", "0", [], []))
        this.courses.push(new Course("BASAU", "Tán gái đại cương", "0", [], []))
        //tgdccourse = this.courses[2];
        //tgdc = this.addClass("BASAU", new Class("", "tgdccourse"))

    }



    getAllUser(){
        return this.users;
    }

    findUserbyID(id){
        return this.users.find(user => user.id === id);
    }

    findUserbyName(name){
        return this.users.find(user => user.name === name);
    }

    findUserbyEmail(email){
        return this.users.find(user => user.email === email);
    }

    getAllCourse(){
        return this.courses;
    }

    getAllCourseInfo(){
        let text = "";
        for (let x in this.courses){
            text += this.courses[x].showCourseInfo() + "\r\n------------\r\n"
        }
        return text;
    }

    findCoursebyId(id){
        return this.courses.find(course => course.id === id);
    }

    findCoursebyName(name){
        return this.courses.find(course => course.name === name);
    }

    findClassbyID(classid, course){
        return course.classlist.find(a => a.id === classid);
    }

    findTutorbyCourse(coursename){
        let course = this.findCoursebyName(coursename);
        return course.tutorlist;
    }


    verifyAddingClass(addingclass){   //Hàm này cần check, tạo test
        if(!(this.findCoursebyId(addingclass.courseid))){
            return false;
        }  //Xác định có đúng id môn không
        if(addingclass.name != this.findCoursebyId(addingclass.courseid.name)){
            return false;
        }  //Xác định xem tên môn có đúng không
        if(!(this.findCoursebyId(addingclass.courseid).tutorlist.find(t => t === addingclass.tutor))){
            return false;
        }  //Xác định xem tutor có dạy không
        return true;
    }

    addClass(id, addingclass){  //Cần check, tạo test
        let course = this.findCoursebyId(id);
        if(this.verifyAddingClass(addingclass)){
            course.classlist.push(addingclass);
            return true;
        }
        return false;
    }

    getTutorAvailableSlots(tutor){
        return tutor.availability;
    }

    addTutorAvailableSlots(tutor, date){
        if(tutor.availability.find(slot => slot === date)){
            return false;
        }
        tutor.availability.push(date);
        return true;
    }


    bookAppointments(student, appointment){
        let appointmentlist = student.appointments;
        if(appointmentlist.find(slot => slot.id === appointment.id)){
            return "DUPLICATE";
        }
        else if(appointment.participant.length() === appointment.maxslot){
            return "FULL";
        }
        appointmentlist.push(appointment);
        appointment.participant.push(student);
        return "OK";
    }

    createCosultation(tutor, cosultation){
        let appointmentlist = tutor.appointments;
        appointmentlist = push(newmeet);
        return true;
    }

    getAllCosultations(){
        return this.cosultation;
    }

    createSession(tutor, session, classid){
        newmeet = new Session(id, tutor, timeslot, isOffline, location, urllink, status, maxslot, parcitipant, classown, course);
        appointmentlist = tutor.appointments;
        appointmentlist = push(newmeet);

        return true;
    }

}

module.exports = new MockDatabase();