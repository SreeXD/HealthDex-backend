const path = require('path')
require('dotenv').config({ path: path.join(__dirname, `./.env`) })
const express = require('express')
const cors = require('cors')
const admin = require("firebase-admin");
const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const serviceAccount = require('./config/serviceAccountKey.json')
const authMiddleware = require('./middlewares/auth.middleware')
const { getStorage } = require('firebase-admin/storage')
const { getFirestore } = require('firebase-admin/firestore')

const firebaseApp = initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

const getUrl = async (name) => {
    const file = getStorage()
        .bucket('gs://hash-39f73.appspot.com')
        .file(name)

    return (await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491'
    }))[0]
}

getStorage(firebaseApp)
getAuth(firebaseApp)
getFirestore(firebaseApp)

const app = express()
app.use(cors())

app.get('/user/search', authMiddleware, async (req, res) => {
    const users = await getAuth().listUsers()
    const filtered = users.users.map(x => x.email)

    res.status(200).json(filtered)
})

app.get('/user/search/:email', authMiddleware, async (req, res) => {
    const email = req.params.email
    const users = await getAuth().listUsers()

    const filtered = users.users.filter(x => x.email.startsWith(email)).map(x => x.email)

    res.status(200).json(filtered)
})

app.get('/user/get/:email', authMiddleware, async (req, res) => {
    const email = req.params.email
    const user = await getAuth().getUserByEmail(email)

    res.status(200).json(user)
})

app.get('/patient/:patientId/docs', authMiddleware, async (req, res) => {
    const patientId = req.params.patientId 

    const files = await getFirestore()
        .collection('patientFiles')
        .where('patient', '==', patientId)
        .get()

    const ret = []

    files.forEach(x => {
        const data = x.data()
        ret.push(data)
    })

    for (const x of ret) {
        x.url = await getUrl(x.fileName)
    }

    res.status(200).json(ret)
})

app.get('/me/docs', authMiddleware, async (req, res) => {
    const patientId = req.session.uid

    const files = await getFirestore()
        .collection('patientFiles')
        .where('patient', '==', patientId)
        .get()

    const ret = []

    files.forEach(x => {
        const data = x.data()
        ret.push(data)
    })

    for (const x of ret) {
        x.url = await getUrl(x.fileName)
    }

    res.status(200).json(ret)
})

app.post('/registerAsDoctor', authMiddleware, async (req, res) => {
    const uid = req.session.uid 
    await getAuth().setCustomUserClaims(uid, { doctor: true })

    res.status(200).end()
})

app.listen(process.env.PORT, () => {
    console.log('listening...')
})