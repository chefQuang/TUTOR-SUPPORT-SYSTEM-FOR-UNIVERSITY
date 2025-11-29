class Time{
    constructor(year, month, day, hour, minute){
        this.year = year;
        this.month = month;
        this.day = day;
        this.hour = hour;
        this.minute = minute
    }
    toString(){
        return `${this.year}-${this.month}-${this.day}-${this.hour}-${this.minute}`;
    }

    toDate(){
        return new Date(this.year, this.month - 1, this.day, this.hour, this.minute);
    }
}

module.exports = Time