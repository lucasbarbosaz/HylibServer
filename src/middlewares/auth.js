const jwt = require('jsonwebtoken');
const requestIp = require('request-ip');

const auth = require('../config/auth.json');

module.exports = (req, res, next) => {
    const header = req.headers.authorization;

    if (!header) {
        return res.status(401).json({ error: 'Provide a valid token to access this resource.' });
    }

    const parts = header.split(' ');

    if (!parts.length == 2) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ error: 'Invalid token (malFormatted)' });
    }

    jwt.verify(token, auth.jwt_secret_key, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' });
		
		//checking that the user's IP does not match the IP of the user making the request
        //if yes, invalidate token
        if (decoded.ip !== requestIp.getClientIp(req)) return res.status(401).json({ error: 'Invalid token' });

        req.id = decoded.id; 

        return next();
    });
}