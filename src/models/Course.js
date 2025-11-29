class Course{
    constructor(id, name, studentnum, tutorlist, classlist){
        this.id = id;
        this.name = name;
        this.studentnum = studentnum;
        this.tutorlist = [];
        this.classlist = [];
    }

    showCourseInfo(){
        let infoString = `CourseID: ${this.id}\nName: ${this.name}\nStudent Enrolled: ${this.studentnum}`
        return infoString;
    }
}

module.exports = Course