FROM --platform=linux/arm64 node:lts-alpine 
WORKDIR /app
COPY package.json /app
COPY yarn.lock /app
RUN yarn install
COPY . /app
RUN yarn build
RUN yarn global add pm2 
CMD ["yarn", "dockerpm2"]