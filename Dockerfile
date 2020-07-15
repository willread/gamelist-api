FROM node:14
WORKDIR /usr/src/gamera-api
COPY package*.json ./
RUN npm install
COPY . .
CMD [ "node", "api.js" ]
