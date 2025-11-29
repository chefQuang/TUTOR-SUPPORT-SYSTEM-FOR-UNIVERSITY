function generateClassId(courseid, classcount){
    let id = `${courseid}c${classcount + 1}`;
    return id;
}