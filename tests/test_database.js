const db = require("../src/repositories/MockDatabase");

console.log("---START TESTING DATABASE---");

const allUser = db.getAllUser();
console.log(`[1] Total number of user: ${allUser.length}`);
if(allUser.length == 5){
    console.log("✅ PASS: Successfully load all the user")
}
else{
    console.log("❌ FAIL: Total number of user is incorrect")
}

const tutor = db.findUserbyID("2353014");
if (tutor && tutor.name === "Trần Anh Quân"){
    console.log(`✅ PASS: Found tutor: ${tutor.name}`)
}
else{
    console.error("❌ FAIL: Cannot find user 2353014")
}

const unknown = db.findUserbyID("10000");
if(!unknown){
    console.log("✅ PASS: User unidentifed");
}
else{
    console.error("❌ FAIL: Found user");
}

const courseinfo = db.getAllCourseInfo();
if(courseinfo){
    console.log("✅ PASS: All Courses info found");
    console.log(courseinfo);
}
else{
    console.error("❌ FAIL: No Course found");
}


console.log("---END TESTING---");
