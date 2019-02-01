FROM node:10.15.1-alpine AS build

RUN apk --no-cache --virtual build-dependencies add \
    python \
    make \
    g++

WORKDIR /opt/membership-server

ADD . /opt/membership-server
RUN npm install
RUN npm run front:build

FROM node:10.13.0-alpine

RUN apk --no-cache --virtual build-dependencies add \
    python \
    make \
    g++

WORKDIR /opt/membership-server
ENV NODE_ENV=production

ADD . /opt/membership-server
COPY --from=build /opt/membership-server/public/dist /opt/membership-server/public/dist
RUN npm install

ENTRYPOINT ["npm", "run", "start"]
