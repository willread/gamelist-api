FROM node:14
WORKDIR /usr/src/gamera-api
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080 
CMD [ "node", "api.js" ]
