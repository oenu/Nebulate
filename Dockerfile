FROM --platform=linux/arm64 node:lts-alpine as build-stage
WORKDIR /app
COPY package.json /app
COPY yarn.lock /app
RUN yarn install
COPY . /app
RUN yarn build
CMD ["yarn", "start"]