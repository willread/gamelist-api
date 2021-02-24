FROM node:14-alpine
WORKDIR /usr/src/gamera-api
COPY package*.json ./
RUN apk add git
RUN npm install
COPY . .
CMD [ "npm", "run", "start" ]
