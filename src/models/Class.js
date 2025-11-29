const {classidGen} = require("../utils/utilsfunc")
const Course = require("../models/Course")

class Class{
    constructor(id, name, course, studentnum, maxslot, tutor, studentlist, sessionlist, classcount){
        this.classcount = classcount;
        courseid = course.id;
        this.id = classidGen(courseid, classcount);
        this.name = name;
        this.courseid = course;
        this.studentnum = studentnum;
        this.tutor = tutor;
        this.maxslot = maxslot;
        this.studentlist = studentlist;
        this.sessionlist = sessionlist;
    }



}

module.exports = Class