# Hylib Server

Backend created for HylibCMS in NodeJS

### Requisites
- [Git](https://git-scm.com/)
- [NodeJS](https://nodejs.org/) >= 16.x

If you want use yarn, you need:
- [Yarn](https://yarnpkg.com/)

### How to install

Open you bash and use npm install or yarn install to install the packages

```bash
npm install
```
OR
```bash
yarn install
```


### How to configure

- `config/default.json` has all hotel settings
- `/.env` put data from your database and other settings

```
PORT=3333 //port on which the server will listen `localhost:PORT`

DB_HOST=localhost //server ip that finds your mysql
DB_PORT=3306 //mysql port
DB_USERNAME=root //mysql username
DB_PASSWORD= //mysql password
DB_NAME=lella_cms //name database
``` 
### Development
To make changes, launch it with developer mode to apply changes after saving.
```bash
npm run start:dev
```

### Production
```bash
npm run start
```

### Developers
- Laxus
