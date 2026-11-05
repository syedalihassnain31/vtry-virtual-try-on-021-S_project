CREATE DATABASE UNIVERSITYDB021;
USE UNIVERSITYDB021;

CREATE TABLE Department (
    DeptID INT,
    DeptName VARCHAR(50),
    HeadOfDept VARCHAR(50)
);

INSERT INTO Department VALUES
(1, 'Computer Science', 'Dr. Ahmed'),
(2, 'Information Technology', 'Dr. Sara'),
(3, 'Software Engineering', 'Dr. Usman'),
(4, 'Electrical Engineering', 'Dr. Fatima');

CREATE TABLE Student (
    RollNo INT,
    Name VARCHAR(50),
    Gender CHAR(1),
    DOB DATE,
    CGPA DECIMAL(3,2),
    DeptID INT
);

INSERT INTO Student VALUES
(101, 'Ali ', 'M', '2003-05-12', 3.75, 1),
(102, ' Ahmed', 'F', '2004-02-20', 3.60, 2),
(103, 'Usman Raza', 'M', '2003-09-15', 3.40, 3),
(104, ' Noor', 'F', '2004-11-10', 3.85, 1);

CREATE TABLE Instructor (
    InstructorID INT,
    Name VARCHAR(50),
    Qualification VARCHAR(20),
    Salary DECIMAL(10,2),
    DeptID INT
);

INSERT INTO Instructor VALUES
(201, 'Dr. Ahmed', 'PhD', 120000, 1),
(202, 'Dr. Sara', 'PhD', 115000, 2),
(203, 'Dr. Usman', 'MS', 95000, 3),
(204, 'Dr. Fatima', 'MS', 100000, 4);

CREATE TABLE Course (
    CourseID INT,
    CourseTitle VARCHAR(100),
    CreditHours INT,
    InstructorID INT
);

INSERT INTO Course VALUES
(301, 'Database Systems', 3, 201),
(302, 'Web Technologies', 3, 202),
(303, 'Software Engineering', 3, 203),
(304, 'Computer Networks', 4, 204);

CREATE TABLE FeeRecord (
    FeeID INT,
    RollNo INT,
    AmountPaid DECIMAL(10,2),
    PaymentDate DATE,
    IsPaid BIT
);

INSERT INTO FeeRecord VALUES
(401, 101, 75000, '2026-01-10', 1),
(402, 102, 75000, '2026-01-12', 1),
(403, 103, 70000, '2026-01-15', 0),
(404, 104, 75000, '2026-01-18', 1);

SELECT * FROM Department;
SELECT * FROM Student;
SELECT * FROM Instructor;
SELECT * FROM Course;
SELECT * FROM FeeRecord;