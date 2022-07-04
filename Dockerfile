FROM --platform=linux/amd64 node:lts-alpine as build-stage
WORKDIR /app
COPY package.json /app
COPY yarn.lock /app
RUN yarn install
COPY . /app
CMD ["yarn", "docker:dev"]