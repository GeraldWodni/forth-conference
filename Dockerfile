ARG REG_HOSTNAME
ARG REG_FOLDER
FROM ${REG_HOSTNAME}/${REG_FOLDER}/kern.js-big:latest
MAINTAINER Gerald Wodni <gerald.wodni@gmail.com>

USER node
WORKDIR /usr/src/app/websites/forth-conference

COPY --chown=node:node . .
# note: npm fails when package-lock.json is not writable :P
COPY --chown=node:node package-lock.json .
RUN npm install

WORKDIR /usr/src/app
