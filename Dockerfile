FROM node:10.13.0-alpine

WORKDIR /opt/membership-server
ENV NODE_ENV=production

ADD . /opt/membership-server
RUN npm install

ENTRYPOINT ["npm", "run", "start"]
