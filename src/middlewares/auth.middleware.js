const { getAuth } = require('firebase-admin/auth')

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization']
        const split = authHeader.split(' ')
        const token = split[1]

        const decoded = await getAuth().verifyIdToken(token)
        req.session = decoded

        next()
    }

    catch (error) {
        res.status(400).json({
            message: 'invalid token'
        })
    }
}

module.exports = authMiddleware