FROM node:10.15.1-alpine AS build

RUN apk --no-cache --virtual .gyp add \
    python \
    make \
    g++

WORKDIR /opt/membership-server

ADD . /opt/membership-server
RUN npm install
RUN npm run front:build

FROM node:10.15.1-alpine

WORKDIR /opt/membership-server
ADD . /opt/membership-server

ENV NODE_ENV=production

RUN apk --no-cache --virtual .gyp add \
    python \
    make \
    g++ \
    && npm install \
    && apk del .gyp

COPY --from=build /opt/membership-server/public/dist /opt/membership-server

ENTRYPOINT ["npm", "run", "start"]
