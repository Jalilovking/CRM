const express = require('express')
const app = express()
const ejs = require('ejs')
const { PORT } = require('./config')
const cookieParser = require('cookie-parser')
const FS = require('./lib/fsDeal')

const users = new FS('../model/users.json')
const courses = new FS('../model/courses.json')
const groups = new FS('../model/groups.json')


const { signUser, verifyUser } = require('./lib/jwt')

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))



const verifyRole = (req, res, next) =>{
    
    const { username, password } = req.body
    
    const allUsers = JSON.parse(users.read())
    
    const foundUser = allUsers.find(e=> e.username == username && e.password == password)
    
    if(!foundUser){
        return res.status(401).send('Unauthorized')
    }
    
    req.body.role = foundUser.role
    req.body.id = foundUser.id
    
    next()
}

const cookieChecker = (req, res, next) => {
    try {
        const { cookies: { token } } = req
        
        if(!token){
            return res.redirect('/')
        }
        
        const userStatus = verifyUser(token)
        
        if(userStatus){
            next()
        }else{
            res.redirect('/')
        }
    } catch (error) {
        res.status(401).send({message: 'Bad request'})   
    }
}


app.get('/', (req, res) =>{
    res.render('login')
})



app.post('/login', verifyRole, (req, res) =>{
    const { id, role } = req.body
    console.log(req.body)
    const userToken = signUser(id)
    
    if(role == 'admin'){
        res.cookie('token', userToken)
        res.redirect('/admin')
    }else if(role == 'teacher'){
        res.cookie('token', userToken)
        res.redirect('/teacher')
    }else if(role == 'student'){
        res.cookie('token', userToken)
        res.redirect('/student')
    }else{
        res.status(400).send({message: 'Bad request'})
    }
    
})


app.get('/admin', cookieChecker, (req, res) => {
    res.render('index')
})


//Teacher
app.get('/teacher', cookieChecker, (req, res) => {
    try {
        const { cookies: { token } } = req
        
        if(!token){
            return res.redirect('/')
        }
        
        const userStatus = verifyUser(token)
        
        if(userStatus){

            const allUsers = JSON.parse(users.read())
            const foundUser = allUsers.find(e => e.id == userStatus)
            const allStudents = allUsers.filter(e => e.role = 'student')
            const allGroups = JSON.parse(groups.read())

            const arr = []
            const foundGroups = allGroups.filter(e => e.teacher == foundUser.id)

            for(let group of foundGroups){
                const foundStudents = allStudents.filter(e => e.group == group.id)
                arr.push(...foundStudents)
            }

            res.render('teacher', { foundUser, arr })
        }else{
            res.redirect('/')
        }
    } catch (error) {
        res.status(401).send({message: 'Bad request'})   
    }
})


//Student
app.get('/student', cookieChecker, (req, res) =>{

    try {
        const { cookies: { token } } = req
        
        if(!token){
            return res.redirect('/')
        }
        
        const userStatus = verifyUser(token)
        
        if(userStatus){

            const allUsers = JSON.parse(users.read())
            const foundUser = allUsers.find(e => e.id == userStatus)
            const allGroups = JSON.parse(groups.read())
            res.render('student', { foundUser, allGroups })
        }else{
            res.redirect('/')
        }
    } catch (error) {
        res.status(401).send({message: 'Bad request'})   
    }
})


// studentsInfo
app.post('/addStudent', cookieChecker, (req, res) => {

    
    const { phoneNumber, username, password, birtday, gender, group } = req.body

    const allUsers = JSON.parse(users.read())

    allUsers.push({ id: allUsers.length + 1, username, password, phoneNumber, birtday, gender, group, role: 'student'})

    users.write(allUsers)

    res.redirect('studentsInfo')
})

app.get('/studentsInfo', cookieChecker, (req, res) => {

    const allUsers = JSON.parse(users.read())
    const count = 1
    const allStudents = allUsers.filter(e => e.role == 'student')

    const allGroups = JSON.parse(groups.read())

    res.render('studentsInfo', { allGroups, allStudents, count })
})



// teachersInfo
app.post('/addTeacher', (req, res) => {
    
    
    const { phoneNumber, username, course, birtday, gender, password } = req.body
    
    const allUsers = JSON.parse(users.read())

   allUsers.push({ id:allUsers.length + 1, username, password, course, phoneNumber, birtday, gender, role: 'teacher'})

    users.write(allUsers)

    res.redirect('teachersInfo')
})

app.get('/teachersInfo', cookieChecker, (req, res) => {


    const allUsers = JSON.parse(users.read())
    const count = 1
    const allTeachers = allUsers.filter(e => e.role == 'teacher')

    const allCourses = JSON.parse(courses.read())

    res.render('teachersInfo', { allCourses, allTeachers, count })
})



// groups
app.post('/addGroup', (req, res) => {

    const { username, course, teacher } = req.body
    
    const allGroups = JSON.parse(groups.read())
    console.log(allGroups)

    allGroups.push({ id:allGroups.length + 1, username, course, teacher})

    groups.write(allGroups)

    res.redirect('/groupsInfo')
})

app.get('/groupsInfo', cookieChecker, (req, res) => {

    const allUsers = JSON.parse(users.read())
    const count = 1
    const allStudents = allUsers.filter(e => e.role == 'student')
    const allTeachers = allUsers.filter(e => e.role == 'teacher')

    const allCourses = JSON.parse(courses.read())
    const allGroups = JSON.parse(groups.read())

    res.render('groupsInfo', { allCourses, allTeachers, allGroups, allStudents, count})
})


// courseInfo
app.get('/courseInfo', cookieChecker, (req, res) => {

    const allCourses = JSON.parse(courses.read())
    
    res.render('courseInfo', { allCourses })
})


//logout

app.get('/logout', (req, res) => {
    res.clearCookie('token')
    res.render('login')
})

app.listen({ port: PORT}, () => {
    console.log('http://localhost:8000')
})