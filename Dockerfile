FROM node:14
WORKDIR /usr/src/gamera-api
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3004
CMD [ "node", "api.js" ]
