# Hylib Server

Backend created for HylibCMS in NodeJS

### Requisites
- [Git](https://git-scm.com/)
- [NodeJS](https://nodejs.org/) >= 16.x

### How to install

Open you bash and use npm install or yarn install to install the packages

```bash
npm install
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

### You will need to create a reverse proxy using the web server you use for the port your backend server is running on. default: 3333
Examples:
- [Reverse proxy NGINX](https://www.hostinger.com/tutorials/how-to-set-up-nginx-reverse-proxy/)
- [Reverse proxy Apache](https://www.theserverside.com/blog/Coffee-Talk-Java-News-Stories-and-Opinions/How-to-configure-Apache-as-a-reverse-proxy-example)
- [Reverse proxy IIS](https://www.tevpro.com/blog/using-iis-as-a-reverse-proxy-server)

### Production
After doing proxy, run this command for the server to start

```bash
npm run start
```





### Developers
- Laxus
